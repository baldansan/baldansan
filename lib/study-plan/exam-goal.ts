/**
 * Шалгалтын зорилго: «HSK N-ийг ийм өдөр өгнө» → өдөрт/долоо хоногт хэдэн хичээл
 * үзвэл амжихыг тооцоолно. Төхөөрөмж дээр хадгална; нэвтэрсэн бол Supabase-д
 * (user_exam_goals, 095 SQL) давхар хадгалж өөр төхөөрөмжөөс ч харагдана.
 * Хүснэгт байхгүй бол чимээгүй алгасна.
 */

export type ExamGoal = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** YYYY-MM-DD */
  examDate: string;
  /** YYYY-MM-DD — зорилго тавьсан өдөр */
  startDate: string;
  /** Зорилго тавих үед дууссан байсан хичээлийн тоо */
  startCompleted: number;
};

export type ExamPlan = {
  daysLeft: number;
  totalLessons: number;
  completed: number;
  remaining: number;
  /** Сүүлийн хэдэн өдрийг загвар шалгалт, давтлагад үлдээх */
  reviewDays: number;
  /** Шинэ хичээл үзэх боломжтой өдөр */
  studyDays: number;
  lessonsPerWeek: number;
  /** Өнөөдрийг хүртэл дуусгасан байх ёстой хичээлийн тоо */
  expectedByNow: number;
  status: "done" | "ahead" | "on-track" | "behind" | "too-late" | "past";
  phase: "study" | "review";
  nextLessonId: string | null;
};

const KEY = "bs.study.examGoal";
export const EXAM_GOAL_EVENT = "bs:exam-goal-changed";

export function todayYmd(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function ymdToDays(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Math.floor(Date.UTC(y, (m || 1) - 1, d || 1) / 86_400_000);
}

export function daysBetween(fromYmd: string, toYmd: string): number {
  return ymdToDays(toYmd) - ymdToDays(fromYmd);
}

function isValidGoal(v: unknown): v is ExamGoal {
  if (!v || typeof v !== "object") return false;
  const g = v as Record<string, unknown>;
  return (
    typeof g.level === "number" &&
    g.level >= 1 &&
    g.level <= 6 &&
    typeof g.examDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(g.examDate) &&
    typeof g.startDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(g.startDate)
  );
}

export function readExamGoal(): ExamGoal | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidGoal(parsed)) return null;
    return { ...parsed, startCompleted: Number(parsed.startCompleted) || 0 };
  } catch {
    return null;
  }
}

function writeLocal(goal: ExamGoal | null) {
  if (typeof window === "undefined") return;
  try {
    if (goal) window.localStorage.setItem(KEY, JSON.stringify(goal));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* хадгалах боломжгүй бол санах ойд л үлдэнэ */
  }
  try {
    window.dispatchEvent(new Event(EXAM_GOAL_EVENT));
  } catch {
    /* noop */
  }
}

export async function saveExamGoal(goal: ExamGoal): Promise<void> {
  writeLocal(goal);
  try {
    const { supabase } = await import("@/lib/supabase/client");
    const { getCurrentUser } = await import("@/lib/supabase/auth");
    if (!supabase) return;
    const { data: user } = await getCurrentUser();
    if (!user?.id) return;
    await supabase.from("user_exam_goals").upsert(
      {
        user_id: user.id,
        level: goal.level,
        exam_date: goal.examDate,
        start_date: goal.startDate,
        start_completed: goal.startCompleted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch {
    /* хүснэгт байхгүй / сүлжээгүй — төхөөрөмж дээрх нь хүчинтэй */
  }
}

export async function clearExamGoal(): Promise<void> {
  writeLocal(null);
  try {
    const { supabase } = await import("@/lib/supabase/client");
    const { getCurrentUser } = await import("@/lib/supabase/auth");
    if (!supabase) return;
    const { data: user } = await getCurrentUser();
    if (!user?.id) return;
    await supabase.from("user_exam_goals").delete().eq("user_id", user.id);
  } catch {
    /* noop */
  }
}

/** Төхөөрөмж дээр байхгүй бол бүртгэлээс татаж сэргээнэ. */
export async function loadExamGoal(): Promise<ExamGoal | null> {
  const local = readExamGoal();
  if (local) return local;
  try {
    const { supabase } = await import("@/lib/supabase/client");
    const { getCurrentUser } = await import("@/lib/supabase/auth");
    if (!supabase) return null;
    const { data: user } = await getCurrentUser();
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from("user_exam_goals")
      .select("level, exam_date, start_date, start_completed")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !data) return null;
    const goal = {
      level: Number(data.level),
      examDate: String(data.exam_date).slice(0, 10),
      startDate: String(data.start_date).slice(0, 10),
      startCompleted: Number(data.start_completed) || 0,
    };
    if (!isValidGoal(goal)) return null;
    writeLocal(goal);
    return goal;
  } catch {
    return null;
  }
}

/** Тухайн түвшний нийтлэгдсэн хичээлүүдийг дарааллаар нь. */
export async function fetchLevelLessonIds(level: number): Promise<string[]> {
  try {
    const { supabase } = await import("@/lib/supabase/client");
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("lessons")
      .select("id, order_index, status")
      .eq("course_id", `hsk${level}`)
      .order("order_index", { ascending: true });
    if (error || !data) return [];
    return data
      .filter((r) => !r.status || r.status === "available" || r.status === "published")
      .map((r) => String(r.id));
  } catch {
    return [];
  }
}

export function computeExamPlan(
  goal: ExamGoal,
  lessonIds: string[],
  completedIds: Set<string>,
  today = todayYmd()
): ExamPlan {
  const totalLessons = lessonIds.length;
  const completed = lessonIds.filter((id) => completedIds.has(id)).length;
  const remaining = Math.max(0, totalLessons - completed);
  const daysLeft = daysBetween(today, goal.examDate);
  const nextLessonId = lessonIds.find((id) => !completedIds.has(id)) ?? null;

  // Сүүлийн ~20% (7–21 өдөр)-ийг загвар шалгалт, давтлагад үлдээнэ.
  const totalSpan = Math.max(1, daysBetween(goal.startDate, goal.examDate));
  const reviewDays =
    daysLeft <= 7 ? Math.max(0, Math.min(daysLeft, 3)) : Math.min(21, Math.max(7, Math.round(totalSpan * 0.2)));
  const studyDays = Math.max(0, daysLeft - reviewDays);
  const lessonsPerWeek =
    remaining === 0 ? 0 : studyDays <= 0 ? remaining : Math.max(1, Math.ceil((remaining / studyDays) * 7));

  // Зорилго тавьснаас хойш жигд хурдаар явбал өнөөдөр хаана байх ёстой вэ.
  const studySpan = Math.max(1, totalSpan - reviewDays);
  const elapsed = Math.max(0, daysBetween(goal.startDate, today));
  const toLearn = Math.max(0, totalLessons - goal.startCompleted);
  const expectedByNow = Math.min(
    totalLessons,
    goal.startCompleted + Math.floor((toLearn * Math.min(elapsed, studySpan)) / studySpan)
  );

  let status: ExamPlan["status"];
  if (daysLeft < 0) status = "past";
  else if (remaining === 0) status = "done";
  else if (studyDays <= 0 || lessonsPerWeek > 14) status = "too-late";
  else if (completed > expectedByNow) status = "ahead";
  else if (completed + 1 < expectedByNow) status = "behind";
  else status = "on-track";

  const phase: ExamPlan["phase"] = remaining === 0 || daysLeft <= reviewDays ? "review" : "study";

  return {
    daysLeft,
    totalLessons,
    completed,
    remaining,
    reviewDays,
    studyDays,
    lessonsPerWeek,
    expectedByNow,
    status,
    phase,
    nextLessonId,
  };
}

export function formatMnDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${y} оны ${m}-р сарын ${d}`;
}
