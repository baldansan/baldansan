import { resolveWorkbookListeningItemAudio } from "@/lib/lesson/workbook-listening-audio";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";

export type ListeningSubQuestion =
  | {
      kind: "choice";
      n?: number;
      prompt: string;
      options: string[];
      answer: string;
    }
  | {
      kind: "tf";
      n?: number;
      prompt: string;
      answer: boolean;
    };

export type ExerciseQuestion =
  | {
      kind: "choice";
      n?: number;
      section: string;
      instruction?: string;
      audio?: string;
      zh?: string;
      prompt: string;
      options: string[];
      answer: string;
      /** Slash-separated alternatives (e.g. 忽然 / 突然). */
      acceptableAnswers?: string[];
    }
  | {
      kind: "tf";
      n?: number;
      section: string;
      instruction?: string;
      audio?: string;
      prompt: string;
      answer: boolean;
    }
  | {
      kind: "listening_group";
      section: string;
      instruction?: string;
      audio: string;
      items: ListeningSubQuestion[];
    }
  | {
      kind: "order";
      n?: number;
      section: string;
      instruction?: string;
      prompt: string;
      tokens: string[];
      keys: string[];
      answer: string[];
    }
  | {
      kind: "scramble";
      n?: number;
      section: string;
      instruction?: string;
      prompt: string;
      tokens: string[];
      answer: string;
    };

function valuesOf(o: unknown): { values: string[]; byKey: Record<string, string> } {
  if (Array.isArray(o)) {
    const values = o.map((x) => String(x));
    return { values, byKey: {} };
  }
  const byKey: Record<string, string> = {};
  const values: string[] = [];
  if (o && typeof o === "object") {
    for (const k of Object.keys(o as Record<string, unknown>)) {
      const v = String((o as Record<string, unknown>)[k]);
      byKey[k] = v;
      values.push(v);
    }
  }
  return { values, byKey };
}

function resolveAns(ans: unknown, byKey: Record<string, string>): string {
  const key = String(ans);
  return byKey[key] != null ? byKey[key] : key;
}

function toBool(a: unknown): boolean {
  return /^(true|对|正确|√|t|right|yes|y|1)$/i.test(String(a).trim());
}

function trimAudio(value: unknown): string | undefined {
  const s = String(value ?? "").trim();
  return s || undefined;
}

function parseAnswerAlternatives(answer: unknown): string[] {
  const raw = String(answer ?? "").trim();
  if (!raw) return [];
  const withoutNote = raw.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const parts = withoutNote.split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [raw];
}

export function buildListeningSubQuestion(
  it: Record<string, unknown>
): ListeningSubQuestion | null {
  if (it.options != null) {
    const { values, byKey } = valuesOf(it.options);
    const prompt =
      it.question_zh != null
        ? String(it.question_zh)
        : it.statement_zh != null
          ? String(it.statement_zh)
          : it.statement != null
            ? String(it.statement)
            : "Сонссоноо сонгоорой:";
    return {
      kind: "choice",
      n: Number(it.n) || undefined,
      prompt,
      options: values,
      answer: resolveAns(it.answer, byKey),
    };
  }
  const statement =
    it.question_zh != null
      ? String(it.question_zh)
      : it.statement_zh != null
        ? String(it.statement_zh)
        : it.statement != null
          ? String(it.statement)
          : null;
  if (statement == null) return null;
  return {
    kind: "tf",
    n: Number(it.n) || undefined,
    prompt: statement,
    answer: toBool(it.answer),
  };
}

type ListeningDraft = {
  sub: ListeningSubQuestion;
  audio?: string;
  audioKey: string;
};

function listeningAudioKey(
  rawPath: string | undefined,
  base: string | undefined,
  soloId: string | number
): string {
  const path = rawPath?.trim();
  if (!path) return `__solo__:${soloId}`;
  return path;
}

function flushListeningDrafts(
  out: ExerciseQuestion[],
  drafts: ListeningDraft[],
  section: string,
  instruction?: string
): void {
  let i = 0;
  while (i < drafts.length) {
    const key = drafts[i].audioKey;
    const group: ListeningDraft[] = [];
    while (i < drafts.length && drafts[i].audioKey === key) {
      group.push(drafts[i]);
      i++;
    }
    const audio = group[0].audio;
    if (group.length > 1 && audio) {
      out.push({
        kind: "listening_group",
        section,
        instruction,
        audio,
        items: group.map((g) => g.sub),
      });
      continue;
    }
    const g0 = group[0];
    if (g0.sub.kind === "choice") {
      out.push({
        ...g0.sub,
        section,
        instruction,
        audio: g0.audio,
      });
    } else {
      out.push({
        ...g0.sub,
        section,
        instruction,
        audio: g0.audio,
      });
    }
  }
}

function buildTextbookQuestions(tb: Record<string, unknown>): ExerciseQuestion[] {
  const out: ExerciseQuestion[] = [];

  const banks = (tb.fill_in as { banks?: unknown[] } | undefined)?.banks ?? [];
  for (const b of banks) {
    const bank = b as { words?: unknown[]; items?: unknown[] };
    const words: string[] = (bank?.words ?? []).map((w) => String(w));
    for (const it of bank?.items ?? []) {
      const item = it as { n?: number; q?: unknown; answer?: unknown };
      if (item?.q == null || item?.answer == null) continue;
      out.push({
        kind: "choice",
        n: item.n,
        section: "Үг нөхөх",
        instruction: (tb.fill_in as { instruction_mn?: string })?.instruction_mn,
        prompt: String(item.q),
        options: words.length ? words : [String(item.answer)],
        answer: String(item.answer),
      });
    }
  }

  for (const section of (tb.sections as unknown[]) ?? []) {
    if (!section || typeof section !== "object") continue;
    const sec = section as {
      title_mn?: string;
      word_bank?: unknown[];
      items?: unknown[];
    };
    const instruction = sec.title_mn ? String(sec.title_mn) : undefined;
    const wordBank: string[] = (sec.word_bank ?? []).map((w) => String(w));

    for (const it of sec.items ?? []) {
      if (!it || typeof it !== "object") continue;
      const item = it as {
        n?: number;
        q?: unknown;
        answer?: unknown;
        options?: unknown;
      };
      if (item.q == null) continue;

      if (item.options != null) {
        const { values, byKey } = valuesOf(item.options);
        out.push({
          kind: "choice",
          n: item.n,
          section: instruction ?? "Дасгал",
          instruction,
          prompt: String(item.q),
          options: values,
          answer: resolveAns(item.answer, byKey),
        });
        continue;
      }

      if (item.answer == null) continue;

      const alternatives = parseAnswerAlternatives(item.answer);
      const options = wordBank.length > 0 ? wordBank : alternatives;
      out.push({
        kind: "choice",
        n: item.n,
        section: instruction ?? "Дасгал",
        instruction,
        prompt: String(item.q),
        options,
        answer: alternatives[0],
        acceptableAnswers: alternatives.length > 1 ? alternatives : undefined,
      });
    }
  }

  return out;
}

function buildWorkbookQuestions(
  wb: Record<string, unknown>,
  base: string | undefined
): ExerciseQuestion[] {
  const out: ExerciseQuestion[] = [];

  for (const part of (wb.listening as { parts?: unknown[] } | undefined)?.parts ?? []) {
    const partRecord =
      part && typeof part === "object" ? (part as Record<string, unknown>) : null;
    const instruction = partRecord?.instruction_mn
      ? String(partRecord.instruction_mn)
      : undefined;
    const drafts: ListeningDraft[] = [];

    for (const it of (partRecord?.items as unknown[]) ?? []) {
      const itemRecord =
        it && typeof it === "object" ? (it as Record<string, unknown>) : null;
      if (!itemRecord) continue;
      const sub = buildListeningSubQuestion(itemRecord);
      if (!sub) continue;
      const audio =
        partRecord != null
          ? resolveWorkbookListeningItemAudio(partRecord, itemRecord)
          : trimAudio(itemRecord.audio) || trimAudio(itemRecord.audioFile);
      drafts.push({
        sub,
        audio,
        audioKey: listeningAudioKey(audio, base, sub.n ?? drafts.length),
      });
    }

    flushListeningDrafts(out, drafts, "Сонсгол", instruction);
  }

  for (const b of (wb.reading as { select_word?: unknown[] } | undefined)?.select_word ??
    []) {
    const bank = b as { bank?: unknown; items?: unknown[] };
    const { values, byKey } = valuesOf(bank?.bank ?? {});
    for (const it of bank?.items ?? []) {
      const item = it as { n?: number; q?: unknown; answer?: unknown };
      if (item?.q == null) continue;
      out.push({
        kind: "choice",
        n: item.n,
        section: "Үг сонгох",
        prompt: String(item.q),
        options: values,
        answer: resolveAns(item.answer, byKey),
      });
    }
  }

  for (const part of (wb.reading as { parts?: unknown[] } | undefined)?.parts ?? []) {
    if (!part || typeof part !== "object") continue;
    const sec = part as {
      instruction_mn?: string;
      passage_zh?: string;
      items?: unknown[];
    };
    const instruction = sec.instruction_mn ? String(sec.instruction_mn) : undefined;
    const zh = sec.passage_zh ? String(sec.passage_zh) : undefined;

    for (const it of sec.items ?? []) {
      if (!it || typeof it !== "object") continue;
      const item = it as {
        n?: number;
        q?: unknown;
        question_zh?: unknown;
        options?: unknown;
        answer?: unknown;
      };
      const { values, byKey } = valuesOf(item.options ?? {});
      if (!values.length) continue;
      const prompt =
        item.question_zh != null
          ? String(item.question_zh)
          : item.q != null
            ? String(item.q)
            : "";
      if (!prompt) continue;
      out.push({
        kind: "choice",
        n: item.n,
        section: "Унших",
        instruction,
        zh,
        prompt,
        options: values,
        answer: resolveAns(item.answer, byKey),
      });
    }
  }

  for (const it of (wb.reading as { ordering?: unknown[] } | undefined)?.ordering ?? []) {
    const item = it as { n?: number; parts?: Record<string, unknown>; answer?: unknown };
    const parts = item?.parts ?? {};
    const keys = Object.keys(parts);
    const tokens = keys.map((k) => String(parts[k]));
    const answer = String(item?.answer ?? "")
      .split("")
      .filter(Boolean);
    if (keys.length && answer.length) {
      out.push({
        kind: "order",
        n: item.n,
        section: "Дараалал",
        prompt: "Зөв дарааллаар нь өрөөрэй:",
        tokens,
        keys,
        answer,
      });
    }
  }

  for (const it of (wb.reading as { comprehension?: unknown[] } | undefined)?.comprehension ??
    []) {
    const item = it as {
      n?: number;
      passage_zh?: string;
      q_zh?: unknown;
      options?: unknown;
      answer?: unknown;
    };
    const { values, byKey } = valuesOf(item?.options ?? {});
    out.push({
      kind: "choice",
      n: item.n,
      section: "Унших ойлголт",
      zh: item?.passage_zh ? String(item.passage_zh) : undefined,
      prompt: String(item?.q_zh ?? ""),
      options: values,
      answer: resolveAns(item.answer, byKey),
    });
  }

  const ms = wb.writing as { instruction_mn?: string; items?: unknown[] } | undefined;
  for (const it of ms?.items ?? []) {
    const item = it as { n?: number; words?: unknown[]; answer?: unknown };
    const words: string[] = (item?.words ?? []).map((w) => String(w));
    if (words.length && item?.answer != null) {
      out.push({
        kind: "scramble",
        n: item.n,
        section: "Өгүүлбэр эвлүүлэх",
        instruction: ms?.instruction_mn,
        prompt: "Үгсийг эвлүүлж зөв өгүүлбэр болгоорой:",
        tokens: words,
        answer: String(item.answer),
      });
    }
  }

  return out;
}

/** Build interactive exercise steps from textbook or workbook package fields. */
export function buildExerciseQuestions(
  lesson: HskLessonPackage,
  source: "textbook" | "workbook"
): ExerciseQuestion[] {
  try {
    if (source === "textbook") {
      const tb = lesson.exercises_textbook;
      if (!tb || typeof tb !== "object") return [];
      return buildTextbookQuestions(tb as Record<string, unknown>);
    }

    const wb = lesson.exercises_workbook;
    if (!wb || typeof wb !== "object") return [];
    return buildWorkbookQuestions(
      wb as Record<string, unknown>,
      lesson.audio_base_path
    );
  } catch {
    return [];
  }
}

export function countGradableExerciseQuestions(questions: ExerciseQuestion[]): number {
  return questions.reduce((sum, q) => {
    if (q.kind === "listening_group") return sum + q.items.length;
    return sum + 1;
  }, 0);
}

export function exerciseSourceHasPlayerContent(
  lesson: HskLessonPackage,
  source: "textbook" | "workbook"
): boolean {
  return countGradableExerciseQuestions(buildExerciseQuestions(lesson, source)) > 0;
}

export type ExercisePracticeSource = "textbook" | "workbook" | "both";

/** Textbook + workbook steps for lesson-path practice (listening + шалгалтын дасгал). */
export function buildMergedExerciseQuestions(lesson: HskLessonPackage): ExerciseQuestion[] {
  return [
    ...buildExerciseQuestions(lesson, "textbook"),
    ...buildExerciseQuestions(lesson, "workbook"),
  ];
}

export function resolveExercisePracticeSource(
  lesson: HskLessonPackage
): ExercisePracticeSource | null {
  const hasTextbook = exerciseSourceHasPlayerContent(lesson, "textbook");
  const hasWorkbook = exerciseSourceHasPlayerContent(lesson, "workbook");
  if (hasTextbook && hasWorkbook) return "both";
  if (hasTextbook) return "textbook";
  if (hasWorkbook) return "workbook";
  return null;
}
