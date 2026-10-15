/**
 * Ангийн хурдан сорил — багш ба сурагчийн Supabase хандалт (073 миграц).
 * Дүгнэлт, оноо өгөлт бүгд серверийн RPC (submit_class_quiz)-д хийгдэнэ.
 */

import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type QuizStatus = "draft" | "open" | "closed";

export type ClassQuiz = {
  id: string;
  classroomId: string;
  title: string;
  questionIds: number[];
  lessonIds: string[];
  durationMinutes: number;
  opensAt: string | null;
  closesAt: string | null;
  status: QuizStatus;
  shareResults: boolean;
  createdAt: string;
};

export type QuizResult<T> = { data: T | null; error: string | null };

const NOT_CONFIGURED = "Supabase тохируулагдаагүй.";

function mapQuiz(r: Record<string, unknown>): ClassQuiz {
  return {
    id: String(r.id),
    classroomId: String(r.classroom_id),
    title: String(r.title ?? "Хурдан сорил"),
    questionIds: ((r.question_ids ?? []) as (number | string)[]).map(Number),
    lessonIds: ((r.lesson_ids ?? []) as string[]).map(String),
    durationMinutes: Number(r.duration_minutes ?? 15),
    opensAt: r.opens_at ? String(r.opens_at) : null,
    closesAt: r.closes_at ? String(r.closes_at) : null,
    status: String(r.status ?? "draft") as QuizStatus,
    shareResults: Boolean(r.share_results),
    createdAt: String(r.created_at ?? ""),
  };
}

/** Нээлттэй гэж тэмдэглэгдсэн ч хугацаа нь дууссан бол «хаагдсан» гэж үзнэ. */
export function effectiveStatus(q: ClassQuiz, now: number = Date.now()): QuizStatus {
  if (q.status === "open" && q.closesAt && new Date(q.closesAt).getTime() < now) {
    return "closed";
  }
  return q.status;
}

/* ------------------------------------------------------------------ */
/* Асуулт сонголт                                                      */
/* ------------------------------------------------------------------ */

export type QuizQuestionOption = {
  id: number;
  lessonId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  type: string;
  orderIndex: number;
};

function parseOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((x) => String(x ?? "")).filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x ?? "")).filter(Boolean);
    } catch {
      /* ignore */
    }
  }
  return [];
}

/**
 * Сорилд тохирох асуулт: сонголттой, зөв хариулт нь сонголтуудын нэг.
 * (Өгүүлбэр эвлүүлэх зэрэг чөлөөт хэлбэрийг серверт хялбар дүгнэх боломжгүй тул оруулахгүй.)
 */
export function isQuizSuitable(q: QuizQuestionOption): boolean {
  if (q.options.length < 2) return false;
  if (q.correctAnswer.trim().startsWith("[")) return false;
  if (q.type.toLowerCase().includes("order")) return false;
  return q.options.some((o) => o.trim() === q.correctAnswer.trim());
}

export async function fetchQuestionsForLessons(
  lessonIds: string[]
): Promise<QuizResult<QuizQuestionOption[]>> {
  if (!hasSupabaseConfig || !supabase) return { data: null, error: NOT_CONFIGURED };
  if (lessonIds.length === 0) return { data: [], error: null };
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("id, lesson_id, question, options, correct_answer, type, order_index")
    .in("lesson_id", lessonIds)
    .order("lesson_id", { ascending: true })
    .order("order_index", { ascending: true })
    .limit(2000);
  if (error) return { data: null, error: error.message };
  const rows = (data ?? []).map(
    (r): QuizQuestionOption => ({
      id: Number(r.id),
      lessonId: String(r.lesson_id),
      question: String(r.question ?? ""),
      options: parseOptions(r.options),
      correctAnswer: String(r.correct_answer ?? ""),
      type: String(r.type ?? ""),
      orderIndex: Number(r.order_index ?? 0),
    })
  );
  return { data: rows.filter(isQuizSuitable), error: null };
}

/** Хичээл бүрээс жигд (round-robin) `count` асуулт сонгоно. */
export function autoPickQuestions(
  questions: QuizQuestionOption[],
  count: number
): number[] {
  const byLesson = new Map<string, QuizQuestionOption[]>();
  for (const q of questions) {
    const list = byLesson.get(q.lessonId) ?? [];
    list.push(q);
    byLesson.set(q.lessonId, list);
  }
  const queues = [...byLesson.values()];
  const picked: number[] = [];
  let i = 0;
  while (picked.length < count && queues.some((q) => q.length > 0)) {
    const queue = queues[i % queues.length]!;
    const next = queue.shift();
    if (next) picked.push(next.id);
    i += 1;
  }
  return picked;
}

/* ------------------------------------------------------------------ */
/* Багш                                                                */
/* ------------------------------------------------------------------ */

export async function listClassQuizzes(classroomId: string): Promise<QuizResult<ClassQuiz[]>> {
  if (!hasSupabaseConfig || !supabase) return { data: null, error: NOT_CONFIGURED };
  const { data, error } = await supabase
    .from("class_quizzes")
    .select("*")
    .eq("classroom_id", classroomId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return { data: null, error: error.message };
  return { data: (data ?? []).map((r) => mapQuiz(r as Record<string, unknown>)), error: null };
}

/** Нээсний дараа сурагч хугацаанаас гадна энэ хэдэн минутын дотор эхэлж болно. */
export const START_WINDOW_MINUTES = 30;

export async function createClassQuiz(input: {
  classroomId: string;
  title: string;
  questionIds: number[];
  lessonIds: string[];
  durationMinutes: number;
  openNow: boolean;
}): Promise<QuizResult<ClassQuiz>> {
  if (!hasSupabaseConfig || !supabase) return { data: null, error: NOT_CONFIGURED };
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return { data: null, error: "Нэвтрээгүй байна." };
  if (input.questionIds.length === 0) return { data: null, error: "Асуулт сонгоно уу." };
  const now = Date.now();
  const { data, error } = await supabase
    .from("class_quizzes")
    .insert({
      classroom_id: input.classroomId,
      teacher_user_id: userId,
      title: input.title.trim() || "Хурдан сорил",
      question_ids: input.questionIds,
      lesson_ids: input.lessonIds,
      duration_minutes: input.durationMinutes,
      status: input.openNow ? "open" : "draft",
      opens_at: input.openNow ? new Date(now).toISOString() : null,
      closes_at: input.openNow
        ? new Date(now + (input.durationMinutes + START_WINDOW_MINUTES) * 60_000).toISOString()
        : null,
    })
    .select("*")
    .single();
  if (error) return { data: null, error: error.message };
  return { data: mapQuiz(data as Record<string, unknown>), error: null };
}

export async function openClassQuiz(quiz: ClassQuiz): Promise<QuizResult<ClassQuiz>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const now = Date.now();
  const { data, error } = await supabase
    .from("class_quizzes")
    .update({
      status: "open",
      opens_at: new Date(now).toISOString(),
      closes_at: new Date(
        now + (quiz.durationMinutes + START_WINDOW_MINUTES) * 60_000
      ).toISOString(),
    })
    .eq("id", quiz.id)
    .select("*")
    .single();
  if (error) return { data: null, error: error.message };
  return { data: mapQuiz(data as Record<string, unknown>), error: null };
}

export async function closeClassQuiz(quizId: string): Promise<QuizResult<true>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const { error } = await supabase
    .from("class_quizzes")
    .update({ status: "closed", closes_at: new Date().toISOString() })
    .eq("id", quizId);
  return error ? { data: null, error: error.message } : { data: true, error: null };
}

export async function setQuizShareResults(
  quizId: string,
  share: boolean
): Promise<QuizResult<true>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const { error } = await supabase
    .from("class_quizzes")
    .update({ share_results: share })
    .eq("id", quizId);
  return error ? { data: null, error: error.message } : { data: true, error: null };
}

export async function deleteClassQuiz(quizId: string): Promise<QuizResult<true>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const { error } = await supabase.from("class_quizzes").delete().eq("id", quizId);
  return error ? { data: null, error: error.message } : { data: true, error: null };
}

export type QuizStudentStatus = "not_started" | "in_progress" | "submitted";

export type QuizStudentRow = {
  userId: string;
  name: string;
  status: QuizStudentStatus;
  correct: number | null;
  total: number | null;
  scorePct: number | null;
  durationSec: number | null;
  startedAt: string | null;
};

export type QuizQuestionStat = {
  questionId: number;
  text: string;
  lessonId: string;
  attempts: number;
  wrong: number;
  wrongPct: number | null;
};

export type QuizLiveResults = {
  quiz: ClassQuiz;
  rows: QuizStudentRow[];
  submitted: number;
  total: number;
  avgPct: number | null;
  questions: QuizQuestionStat[];
};

export async function getQuizResults(
  quiz: ClassQuiz
): Promise<QuizResult<QuizLiveResults>> {
  if (!hasSupabaseConfig || !supabase) return { data: null, error: NOT_CONFIGURED };
  const [studentsRes, attemptsRes, questionsRes] = await Promise.all([
    supabase
      .from("classroom_students")
      .select("student_user_id, display_name, email")
      .eq("classroom_id", quiz.classroomId)
      .not("student_user_id", "is", null),
    supabase
      .from("class_quiz_attempts")
      .select("student_user_id, started_at, submitted_at, answers, correct, total, score_pct, duration_sec")
      .eq("quiz_id", quiz.id),
    supabase
      .from("quiz_questions")
      .select("id, lesson_id, question, correct_answer")
      .in("id", quiz.questionIds.length ? quiz.questionIds : [-1]),
  ]);
  if (studentsRes.error) return { data: null, error: studentsRes.error.message };
  if (attemptsRes.error) return { data: null, error: attemptsRes.error.message };

  const attempts = new Map(
    (attemptsRes.data ?? []).map((a) => [String(a.student_user_id), a])
  );
  const rows: QuizStudentRow[] = (studentsRes.data ?? []).map((s) => {
    const uid = String(s.student_user_id);
    const a = attempts.get(uid);
    const submitted = Boolean(a?.submitted_at);
    return {
      userId: uid,
      name: String(s.display_name ?? s.email ?? "Сурагч"),
      status: !a ? "not_started" : submitted ? "submitted" : "in_progress",
      correct: submitted ? Number(a?.correct ?? 0) : null,
      total: submitted ? Number(a?.total ?? 0) : null,
      scorePct: submitted && a?.score_pct != null ? Number(a.score_pct) : null,
      durationSec: submitted && a?.duration_sec != null ? Number(a.duration_sec) : null,
      startedAt: a?.started_at ? String(a.started_at) : null,
    };
  });

  const done = rows.filter((r) => r.status === "submitted");
  const scored = done.filter((r) => r.scorePct != null);
  const avgPct = scored.length
    ? Math.round((scored.reduce((n, r) => n + (r.scorePct ?? 0), 0) / scored.length) * 10) / 10
    : null;

  const submittedAttempts = (attemptsRes.data ?? []).filter((a) => a.submitted_at);
  const questions: QuizQuestionStat[] = (questionsRes.data ?? [])
    .map((q) => {
      let attemptsCount = 0;
      let wrong = 0;
      for (const a of submittedAttempts) {
        attemptsCount += 1;
        const ans = (a.answers ?? {}) as Record<string, unknown>;
        const sel = ans[String(q.id)];
        if (typeof sel !== "string" || sel.trim() !== String(q.correct_answer).trim()) wrong += 1;
      }
      return {
        questionId: Number(q.id),
        text: String(q.question ?? ""),
        lessonId: String(q.lesson_id),
        attempts: attemptsCount,
        wrong,
        wrongPct: attemptsCount > 0 ? Math.round((wrong / attemptsCount) * 100) : null,
      };
    })
    .sort((a, b) => (b.wrongPct ?? -1) - (a.wrongPct ?? -1));

  return {
    data: { quiz, rows, submitted: done.length, total: rows.length, avgPct, questions },
    error: null,
  };
}

/* ------------------------------------------------------------------ */
/* Сурагч                                                              */
/* ------------------------------------------------------------------ */

export type OpenClassQuiz = {
  quizId: string;
  title: string;
  classroomId: string;
  classroomName: string;
  durationMinutes: number;
  closesAt: string | null;
  questionCount: number;
  submitted: boolean;
};

export async function getMyOpenClassQuizzes(): Promise<OpenClassQuiz[]> {
  if (!hasSupabaseConfig || !supabase) return [];
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return [];
  const { data, error } = await supabase.rpc("my_open_class_quizzes");
  if (error) return [];
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    quizId: String(r.quiz_id),
    title: String(r.title ?? "Хурдан сорил"),
    classroomId: String(r.classroom_id),
    classroomName: String(r.classroom_name ?? ""),
    durationMinutes: Number(r.duration_minutes ?? 0),
    closesAt: r.closes_at ? String(r.closes_at) : null,
    questionCount: Number(r.question_count ?? 0),
    submitted: Boolean(r.submitted),
  }));
}

export type StudentQuizQuestion = {
  id: number;
  question: string;
  options: string[];
};

export async function getQuizForStudent(quizId: string): Promise<
  QuizResult<{ quiz: ClassQuiz; questions: StudentQuizQuestion[] }>
> {
  if (!hasSupabaseConfig || !supabase) return { data: null, error: NOT_CONFIGURED };
  const { data, error } = await supabase
    .from("class_quizzes")
    .select("*")
    .eq("id", quizId)
    .maybeSingle();
  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Сорил олдсонгүй эсвэл танд нээлттэй биш байна." };
  const quiz = mapQuiz(data as Record<string, unknown>);
  const { data: qs, error: qErr } = await supabase
    .from("quiz_questions")
    .select("id, question, options")
    .in("id", quiz.questionIds.length ? quiz.questionIds : [-1]);
  if (qErr) return { data: null, error: qErr.message };
  const byId = new Map((qs ?? []).map((q) => [Number(q.id), q]));
  const questions: StudentQuizQuestion[] = quiz.questionIds
    .map((id) => byId.get(id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q))
    .map((q) => ({
      id: Number(q.id),
      question: String(q.question ?? ""),
      options: parseOptions(q.options),
    }));
  return { data: { quiz, questions }, error: null };
}

export type StartedQuiz =
  | { submitted: true; scorePct: number | null; correct: number | null; total: number | null }
  | { submitted: false; startedAt: string; deadline: string; serverNow: string };

export async function startClassQuiz(quizId: string): Promise<QuizResult<StartedQuiz>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const { data, error } = await supabase.rpc("start_class_quiz", { p_quiz_id: quizId });
  if (error) return { data: null, error: error.message };
  const r = (data ?? {}) as Record<string, unknown>;
  if (r.submitted) {
    return {
      data: {
        submitted: true,
        scorePct: r.score_pct != null ? Number(r.score_pct) : null,
        correct: r.correct != null ? Number(r.correct) : null,
        total: r.total != null ? Number(r.total) : null,
      },
      error: null,
    };
  }
  return {
    data: {
      submitted: false,
      startedAt: String(r.started_at),
      deadline: String(r.deadline),
      serverNow: String(r.server_now),
    },
    error: null,
  };
}

export type QuizSubmitResult = {
  correct: number;
  total: number;
  scorePct: number;
  durationSec: number;
  passed: boolean;
  points: number;
  already: boolean;
  review: {
    questionId: number;
    selected: string | null;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
};

export async function submitClassQuiz(
  quizId: string,
  answers: Record<string, string>
): Promise<QuizResult<QuizSubmitResult>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const { data, error } = await supabase.rpc("submit_class_quiz", {
    p_quiz_id: quizId,
    p_answers: answers,
  });
  if (error) return { data: null, error: error.message };
  const r = (data ?? {}) as Record<string, unknown>;
  return {
    data: {
      correct: Number(r.correct ?? 0),
      total: Number(r.total ?? 0),
      scorePct: Number(r.score_pct ?? 0),
      durationSec: Number(r.duration_sec ?? 0),
      passed: Boolean(r.passed ?? Number(r.score_pct ?? 0) >= 60),
      points: Number(r.points ?? 0),
      already: Boolean(r.already),
      review: ((r.review ?? []) as Record<string, unknown>[]).map((x) => ({
        questionId: Number(x.question_id),
        selected: x.selected != null ? String(x.selected) : null,
        correctAnswer: String(x.correct_answer ?? ""),
        isCorrect: Boolean(x.is_correct),
      })),
    },
    error: null,
  };
}

export type MyQuizAttempt = {
  quizId: string;
  title: string;
  classroomName: string | null;
  scorePct: number | null;
  correct: number | null;
  total: number | null;
  submittedAt: string | null;
  classAvgPct: number | null;
};

export async function getMyQuizAttempts(): Promise<MyQuizAttempt[]> {
  if (!hasSupabaseConfig || !supabase) return [];
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("class_quiz_attempts")
    .select("quiz_id, score_pct, correct, total, submitted_at, class_quizzes(title, share_results, classrooms(name))")
    .eq("student_user_id", userId)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(30);
  if (error) return [];
  type Row = {
    quiz_id: string;
    score_pct: number | null;
    correct: number | null;
    total: number | null;
    submitted_at: string | null;
    class_quizzes:
      | { title: string; share_results: boolean; classrooms: { name: string } | { name: string }[] | null }
      | { title: string; share_results: boolean; classrooms: { name: string } | { name: string }[] | null }[]
      | null;
  };
  const rows = (data ?? []) as unknown as Row[];
  const out: MyQuizAttempt[] = [];
  for (const r of rows) {
    const q = Array.isArray(r.class_quizzes) ? r.class_quizzes[0] : r.class_quizzes;
    const cls = q ? (Array.isArray(q.classrooms) ? q.classrooms[0] : q.classrooms) : null;
    let avg: number | null = null;
    if (q?.share_results) {
      const { data: a } = await supabase.rpc("class_quiz_class_avg", { p_quiz_id: r.quiz_id });
      const first = ((a ?? []) as Record<string, unknown>[])[0];
      avg = first?.avg_pct != null ? Number(first.avg_pct) : null;
    }
    out.push({
      quizId: r.quiz_id,
      title: q?.title ?? "Хурдан сорил",
      classroomName: cls?.name ?? null,
      scorePct: r.score_pct != null ? Number(r.score_pct) : null,
      correct: r.correct,
      total: r.total,
      submittedAt: r.submitted_at,
      classAvgPct: avg,
    });
  }
  return out;
}
