import { NextResponse } from "next/server";
import { grammarPointSlug, parseGrammarQuestionId } from "@/lib/lesson/grammar-question-id";
import { createAnonServerSupabaseClient } from "@/lib/supabase/server";
import type { HskPackageGrammarPoint } from "@/types/hsk-lesson-package";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * «Миний алдаанууд»-д АСУУЛТЫГ нь харуулахын тулд: оролдлогын бүртгэлд зөвхөн
 * асуултын дугаар, хариултууд хадгалагддаг. Энд дугаараар нь хичээлийн агуулгаас
 * асуултын бичвэр, эх, тайлбарыг олж буцаана. Агуулга нь нийтэд нээлттэй хичээлийн
 * материал тул нэвтрэлт шаардахгүй.
 */

type Item = { lessonId: string; questionId: string };
export type MistakeContext = {
  question: string | null;
  passage: string | null;
  explanation: string | null;
};
type LessonInfo = { title: string; courseId: string; orderIndex: number | null };

type LessonCache = {
  info: LessonInfo;
  workbook: unknown;
  grammar: HskPackageGrammarPoint[];
  at: number;
};
const lessonCache = new Map<string, LessonCache>();
const CACHE_MS = 10 * 60_000;

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

function pick(o: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = str(o[k]);
    if (v) return v;
  }
  return null;
}

/** Ажлын дэвтрийн мод дотроос n дугаартай асуултыг олно (бүтэц хичээл бүрт өөр). */
function findByNumber(node: unknown, n: number, depth = 0): Record<string, unknown> | null {
  if (!node || depth > 8) return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = findByNumber(child, n, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  const o = node as Record<string, unknown>;
  const num = o.n ?? o.no ?? o.number ?? o.questionNo;
  if (Number(num) === n && (o.answer !== undefined || o.q_zh !== undefined || o.question !== undefined)) {
    return o;
  }
  for (const v of Object.values(o)) {
    if (v && typeof v === "object") {
      const hit = findByNumber(v, n, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

function fromWorkbookItem(o: Record<string, unknown>): MistakeContext {
  return {
    question: pick(o, ["q_zh", "question", "question_zh", "stem", "prompt", "prompt_mn", "sentence_zh", "q_mn"]),
    passage: pick(o, ["passage_zh", "text_zh", "script_zh", "dialogue_zh", "context_zh"]),
    explanation: pick(o, ["explanation_mn", "explanation", "note_mn"]),
  };
}

async function loadLessons(ids: string[]): Promise<void> {
  const now = Date.now();
  const missing = ids.filter((id) => {
    const c = lessonCache.get(id);
    return !c || now - c.at > CACHE_MS;
  });
  if (missing.length === 0) return;
  const client = createAnonServerSupabaseClient();
  if (!client) return;
  // source_note нь том (хичээл бүр ~100KB) тул цөөн цөөнөөр татна.
  for (let i = 0; i < missing.length; i += 6) {
    const { data } = await client
      .from("lessons")
      .select("id, title, course_id, order_index, source_note")
      .in("id", missing.slice(i, i + 6));
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      let study: Record<string, unknown> = {};
      try {
        const note = typeof row.source_note === "string" ? JSON.parse(row.source_note) : row.source_note;
        study = ((note as Record<string, unknown>)?.hskStudyContent ?? {}) as Record<string, unknown>;
      } catch {
        /* агуулгагүй хичээл — зөвхөн гарчиг */
      }
      lessonCache.set(String(row.id), {
        info: {
          title: String(row.title ?? row.id),
          courseId: String(row.course_id ?? ""),
          orderIndex: row.order_index == null ? null : Number(row.order_index),
        },
        workbook: study.workbook ?? null,
        grammar: Array.isArray(study.grammar) ? (study.grammar as HskPackageGrammarPoint[]) : [],
        at: now,
      });
    }
  }
}

export async function POST(request: Request) {
  let items: Item[] = [];
  try {
    const body = (await request.json()) as { items?: Item[] };
    items = (body.items ?? [])
      .filter((i) => i && typeof i.lessonId === "string" && typeof i.questionId === "string")
      .slice(0, 300);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const client = createAnonServerSupabaseClient();
  const contexts: Record<string, MistakeContext> = {};
  const lessons: Record<string, LessonInfo> = {};
  if (!client || items.length === 0) {
    return NextResponse.json({ ok: true, contexts, lessons });
  }

  const lessonIds = [...new Set(items.map((i) => i.lessonId))].slice(0, 60);
  await loadLessons(lessonIds);
  for (const id of lessonIds) {
    const c = lessonCache.get(id);
    if (c) lessons[id] = c.info;
  }

  // --- Сорилын асуултууд (quiz:db:N, quiz:N) ---
  const dbIds = new Set<number>();
  const byOrder = new Map<string, number[]>();
  const wordIds = new Set<number>();
  for (const it of items) {
    const db = /^quiz:db:(\d+)$/.exec(it.questionId);
    if (db) {
      dbIds.add(Number(db[1]));
      continue;
    }
    const ord = /^quiz:(\d+)$/.exec(it.questionId);
    if (ord) {
      byOrder.set(it.lessonId, [...(byOrder.get(it.lessonId) ?? []), Number(ord[1])]);
      continue;
    }
    const word = /^word:(\d+)$/.exec(it.questionId);
    if (word) wordIds.add(Number(word[1]));
  }

  const quizById = new Map<number, MistakeContext>();
  const quizByOrder = new Map<string, MistakeContext>();
  if (dbIds.size > 0) {
    const { data } = await client
      .from("quiz_questions")
      .select("id, question, explanation")
      .in("id", [...dbIds]);
    for (const q of data ?? []) {
      quizById.set(Number(q.id), {
        question: str(q.question),
        passage: null,
        explanation: str(q.explanation),
      });
    }
  }
  if (byOrder.size > 0) {
    const { data } = await client
      .from("quiz_questions")
      .select("lesson_id, order_index, question, explanation")
      .in("lesson_id", [...byOrder.keys()]);
    for (const q of data ?? []) {
      quizByOrder.set(`${q.lesson_id}:${q.order_index}`, {
        question: str(q.question),
        passage: null,
        explanation: str(q.explanation),
      });
    }
  }
  const words = new Map<number, MistakeContext>();
  if (wordIds.size > 0) {
    const { data } = await client
      .from("hsk_words")
      .select("id, simplified, pinyin")
      .in("id", [...wordIds]);
    for (const w of data ?? []) {
      words.set(Number(w.id), {
        question: `${w.simplified}${w.pinyin ? ` (${w.pinyin})` : ""}`,
        passage: null,
        explanation: null,
      });
    }
  }

  for (const it of items) {
    const key = `${it.lessonId}::${it.questionId}`;
    let ctx: MistakeContext | null = null;
    const db = /^quiz:db:(\d+)$/.exec(it.questionId);
    const ord = /^quiz:(\d+)$/.exec(it.questionId);
    const word = /^word:(\d+)$/.exec(it.questionId);
    const ex = /^ex:(\d+)$/.exec(it.questionId);
    const lesson = lessonCache.get(it.lessonId);

    if (db) ctx = quizById.get(Number(db[1])) ?? null;
    else if (ord) ctx = quizByOrder.get(`${it.lessonId}:${ord[1]}`) ?? null;
    else if (word) ctx = words.get(Number(word[1])) ?? null;
    else if (ex && lesson?.workbook) {
      const hit = findByNumber(lesson.workbook, Number(ex[1]));
      if (hit) ctx = fromWorkbookItem(hit);
    } else if (lesson && lesson.grammar.length > 0) {
      // Дүрмийн дасгал: «<slug>-ex-N» эсвэл «<slug>-check».
      const parsed = parseGrammarQuestionId(it.questionId);
      const index = lesson.grammar.findIndex((p, i) => grammarPointSlug(p, i) === parsed.pointSlug);
      const point = index >= 0 ? (lesson.grammar[index] as unknown as Record<string, unknown>) : null;
      if (point) {
        const label = str(point.point);
        if (parsed.kind === "check") {
          const check = (point.check ?? {}) as Record<string, unknown>;
          ctx = {
            question: pick(check, ["question", "q_zh", "prompt"]),
            passage: label ? `Дүрэм: ${label}` : null,
            explanation: pick(check, ["explanation_mn", "explanation"]) ?? str(point.gloss_mn),
          };
        } else if (parsed.exerciseIndex != null) {
          const list = Array.isArray(point.exercises) ? (point.exercises as Record<string, unknown>[]) : [];
          const exItem = list[parsed.exerciseIndex];
          if (exItem) {
            ctx = {
              question: pick(exItem, ["question", "q_zh", "prompt", "sentence"]),
              passage: label ? `Дүрэм: ${label}` : null,
              explanation:
                pick(exItem, ["explanation_mn", "explanation", "explanation_wrong_mn"]) ??
                str(point.gloss_mn),
            };
          }
        }
      }
    }
    if (ctx && (ctx.question || ctx.passage || ctx.explanation)) contexts[key] = ctx;
  }

  return NextResponse.json({ ok: true, contexts, lessons });
}
