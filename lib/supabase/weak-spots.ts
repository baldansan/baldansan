import {
  buildAreaStats,
  buildGrammarStats,
  buildLessonStats,
  buildVerdict,
  collectMissedWordCandidates,
  isGradedAttempt,
  type AreaStat,
  type GrammarStat,
  type LessonStat,
  type MissedWordCandidate,
  type QuizWrongAnswer,
  type WeakSpotAttempt,
  type WeakSpotVerdict,
} from "@/lib/analytics/weak-spots";
import { parseQuizAttemptAnswers } from "@/lib/quiz-answers";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

/** Хэдэн хариултын цонхыг шинжлэх вэ (шинээс хуучин руу). */
export const WEAK_SPOT_ATTEMPT_LIMIT = 1000;
const QUIZ_ATTEMPT_LIMIT = 200;
const MISSED_WORD_LIMIT = 24;
const CHUNK = 200;

export type MissedWord = {
  wordId: number;
  simplified: string;
  pinyin: string | null;
  meaningMn: string | null;
  hskLevel: string | null;
  /** Нөхцөл/хэрэглэгдэхүүн үг — SRS-д ордоггүй. */
  isFunctionWord: boolean;
  wrongCount: number;
  lastWrongAt: string;
  fromWordPractice: boolean;
  fromQuiz: boolean;
};

export type WeakSpotsData = {
  /** Шинжилсэн нийт хариулт (self_* мөрүүдийг хассан). */
  attemptCount: number;
  wrongCount: number;
  firstAttemptAt: string | null;
  lastAttemptAt: string | null;
  verdict: WeakSpotVerdict;
  areas: AreaStat[];
  lessons: LessonStat[];
  grammar: GrammarStat[];
  lessonTitles: Record<string, string>;
  missedWords: MissedWord[];
  /** Үгийн санд тохироогүй буруу хариултын тоо (зохиохгүй, ил хэлнэ). */
  unresolvedWordCount: number;
  /** Quiz-ийн answers JSON-оос уншсан буруу хариултын тоо. */
  quizAnswerWrongCount: number;
};

export type WeakSpotsResult = {
  data: WeakSpotsData | null;
  error: string | null;
};

type AttemptRow = {
  lesson_id: string;
  stage: string;
  question_id: string;
  question_type: string;
  is_correct: boolean;
  selected_answer: string | null;
  correct_answer: string | null;
  created_at: string;
};

type HskWordLookupRow = {
  id: number;
  simplified: string;
  pinyin: string | null;
  meaning_mn: string | null;
  hsk_level: string | null;
  is_function_word: boolean | null;
};

const WORD_LOOKUP_SELECT =
  "id, simplified, pinyin, meaning_mn, hsk_level, is_function_word";

function chunked<T>(values: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < values.length; i += size) {
    out.push(values.slice(i, i + size));
  }
  return out;
}

/**
 * Нэр дэвшигч текстүүдийг hsk_words-оос хайна: эхлээд ханзаар, дараа нь
 * пиньинь, эцэст нь монгол утгаар. Олдоогүйг ЗОХИОХГҮЙ — хасна.
 */
async function resolveWordsByText(
  texts: string[]
): Promise<Map<string, HskWordLookupRow>> {
  const found = new Map<string, HskWordLookupRow>();
  if (!supabase || texts.length === 0) return found;

  const columns: Array<keyof HskWordLookupRow> = [
    "simplified",
    "pinyin",
    "meaning_mn",
  ];

  let remaining = [...new Set(texts)];

  for (const column of columns) {
    if (remaining.length === 0) break;
    for (const chunk of chunked(remaining)) {
      const { data, error } = await supabase
        .from("hsk_words")
        .select(WORD_LOOKUP_SELECT)
        .in(column as string, chunk);
      if (error) throw new Error(error.message);
      for (const row of (data ?? []) as unknown as HskWordLookupRow[]) {
        const key = (row[column] as string | null)?.trim();
        if (!key || found.has(key)) continue;
        found.set(key, row);
      }
    }
    remaining = remaining.filter((text) => !found.has(text));
  }

  return found;
}

async function fetchLessonTitles(
  lessonIds: string[]
): Promise<Record<string, string>> {
  const titles: Record<string, string> = {};
  if (!supabase || lessonIds.length === 0) return titles;

  for (const chunk of chunked([...new Set(lessonIds)])) {
    const { data, error } = await supabase
      .from("lessons")
      .select("id, title")
      .in("id", chunk);
    // Гарчиг олдохгүй бол lesson_id-гаар нь харуулна — алдаа шидэхгүй.
    if (error) return titles;
    for (const row of (data ?? []) as { id: string; title: string | null }[]) {
      const title = row.title?.trim();
      if (row.id && title) titles[String(row.id)] = title;
    }
  }
  return titles;
}

async function fetchQuizWrongAnswers(
  userId: string
): Promise<QuizWrongAnswer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("user_quiz_attempts")
    .select("answers, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(QUIZ_ATTEMPT_LIMIT);

  // Quiz-ийн дэлгэрэнгүй хариулт заавал байх албагүй — байхгүй бол хоосон.
  if (error) return [];

  const out: QuizWrongAnswer[] = [];
  for (const row of (data ?? []) as {
    answers: unknown;
    created_at: string;
  }[]) {
    for (const answer of parseQuizAttemptAnswers(row.answers)) {
      if (answer.isCorrect) continue;
      out.push({
        correctAnswer: answer.correctAnswer,
        createdAt: row.created_at,
      });
    }
  }
  return out;
}

function toMissedWords(
  candidates: MissedWordCandidate[],
  resolved: Map<string, HskWordLookupRow>
): { words: MissedWord[]; unresolved: number } {
  const byWordId = new Map<number, MissedWord>();
  let unresolved = 0;

  for (const candidate of candidates) {
    const row = resolved.get(candidate.text);
    if (!row?.id) {
      unresolved += 1;
      continue;
    }
    const existing = byWordId.get(row.id);
    if (existing) {
      existing.wrongCount += candidate.wrongCount;
      existing.fromQuiz = existing.fromQuiz || candidate.fromQuiz;
      existing.fromWordPractice =
        existing.fromWordPractice || candidate.fromWordPractice;
      if (
        new Date(candidate.lastWrongAt).getTime() >
        new Date(existing.lastWrongAt).getTime()
      ) {
        existing.lastWrongAt = candidate.lastWrongAt;
      }
      continue;
    }
    byWordId.set(row.id, {
      wordId: row.id,
      simplified: row.simplified,
      pinyin: row.pinyin,
      meaningMn: row.meaning_mn,
      hskLevel: row.hsk_level,
      isFunctionWord: Boolean(row.is_function_word),
      wrongCount: candidate.wrongCount,
      lastWrongAt: candidate.lastWrongAt,
      fromWordPractice: candidate.fromWordPractice,
      fromQuiz: candidate.fromQuiz,
    });
  }

  const words = [...byWordId.values()]
    .sort(
      (a, b) =>
        b.wrongCount - a.wrongCount ||
        new Date(b.lastWrongAt).getTime() - new Date(a.lastWrongAt).getTime()
    )
    .slice(0, MISSED_WORD_LIMIT);

  return { words, unresolved };
}

/**
 * Суралцагчийн ӨӨРИЙНХ нь мөрүүдээс «сул тал»-ын бүх тоог гаргана.
 * Бүх тоо жинхэнэ мөрөөс гарна — дутуу бол null / хоосон жагсаалт буцна.
 */
export async function fetchWeakSpots(
  userId: string
): Promise<WeakSpotsResult> {
  if (!hasSupabaseConfig || !supabase) {
    return { data: null, error: "Supabase тохиргоо байхгүй." };
  }

  const { data: attemptRows, error: attemptError } = await supabase
    .from("question_attempts")
    .select(
      "lesson_id, stage, question_id, question_type, is_correct, selected_answer, correct_answer, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(WEAK_SPOT_ATTEMPT_LIMIT);

  if (attemptError) {
    return { data: null, error: attemptError.message };
  }

  const attempts: WeakSpotAttempt[] = ((attemptRows ?? []) as AttemptRow[])
    .map((row) => ({
      lessonId: row.lesson_id,
      stage: row.stage,
      questionId: row.question_id,
      questionType: row.question_type,
      isCorrect: row.is_correct,
      selectedAnswer: row.selected_answer,
      correctAnswer: row.correct_answer,
      createdAt: row.created_at,
    }))
    .filter(isGradedAttempt);

  const areas = buildAreaStats(attempts);
  const lessons = buildLessonStats(attempts);
  const grammar = buildGrammarStats(attempts);
  const verdict = buildVerdict(areas);

  const quizWrongAnswers = await fetchQuizWrongAnswers(userId);
  const candidates = collectMissedWordCandidates(attempts, quizWrongAnswers);

  let missedWords: MissedWord[] = [];
  let unresolvedWordCount = 0;
  try {
    const resolved = await resolveWordsByText(candidates.map((c) => c.text));
    const result = toMissedWords(candidates, resolved);
    missedWords = result.words;
    unresolvedWordCount = result.unresolved;
  } catch {
    // Үгийн сан татагдахгүй бол үгийн хэсэг хоосон харагдана (тоо зохиохгүй).
    missedWords = [];
    unresolvedWordCount = candidates.length;
  }

  const lessonTitles = await fetchLessonTitles([
    ...lessons.map((row) => row.lessonId),
    ...grammar.map((row) => row.lessonId),
  ]);

  const timestamps = attempts.map((a) => new Date(a.createdAt).getTime());

  return {
    data: {
      attemptCount: attempts.length,
      wrongCount: attempts.filter((a) => !a.isCorrect).length,
      firstAttemptAt:
        timestamps.length > 0
          ? new Date(Math.min(...timestamps)).toISOString()
          : null,
      lastAttemptAt:
        timestamps.length > 0
          ? new Date(Math.max(...timestamps)).toISOString()
          : null,
      verdict,
      areas,
      lessons,
      grammar,
      lessonTitles,
      missedWords,
      unresolvedWordCount,
      quizAnswerWrongCount: quizWrongAnswers.length,
    },
    error: null,
  };
}
