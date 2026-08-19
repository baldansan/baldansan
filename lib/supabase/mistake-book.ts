import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

/**
 * «Миний алдаанууд» — алдааны дэвтэр (SuperTest загвар).
 * question_attempts-оос хэрэглэгчийн алдсан асуултуудыг группэлж,
 * «идэвхтэй алдаа»-г тодорхойлно.
 *
 * Дүрэм:
 * - Тухайн асуултад дор хаяж 1 буруу оролдлого байвал дэвтэрт орно.
 * - Хамгийн сүүлийн 2 оролдлого ДАРААЛАН зөв бол дэвтрээс хасагдана.
 */

const ATTEMPT_FETCH_LIMIT = 500;

export type MistakeEntry = {
  /** Групплэх түлхүүр: lesson_id + question_id */
  key: string;
  questionId: string;
  lessonId: string;
  stage: string;
  questionType: string;
  /** Сүүлийн БУРУУ оролдлогын сонгосон хариулт */
  selectedAnswer: string | null;
  /** Зөв хариулт (сүүлийн оролдлогоос) */
  correctAnswer: string | null;
  /** Сүүлийн буруу оролдлогын огноо (ISO) */
  lastWrongAt: string;
  /** Нийт буруу оролдлогын тоо (татсан цонхонд) */
  wrongCount: number;
  /** Хамгийн сүүлийн оролдлого зөв байсан эсэх (1 зөв = хасагдахад ойрхон) */
  lastAttemptCorrect: boolean;
};

type AttemptRow = {
  question_id: string;
  lesson_id: string;
  stage: string;
  question_type: string;
  is_correct: boolean;
  selected_answer: string | null;
  correct_answer: string | null;
  created_at: string;
};

export type FetchMistakesResult = {
  mistakes: MistakeEntry[];
  error: string | null;
};

/**
 * Хэрэглэгчийн идэвхтэй алдаануудыг татна (сүүлийн 500 оролдлогоос).
 * Шинээс хуучин руу эрэмбэлэгдэж ирнэ.
 */
export async function fetchMistakes(
  userId: string
): Promise<FetchMistakesResult> {
  if (!hasSupabaseConfig || !supabase) {
    return { mistakes: [], error: "Supabase тохиргоо байхгүй." };
  }

  const { data, error } = await supabase
    .from("question_attempts")
    .select(
      "question_id, lesson_id, stage, question_type, is_correct, selected_answer, correct_answer, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(ATTEMPT_FETCH_LIMIT);

  if (error) {
    return { mistakes: [], error: error.message };
  }

  return { mistakes: groupIntoMistakes((data ?? []) as AttemptRow[]), error: null };
}

/**
 * Оролдлогуудыг (ШИНЭЭС ХУУЧИН руу эрэмбэлэгдсэн) асуулт бүрээр группэлж
 * идэвхтэй алдаануудыг буцаана. Экспортлогдсон нь тест хийхэд хялбар.
 */
export function groupIntoMistakes(rowsNewestFirst: AttemptRow[]): MistakeEntry[] {
  const byKey = new Map<string, AttemptRow[]>();
  for (const row of rowsNewestFirst) {
    // Өөрийгөө үнэлэх (helzui self assessment) мөрүүд асуулт-хариулт биш.
    if (row.selected_answer?.startsWith("self_")) continue;
    const key = `${row.lesson_id}|${row.question_id}`;
    const list = byKey.get(key);
    if (list) list.push(row);
    else byKey.set(key, [row]);
  }

  const mistakes: MistakeEntry[] = [];

  for (const [key, attempts] of byKey) {
    // attempts нь шинээс хуучин руу эрэмбтэй.
    const hasWrong = attempts.some((a) => !a.is_correct);
    if (!hasWrong) continue;

    const latest = attempts[0]!;
    const second = attempts[1];
    // Сүүлийн 2 оролдлого дараалан зөв → дэвтрээс хасагдсан.
    if (latest.is_correct && second?.is_correct) continue;

    const lastWrong = attempts.find((a) => !a.is_correct)!;

    mistakes.push({
      key,
      questionId: latest.question_id,
      lessonId: latest.lesson_id,
      stage: latest.stage,
      questionType: latest.question_type,
      selectedAnswer: lastWrong.selected_answer,
      correctAnswer: lastWrong.correct_answer ?? latest.correct_answer,
      lastWrongAt: lastWrong.created_at,
      wrongCount: attempts.filter((a) => !a.is_correct).length,
      lastAttemptCorrect: latest.is_correct,
    });
  }

  // Сүүлд алдсан нь эхэндээ.
  mistakes.sort(
    (a, b) =>
      new Date(b.lastWrongAt).getTime() - new Date(a.lastWrongAt).getTime()
  );

  return mistakes;
}

/** Давтах горимд орох боломжтой алдаанууд (зөв хариулт нь мэдэгдэж байгаа). */
export function practicableMistakes(mistakes: MistakeEntry[]): MistakeEntry[] {
  return mistakes.filter(
    (m) => m.correctAnswer != null && m.correctAnswer.trim().length > 0
  );
}
