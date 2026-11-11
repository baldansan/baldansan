// app/api/mock-test/grade-writing/route.ts — Бичих хэсгийн AI үнэлгээ.
// POST { questionId, answer } → WritingGradeReply (4 шалгуур, монгол зөвлөгөө, засвар)
// Эссэ (HSK5 №99/100), товчлол 缩写 (HSK6 №101), зургаар өгүүлбэр (HSK4 №96–100).
import { NextResponse } from "next/server";
import { chatComplete, hasAiProvider, parseJsonObject, type ChatMessage } from "@/lib/ai/chat-provider";
import type { WritingGradeReply, WritingGradeCriterion } from "@/lib/mock-test/writing-grade";
import { createServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Хэрэглэгч бүр минутад 6 үнэлгээ. */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 6;
const hits = new Map<string, number[]>();
function rateLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (hits.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    hits.set(userId, arr);
    return true;
  }
  arr.push(now);
  hits.set(userId, arr);
  if (hits.size > 5000) hits.clear();
  return false;
}

const MAX_ANSWER_CHARS = 1200;
const MAX_STEM_CHARS = 2500;

type QRow = {
  id: string;
  test_id: string;
  q_no: number;
  q_type: string;
  stem: string | null;
  correct_answer: string | null;
  image_url: string | null;
  mock_tests: { hsk_level: number } | { hsk_level: number }[] | null;
};

type TaskSpec = {
  name_zh: string;
  requirement_zh: string;
  criteria: [string, string, string, string];
};

function taskSpec(qType: string, level: number): TaskSpec {
  if (qType === "summary") {
    return {
      name_zh: "HSK6 书写：缩写",
      requirement_zh:
        "学生读了一篇约1000字的短文，需要在35分钟内把它缩写成约400字的短文，自拟标题，只需复述文章内容，不加入自己的观点。",
      criteria: ["Агуулга (гол санаа бүрэн, 400 орчим үг)", "Үгийн сан", "Дүрэм/өгүүлбэр", "Бүтэц ба гарчиг"],
    };
  }
  if (qType === "essay_picture") {
    return {
      name_zh: `HSK${level} 书写：看图写短文`,
      requirement_zh: "学生看一张图片，写一篇80字左右的短文，内容必须与图片相关。",
      criteria: ["Агуулга (зурагтай холбоотой, 80 орчим үг)", "Үгийн сан", "Дүрэм/өгүүлбэр", "Уялдаа холбоо"],
    };
  }
  if (qType === "picture_sentence") {
    return {
      name_zh: `HSK${level} 书写：看图用词造句`,
      requirement_zh: "学生看一张图片和一个给定的词语，用这个词语写一个与图片相关的句子。",
      criteria: ["Өгсөн үгийг зөв хэрэглэсэн", "Зурагтай тохирсон", "Дүрэм", "Байгалийн хэллэг"],
    };
  }
  return {
    name_zh: `HSK${level} 书写：用词写短文`,
    requirement_zh: "学生用给出的5个词语写一篇80字左右的短文，5个词都必须用到。",
    criteria: ["Өгсөн 5 үгийг бүгдийг зөв хэрэглэсэн", "Үгийн сан", "Дүрэм/өгүүлбэр", "Агуулга ба уялдаа (80 орчим үг)"],
  };
}

function clampInt(v: unknown, lo: number, hi: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

export async function GET() {
  return NextResponse.json({ ai: hasAiProvider() });
}

export async function POST(request: Request) {
  if (!hasAiProvider()) {
    return NextResponse.json({ ok: false, fallback: true, message: "AI үнэлгээ тохируулаагүй." }, { status: 503 });
  }
  if (!hasServerSupabaseConfig) {
    return NextResponse.json({ ok: false, message: "Supabase тохируулагдаагүй." }, { status: 503 });
  }
  const client = await createServerSupabaseClient();
  const { data: auth } = (await client?.auth.getUser()) ?? { data: { user: null } };
  const userId = auth.user?.id;
  if (!userId || !client) {
    return NextResponse.json({ ok: false, message: "Нэвтэрсэн байх шаардлагатай." }, { status: 401 });
  }
  if (rateLimited(userId)) {
    return NextResponse.json({ ok: false, message: "Хэт олон хүсэлт — 1 минут хүлээгээрэй." }, { status: 429 });
  }

  let body: { questionId?: string; answer?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Буруу хүсэлт." }, { status: 400 });
  }
  const questionId = String(body.questionId ?? "").trim();
  const answer = String(body.answer ?? "").trim().slice(0, MAX_ANSWER_CHARS);
  if (!questionId || answer.length < 2) {
    return NextResponse.json({ ok: false, message: "Хариулт хоосон байна." }, { status: 400 });
  }

  const { data: q, error } = await client
    .from("mock_test_questions")
    .select("id, test_id, q_no, q_type, stem, correct_answer, image_url, mock_tests(hsk_level)")
    .eq("id", questionId)
    .maybeSingle<QRow>();
  if (error || !q) {
    return NextResponse.json({ ok: false, message: "Асуулт олдсонгүй." }, { status: 404 });
  }
  const mt = Array.isArray(q.mock_tests) ? q.mock_tests[0] : q.mock_tests;
  const level = Number(mt?.hsk_level ?? 5);
  const spec = taskSpec(q.q_type, level);

  const system = [
    "你是一位经验丰富的 HSK 书写阅卷老师，同时精通蒙古语（西里尔文）。你要给一位蒙古学生的作文打分并用蒙古语讲评。",
    `题型：${spec.name_zh}。要求：${spec.requirement_zh}`,
    "评分规则：四项标准各 1–5 分（5 最好），总分 score 0–100 按 HSK 阅卷尺度（60 分为及格线）。字数严重不足或完全跑题要重扣。",
    "corrections 列出学生作文里的具体错误（错别字、搭配、语法、标点），每条给出原句片段 wrong、改正 right、用蒙古语说明 why_mn，最多 8 条，没有错误则为空数组。",
    "improved_zh：在尽量保留学生原意和原句的基础上改好的全文（不要重写成完全不同的文章）。",
    "advice_mn：用蒙古语写 2–4 句具体建议——下次怎么写得更好。语气温和、鼓励。",
    "所有 *_mn 字段只用蒙古语西里尔文，不要用拉丁转写，不要夹杂汉语解释（汉语例词可以保留）。",
    "严格只输出一个 JSON 对象，不要其他文字：",
    `{"score":0-100,"word_count":整数,"criteria":[{"name_mn":"${spec.criteria[0]}","score":1-5,"comment_mn":"…"},{"name_mn":"${spec.criteria[1]}","score":1-5,"comment_mn":"…"},{"name_mn":"${spec.criteria[2]}","score":1-5,"comment_mn":"…"},{"name_mn":"${spec.criteria[3]}","score":1-5,"comment_mn":"…"}],"corrections":[{"wrong":"…","right":"…","why_mn":"…"}],"improved_zh":"…","advice_mn":"…"}`,
  ].join("\n");

  const userParts: string[] = [];
  if (q.stem) userParts.push(`【题目】\n${q.stem.slice(0, MAX_STEM_CHARS)}`);
  if (q.image_url && !q.stem) userParts.push("【题目】看图写作（图片略）。");
  if (q.correct_answer && q.q_type === "summary") {
    userParts.push(`【参考缩写（仅供对照要点，不要求学生一致）】\n${q.correct_answer.slice(0, 900)}`);
  } else if (q.correct_answer) {
    userParts.push(`【参考答案】\n${q.correct_answer.slice(0, 400)}`);
  }
  userParts.push(`【学生作文】\n${answer}`);

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: userParts.join("\n\n") },
  ];

  const result = await chatComplete(messages, { json: true, temperature: 0.3, maxTokens: 1400, timeoutMs: 40_000 });
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.error }, { status: result.status === 503 ? 503 : 502 });
  }
  const parsed = parseJsonObject<Record<string, unknown>>(result.content);
  if (!parsed) {
    return NextResponse.json({ ok: false, message: "AI хариу уншигдсангүй." }, { status: 502 });
  }

  const rawCriteria = Array.isArray(parsed.criteria) ? (parsed.criteria as Record<string, unknown>[]) : [];
  const criteria: WritingGradeCriterion[] = spec.criteria.map((name, i) => {
    const c = rawCriteria[i] ?? {};
    return {
      name_mn: typeof c.name_mn === "string" && c.name_mn.trim() ? c.name_mn.trim() : name,
      score: clampInt(c.score, 1, 5, 3),
      comment_mn: typeof c.comment_mn === "string" ? c.comment_mn.trim() : "",
    };
  });
  const rawCorr = Array.isArray(parsed.corrections) ? (parsed.corrections as Record<string, unknown>[]) : [];
  const corrections = rawCorr
    .filter((c) => typeof c.wrong === "string" && typeof c.right === "string")
    .slice(0, 8)
    .map((c) => ({
      wrong: String(c.wrong).trim(),
      right: String(c.right).trim(),
      why_mn: typeof c.why_mn === "string" ? c.why_mn.trim() : "",
    }));

  const score = clampInt(parsed.score, 0, 100, 50);
  const reply: WritingGradeReply = {
    score,
    passed: score >= 60,
    wordCount: clampInt(parsed.word_count, 0, 5000, answer.replace(/\s/g, "").length),
    criteria,
    corrections,
    improvedZh: typeof parsed.improved_zh === "string" ? parsed.improved_zh.trim() : "",
    adviceMn: typeof parsed.advice_mn === "string" ? parsed.advice_mn.trim() : "",
    model: result.model,
  };
  return NextResponse.json({ ok: true, reply });
}
