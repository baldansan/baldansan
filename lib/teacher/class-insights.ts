/**
 * Багшийн ангийн самбар: сурагч бүрийн ангилал (A–F), сул тал, хамгийн их алдсан
 * асуултууд. Энд ТОО ЗОХИОХГҮЙ — мөр байхгүй бол null ("—") буцаана.
 *
 * Хоёр хэсэгтэй:
 *  1. Цэвэр тооцоо (I/O-гүй): buildClassInsights, buildStudentAreaStats…
 *  2. Supabase таталт: fetchClassInsights, fetchStudentDetail (browser client, RLS).
 */

import { mongoliaDay } from "@/lib/analytics/activity-tracker";
import {
  buildAreaStats,
  buildVerdict,
  isGradedAttempt,
  resolveWeakSpotArea,
  HSK30_LESSON_ID,
  HELZUI_LESSON_ID,
  MIN_AREA_ATTEMPTS,
  MIN_TOTAL_ATTEMPTS,
  VERDICT_AREAS,
  type AreaStat,
  type WeakSpotArea,
  type WeakSpotAttempt,
} from "@/lib/analytics/weak-spots";
import {
  computeClassLearnerScore,
  type LearnerGradeBucket,
} from "@/lib/learner-grade";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { StudentProgressRow } from "@/lib/teacher/analytics-types";

/* ------------------------------------------------------------------ */
/* Төрлүүд                                                             */
/* ------------------------------------------------------------------ */

/** Нэг хэсэгт зөв хариултын хувь энээс доош бол «сул» гэж тооцно. */
export const WEAK_THRESHOLD_PCT = 70;

export type RawAttempt = {
  user_id: string;
  lesson_id: string;
  stage: string;
  question_id: string;
  question_type?: string | null;
  is_correct: boolean;
  selected_answer: string | null;
  correct_answer: string | null;
  created_at: string;
};

export type PointsInfo = {
  total: number;
  last7d: number;
  prev7d: number;
  last30d: number;
};

export type RankInfo = { rank: number; points: number };

export type AttendanceRow = { student_id: string; status: string };

export type StudentInsight = {
  studentRowId: string;
  userId: string;
  name: string;
  points: number;
  rank: number | null;
  last7d: number;
  prev7d: number;
  /** last7d − prev7d. */
  trend: number;
  accuracy: number | null;
  attempts: number;
  weakArea: WeakSpotArea | null;
  weakAreaAccuracy: number | null;
  lastActiveAt: string | null;
  attendancePct: number | null;
  grade: LearnerGradeBucket;
  gradeScore: number | null;
  minutes30: number;
  active7d: boolean;
  assignmentsAssigned: number;
  assignmentsCompleted: number;
};

export type AreaStudent = {
  userId: string;
  name: string;
  accuracy: number;
  wrong: number;
  total: number;
};

export type ClassAreaInsight = {
  area: WeakSpotArea;
  total: number;
  wrong: number;
  accuracy: number | null;
  /** Босгоос доош зөв хариулсан сурагчид (хамгийн сул нь эхэндээ). */
  weakStudents: AreaStudent[];
  /** Энэ хэсэгт анги хамгийн их алдсан хичээл. */
  suggestedLessonId: string | null;
};

export type MissedQuestion = {
  questionId: string;
  lessonId: string;
  /** quiz_questions.id (quiz:db:N) байвал. */
  dbId: number | null;
  text: string | null;
  correctAnswer: string | null;
  attempts: number;
  wrong: number;
  wrongPct: number;
  students: { userId: string; name: string }[];
};

export type ClassKpis = {
  students: number;
  linkedStudents: number;
  active7dPct: number | null;
  attendancePct: number | null;
  avgPoints: number | null;
  lastExamPassPct: number | null;
  lastExamTitle: string | null;
  assignmentsDonePct: number | null;
};

export type ClassInsights = {
  students: StudentInsight[];
  areas: ClassAreaInsight[];
  missed: MissedQuestion[];
  kpis: ClassKpis;
  lessonTitles: Record<string, string>;
  /** Мөрийн хязгаарт хүрсэн бол багшид анхааруулна. */
  truncated: boolean;
};

/* ------------------------------------------------------------------ */
/* Цэвэр тооцоо                                                        */
/* ------------------------------------------------------------------ */

function toWeakAttempt(r: RawAttempt): WeakSpotAttempt {
  return {
    lessonId: r.lesson_id,
    stage: r.stage,
    questionId: r.question_id,
    questionType: r.question_type ?? "choice",
    isCorrect: r.is_correct,
    selectedAnswer: r.selected_answer,
    correctAnswer: r.correct_answer,
    createdAt: r.created_at,
  };
}

function pct(part: number, total: number): number | null {
  return total > 0 ? Math.round((part / total) * 100) : null;
}

/** Нэг сурагчийн хэсэг тус бүрийн статистик (зөвхөн дүгнэгдэх мөрүүдээр). */
export function buildStudentAreaStats(raw: RawAttempt[]): AreaStat[] {
  return buildAreaStats(raw.map(toWeakAttempt).filter(isGradedAttempt));
}

export function dbIdFromQuestionId(questionId: string): number | null {
  const m = /^quiz:db:(\d+)$/.exec(questionId);
  return m ? Number(m[1]) : null;
}

export function attendanceRateByStudent(
  rows: AttendanceRow[]
): Map<string, number | null> {
  const acc = new Map<string, { ok: number; den: number }>();
  for (const r of rows) {
    if (r.status === "excused") continue;
    const e = acc.get(r.student_id) ?? { ok: 0, den: 0 };
    e.den += 1;
    if (r.status === "present" || r.status === "late") e.ok += 1;
    acc.set(r.student_id, e);
  }
  const out = new Map<string, number | null>();
  for (const [k, v] of acc) out.set(k, pct(v.ok, v.den));
  return out;
}

export type BuildInsightsInput = {
  progress: StudentProgressRow[];
  attempts: RawAttempt[];
  points: Map<string, PointsInfo>;
  ranks: Map<string, RankInfo>;
  /** user_id → сүүлийн 30 өдрийн секунд */
  seconds30: Map<string, number>;
  /** user_id → сүүлийн идэвх (activity day / quiz гэх мэт) ISO */
  lastActivity: Map<string, string>;
  attendance: AttendanceRow[];
  lastExam: { passRate: number | null; title: string | null } | null;
  lessonTitles: Record<string, string>;
  /** quiz_questions.id → мэдээлэл */
  questionTexts: Map<number, { text: string; lessonId: string; correctAnswer: string }>;
  now?: number;
  truncated?: boolean;
};

export function buildClassInsights(input: BuildInsightsInput): ClassInsights {
  const now = input.now ?? Date.now();
  const sevenDaysAgo = now - 7 * 86_400_000;
  const nameOf = new Map<string, string>();
  for (const s of input.progress) {
    if (s.studentUserId) nameOf.set(s.studentUserId, s.displayName);
  }

  const byUser = new Map<string, RawAttempt[]>();
  for (const a of input.attempts) {
    if (!nameOf.has(a.user_id)) continue;
    const list = byUser.get(a.user_id) ?? [];
    list.push(a);
    byUser.set(a.user_id, list);
  }

  const attRates = attendanceRateByStudent(input.attendance);

  const students: StudentInsight[] = [];
  for (const s of input.progress) {
    if (!s.studentUserId) continue;
    const uid = s.studentUserId;
    const mine = (byUser.get(uid) ?? []).filter((r) =>
      isGradedAttempt(toWeakAttempt(r))
    );
    const wrong = mine.filter((r) => !r.is_correct).length;
    const accuracy = pct(mine.length - wrong, mine.length);
    const areaStats = buildAreaStats(mine.map(toWeakAttempt));
    const verdict = buildVerdict(areaStats);
    const pts = input.points.get(uid);
    const rk = input.ranks.get(uid);
    const lastIso = input.lastActivity.get(uid) ?? s.lastActivityAt ?? null;

    const score = computeClassLearnerScore({
      quizPercent:
        s.latestQuizPercentage ??
        (mine.length >= MIN_TOTAL_ATTEMPTS ? accuracy : null),
      completionRate: s.completionRate,
      assignmentsAssigned: s.assignmentsAssigned,
      assignmentsCompleted: s.assignmentsCompleted,
      learnedWords: s.learnedWordsCount,
    });

    students.push({
      studentRowId: s.studentRowId,
      userId: uid,
      name: s.displayName,
      points: pts?.total ?? rk?.points ?? 0,
      rank: rk?.rank ?? null,
      last7d: pts?.last7d ?? 0,
      prev7d: pts?.prev7d ?? 0,
      trend: (pts?.last7d ?? 0) - (pts?.prev7d ?? 0),
      accuracy,
      attempts: mine.length,
      weakArea: verdict.kind === "weakest" ? verdict.area : null,
      weakAreaAccuracy: verdict.kind === "weakest" ? verdict.accuracyPct : null,
      lastActiveAt: lastIso,
      attendancePct: attRates.get(s.studentRowId) ?? null,
      grade: score.grade,
      gradeScore: score.total,
      minutes30: Math.round((input.seconds30.get(uid) ?? 0) / 60),
      active7d: lastIso ? new Date(lastIso).getTime() >= sevenDaysAgo : false,
      assignmentsAssigned: s.assignmentsAssigned,
      assignmentsCompleted: s.assignmentsCompleted,
    });
  }

  /* ---- Ангийн хэсэг тус бүр ---- */
  type AreaAcc = {
    total: number;
    wrong: number;
    perStudent: Map<string, { total: number; wrong: number }>;
    perLesson: Map<string, number>;
  };
  const areaAcc = new Map<WeakSpotArea, AreaAcc>();
  for (const a of input.attempts) {
    if (!nameOf.has(a.user_id)) continue;
    if (!isGradedAttempt(toWeakAttempt(a))) continue;
    const area = resolveWeakSpotArea(a.lesson_id, a.stage);
    const acc =
      areaAcc.get(area) ??
      ({ total: 0, wrong: 0, perStudent: new Map(), perLesson: new Map() } as AreaAcc);
    acc.total += 1;
    const ps = acc.perStudent.get(a.user_id) ?? { total: 0, wrong: 0 };
    ps.total += 1;
    if (!a.is_correct) {
      acc.wrong += 1;
      ps.wrong += 1;
      acc.perLesson.set(a.lesson_id, (acc.perLesson.get(a.lesson_id) ?? 0) + 1);
    }
    acc.perStudent.set(a.user_id, ps);
    areaAcc.set(area, acc);
  }

  const areas: ClassAreaInsight[] = [...areaAcc.entries()]
    .map(([area, acc]) => {
      const weakStudents: AreaStudent[] = [];
      for (const [uid, ps] of acc.perStudent) {
        if (ps.total < MIN_AREA_ATTEMPTS) continue;
        const accuracy = pct(ps.total - ps.wrong, ps.total) ?? 0;
        if (accuracy < WEAK_THRESHOLD_PCT) {
          weakStudents.push({
            userId: uid,
            name: nameOf.get(uid) ?? "Сурагч",
            accuracy,
            wrong: ps.wrong,
            total: ps.total,
          });
        }
      }
      weakStudents.sort((a, b) => a.accuracy - b.accuracy || b.wrong - a.wrong);
      // Дүрмийн тусгай модулиуд (hsk30/helzui) даалгаварт хичээл болж өгөхгүй.
      const lessonCandidates = [...acc.perLesson.entries()]
        .filter(([id]) => id !== HSK30_LESSON_ID && id !== HELZUI_LESSON_ID)
        .sort((a, b) => b[1] - a[1]);
      return {
        area,
        total: acc.total,
        wrong: acc.wrong,
        accuracy: pct(acc.total - acc.wrong, acc.total),
        weakStudents,
        suggestedLessonId: lessonCandidates[0]?.[0] ?? null,
      };
    })
    .sort((a, b) => b.wrong - a.wrong);

  /* ---- Хамгийн их алдсан асуултууд ---- */
  type QAcc = {
    lessonId: string;
    attempts: number;
    wrong: number;
    wrongUsers: Set<string>;
    correctAnswer: string | null;
  };
  const qAcc = new Map<string, QAcc>();
  for (const a of input.attempts) {
    if (!nameOf.has(a.user_id)) continue;
    if (!isGradedAttempt(toWeakAttempt(a))) continue;
    if (a.stage === "mistake_review") continue;
    const key = `${a.lesson_id}|${a.question_id}`;
    const e =
      qAcc.get(key) ??
      ({
        lessonId: a.lesson_id,
        attempts: 0,
        wrong: 0,
        wrongUsers: new Set<string>(),
        correctAnswer: a.correct_answer,
      } as QAcc);
    e.attempts += 1;
    if (!a.is_correct) {
      e.wrong += 1;
      e.wrongUsers.add(a.user_id);
    }
    if (!e.correctAnswer && a.correct_answer) e.correctAnswer = a.correct_answer;
    qAcc.set(key, e);
  }

  const missed: MissedQuestion[] = [...qAcc.entries()]
    .filter(([, e]) => e.wrong > 0 && e.attempts >= 2)
    .map(([key, e]) => {
      const questionId = key.slice(key.indexOf("|") + 1);
      const dbId = dbIdFromQuestionId(questionId);
      const info = dbId != null ? input.questionTexts.get(dbId) : undefined;
      return {
        questionId,
        lessonId: info?.lessonId ?? e.lessonId,
        dbId,
        text: info?.text ?? null,
        correctAnswer: info?.correctAnswer ?? e.correctAnswer,
        attempts: e.attempts,
        wrong: e.wrong,
        wrongPct: Math.round((e.wrong / e.attempts) * 100),
        students: [...e.wrongUsers].map((u) => ({
          userId: u,
          name: nameOf.get(u) ?? "Сурагч",
        })),
      };
    })
    .sort(
      (a, b) =>
        b.students.length - a.students.length ||
        b.wrongPct - a.wrongPct ||
        b.wrong - a.wrong
    )
    .slice(0, 15);

  /* ---- KPI ---- */
  const linked = students.length;
  const withAtt = students.filter((s) => s.attendancePct != null);
  const assigned = students.reduce((n, s) => n + s.assignmentsAssigned, 0);
  const done = students.reduce((n, s) => n + s.assignmentsCompleted, 0);
  const kpis: ClassKpis = {
    students: input.progress.length,
    linkedStudents: linked,
    active7dPct: pct(students.filter((s) => s.active7d).length, linked),
    attendancePct: withAtt.length
      ? Math.round(
          withAtt.reduce((n, s) => n + (s.attendancePct ?? 0), 0) / withAtt.length
        )
      : null,
    avgPoints: linked
      ? Math.round(students.reduce((n, s) => n + s.points, 0) / linked)
      : null,
    lastExamPassPct: input.lastExam?.passRate ?? null,
    lastExamTitle: input.lastExam?.title ?? null,
    assignmentsDonePct: pct(done, assigned),
  };

  return {
    students,
    areas,
    missed,
    kpis,
    lessonTitles: input.lessonTitles,
    truncated: Boolean(input.truncated),
  };
}

/** Хоёр сурагчийн тоон эрэмбэ — null-ыг төгсгөлд тавина. */
export function compareNullable(
  a: number | null | undefined,
  b: number | null | undefined,
  dir: 1 | -1
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return (a - b) * dir;
}

/* ------------------------------------------------------------------ */
/* Supabase таталт                                                     */
/* ------------------------------------------------------------------ */

const PAGE = 1000;
const MAX_PAGES = 12;

/** PostgREST-ийн 1000 мөрийн хязгаарыг хуудаслаж тойрно. */
async function fetchPaged<T>(
  make: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>
): Promise<{ rows: T[]; truncated: boolean; error: string | null }> {
  const rows: T[] = [];
  for (let p = 0; p < MAX_PAGES; p += 1) {
    const { data, error } = await make(p * PAGE, p * PAGE + PAGE - 1);
    if (error) return { rows, truncated: false, error: error.message };
    const chunk = (data ?? []) as T[];
    rows.push(...chunk);
    if (chunk.length < PAGE) return { rows, truncated: false, error: null };
  }
  return { rows, truncated: true, error: null };
}

export async function fetchLessonTitles(
  ids: string[]
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (!supabase || ids.length === 0) return out;
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += 100) {
    const { data } = await supabase
      .from("lessons")
      .select("id, title")
      .in("id", unique.slice(i, i + 100));
    for (const r of data ?? []) out[String(r.id)] = String(r.title ?? r.id);
  }
  return out;
}

async function fetchQuestionTexts(
  ids: number[]
): Promise<Map<number, { text: string; lessonId: string; correctAnswer: string }>> {
  const out = new Map<number, { text: string; lessonId: string; correctAnswer: string }>();
  if (!supabase || ids.length === 0) return out;
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += 100) {
    const { data } = await supabase
      .from("quiz_questions")
      .select("id, lesson_id, question, correct_answer")
      .in("id", unique.slice(i, i + 100));
    for (const r of data ?? []) {
      out.set(Number(r.id), {
        text: String(r.question ?? ""),
        lessonId: String(r.lesson_id ?? ""),
        correctAnswer: String(r.correct_answer ?? ""),
      });
    }
  }
  return out;
}

export async function fetchPointsInfo(userIds: string[]): Promise<Map<string, PointsInfo>> {
  const out = new Map<string, PointsInfo>();
  if (!supabase || userIds.length === 0) return out;
  const { data } = await supabase
    .from("user_points_summary")
    .select("user_id, total, last_7d, prev_7d, last_30d")
    .in("user_id", userIds);
  for (const r of data ?? []) {
    out.set(String(r.user_id), {
      total: Number(r.total ?? 0),
      last7d: Number(r.last_7d ?? 0),
      prev7d: Number(r.prev_7d ?? 0),
      last30d: Number(r.last_30d ?? 0),
    });
  }
  return out;
}

export async function fetchClassRanks(
  classroomId: string
): Promise<Map<string, RankInfo & { displayName: string }>> {
  const out = new Map<string, RankInfo & { displayName: string }>();
  if (!supabase) return out;
  const { data, error } = await supabase.rpc("rank_class", {
    p_classroom_id: classroomId,
    p_period: "all",
  });
  if (error) return out;
  for (const r of (data ?? []) as Record<string, unknown>[]) {
    out.set(String(r.user_id), {
      rank: Number(r.rank ?? 0),
      points: Number(r.points ?? 0),
      displayName: String(r.display_name ?? ""),
    });
  }
  return out;
}

function daysAgoIso(days: number): string {
  return mongoliaDay(new Date(Date.now() - (days - 1) * 86_400_000));
}

export type LastExamInfo = { passRate: number | null; title: string | null };

async function fetchLastExam(classroomId: string): Promise<LastExamInfo | null> {
  try {
    const { getClassroomExamSummaries } = await import("@/lib/supabase/class-mock-exams");
    const res = await getClassroomExamSummaries(classroomId);
    const withData = (res.data ?? []).filter((s) => s.satCount > 0);
    if (withData.length === 0) return null;
    const last = withData[0]!; // getClassroomExams: шинэ нь эхэндээ
    return {
      passRate: last.passRate,
      title: last.exam.title ?? last.exam.testTitle ?? last.exam.testId,
    };
  } catch {
    return null;
  }
}

export async function fetchClassInsights(
  classroomId: string,
  progress: StudentProgressRow[]
): Promise<{ data: ClassInsights | null; error: string | null }> {
  if (!hasSupabaseConfig || !supabase) {
    return { data: null, error: "Supabase тохиргоо байхгүй." };
  }
  const client = supabase;
  const ids = progress.map((s) => s.studentUserId).filter((x): x is string => Boolean(x));
  const since30 = daysAgoIso(30);

  const [attemptsRes, pointsMap, ranks, sessionsRes, attendanceRes, lastExam, quizLast] =
    await Promise.all([
      ids.length
        ? fetchPaged<RawAttempt>((from, to) =>
            client
              .from("question_attempts")
              .select(
                "user_id, lesson_id, stage, question_id, question_type, is_correct, selected_answer, correct_answer, created_at"
              )
              .in("user_id", ids)
              .order("created_at", { ascending: false })
              .range(from, to)
          )
        : Promise.resolve({ rows: [] as RawAttempt[], truncated: false, error: null }),
      fetchPointsInfo(ids),
      fetchClassRanks(classroomId),
      ids.length
        ? fetchPaged<{ user_id: string; day: string; seconds: number }>((from, to) =>
            client
              .from("user_activity_sessions")
              .select("user_id, day, seconds")
              .in("user_id", ids)
              .gte("day", since30)
              .range(from, to)
          )
        : Promise.resolve({ rows: [], truncated: false, error: null }),
      client
        .from("classroom_attendance")
        .select("student_id, status")
        .eq("classroom_id", classroomId)
        .gte("session_date", since30),
      fetchLastExam(classroomId),
      ids.length
        ? client
            .from("user_quiz_attempts")
            .select("user_id, created_at")
            .in("user_id", ids)
            .order("created_at", { ascending: false })
            .limit(500)
        : Promise.resolve({ data: [] as { user_id: string; created_at: string }[] }),
    ]);

  const seconds30 = new Map<string, number>();
  const lastActivity = new Map<string, string>();
  const bump = (uid: string, iso: string) => {
    const cur = lastActivity.get(uid);
    if (!cur || iso > cur) lastActivity.set(uid, iso);
  };
  for (const r of sessionsRes.rows) {
    seconds30.set(r.user_id, (seconds30.get(r.user_id) ?? 0) + Number(r.seconds ?? 0));
    bump(r.user_id, `${r.day}T12:00:00+08:00`);
  }
  for (const r of attemptsRes.rows) bump(r.user_id, r.created_at);
  for (const r of (quizLast.data ?? []) as { user_id: string; created_at: string }[]) {
    bump(r.user_id, r.created_at);
  }

  const dbIds = attemptsRes.rows
    .filter((r) => !r.is_correct)
    .map((r) => dbIdFromQuestionId(r.question_id))
    .filter((x): x is number => x != null);
  const [questionTexts, lessonTitles] = await Promise.all([
    fetchQuestionTexts(dbIds),
    fetchLessonTitles(attemptsRes.rows.map((r) => r.lesson_id)),
  ]);

  const data = buildClassInsights({
    progress,
    attempts: attemptsRes.rows,
    points: pointsMap,
    ranks,
    seconds30,
    lastActivity,
    attendance: ((attendanceRes.data ?? []) as AttendanceRow[]),
    lastExam,
    lessonTitles,
    questionTexts,
    truncated: attemptsRes.truncated,
  });
  return { data, error: attemptsRes.error };
}

/* ------------------------------------------------------------------ */
/* Сурагчийн дэлгэрэнгүй                                               */
/* ------------------------------------------------------------------ */

export type LessonRecord = {
  lessonId: string;
  title: string | null;
  bestScorePct: number;
  attempts: number;
  lastAttemptAt: string | null;
  firstAttemptAt: string | null;
};

export type RecentMistake = {
  questionId: string;
  lessonId: string;
  text: string | null;
  selected: string | null;
  correct: string | null;
  at: string;
};

export type StudentAssignmentRow = {
  assignmentId: string;
  title: string;
  dueDate: string | null;
  status: string;
  quizPercentage: number | null;
  targeted: boolean;
};

export type DailySeries = { labels: string[]; points: number[]; minutes: number[] };

export type StudentDetail = {
  userId: string;
  name: string;
  studentRowId: string;
  points: PointsInfo | null;
  rank: number | null;
  classSize: number;
  accuracy: number | null;
  attempts: number;
  areaStats: AreaStat[];
  weakArea: WeakSpotArea | null;
  grade: LearnerGradeBucket;
  gradeScore: number | null;
  attendancePct: number | null;
  minutes30: number;
  daily: DailySeries;
  records: LessonRecord[];
  mistakes: RecentMistake[];
  assignments: StudentAssignmentRow[];
  lessonTitles: Record<string, string>;
  quizzes: {
    quizId: string;
    title: string;
    scorePct: number | null;
    submittedAt: string | null;
  }[];
};

function dayRange(days: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    out.push(mongoliaDay(new Date(Date.now() - i * 86_400_000)));
  }
  return out;
}

export async function fetchStudentDetail(
  classroomId: string,
  studentUserId: string,
  progress: StudentProgressRow[]
): Promise<{ data: StudentDetail | null; error: string | null }> {
  if (!hasSupabaseConfig || !supabase) {
    return { data: null, error: "Supabase тохиргоо байхгүй." };
  }
  const client = supabase;
  const row = progress.find((s) => s.studentUserId === studentUserId);
  if (!row) return { data: null, error: "Сурагч энэ ангид олдсонгүй." };
  const since30 = daysAgoIso(30);

  const [
    attemptsRes,
    pointsMap,
    ranks,
    sessionsRes,
    dailyPointsRes,
    attendanceRes,
    recordsRes,
    assignmentsRes,
    quizAttemptsRes,
  ] = await Promise.all([
    fetchPaged<RawAttempt>((from, to) =>
      client
        .from("question_attempts")
        .select(
          "user_id, lesson_id, stage, question_id, question_type, is_correct, selected_answer, correct_answer, created_at"
        )
        .eq("user_id", studentUserId)
        .order("created_at", { ascending: false })
        .range(from, to)
    ),
    fetchPointsInfo([studentUserId]),
    fetchClassRanks(classroomId),
    client
      .from("user_activity_sessions")
      .select("day, seconds")
      .eq("user_id", studentUserId)
      .gte("day", since30),
    client
      .from("user_points_daily")
      .select("day, points")
      .eq("user_id", studentUserId)
      .gte("day", since30),
    client
      .from("classroom_attendance")
      .select("student_id, status")
      .eq("classroom_id", classroomId)
      .eq("student_id", row.studentRowId)
      .gte("session_date", since30),
    client
      .from("student_lesson_records")
      .select("lesson_id, best_score_pct, attempts, last_attempt_at, first_attempt_at")
      .eq("user_id", studentUserId)
      .order("last_attempt_at", { ascending: false })
      .limit(200),
    client
      .from("assignments")
      .select("id, title, due_date, target_student_user_id, created_at")
      .eq("classroom_id", classroomId)
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("class_quiz_attempts")
      .select("quiz_id, score_pct, submitted_at, class_quizzes(title)")
      .eq("student_user_id", studentUserId)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(20),
  ]);

  const assignmentIds = ((assignmentsRes.data ?? []) as { id: string }[]).map((a) => a.id);
  const resultsRes = assignmentIds.length
    ? await client
        .from("assignment_results")
        .select("assignment_id, status, quiz_percentage")
        .eq("student_user_id", studentUserId)
        .in("assignment_id", assignmentIds)
    : { data: [] as { assignment_id: string; status: string; quiz_percentage: number | null }[] };
  const resultByAssignment = new Map(
    ((resultsRes.data ?? []) as { assignment_id: string; status: string; quiz_percentage: number | null }[]).map(
      (r) => [r.assignment_id, r]
    )
  );

  const attempts = attemptsRes.rows;
  const graded = attempts.filter((r) => isGradedAttempt(toWeakAttempt(r)));
  const wrongRows = graded.filter((r) => !r.is_correct);
  const areaStats = buildAreaStats(graded.map(toWeakAttempt));
  const verdict = buildVerdict(areaStats);
  const accuracy = pct(graded.length - wrongRows.length, graded.length);

  const recentWrong = wrongRows.slice(0, 15);
  const [questionTexts, lessonTitles] = await Promise.all([
    fetchQuestionTexts(
      recentWrong
        .map((r) => dbIdFromQuestionId(r.question_id))
        .filter((x): x is number => x != null)
    ),
    fetchLessonTitles([
      ...recentWrong.map((r) => r.lesson_id),
      ...((recordsRes.data ?? []) as { lesson_id: string }[]).map((r) => r.lesson_id),
    ]),
  ]);

  const labels = dayRange(30);
  const ptsByDay = new Map<string, number>();
  for (const r of (dailyPointsRes.data ?? []) as { day: string; points: number }[]) {
    ptsByDay.set(String(r.day), Number(r.points ?? 0));
  }
  const minByDay = new Map<string, number>();
  let seconds30 = 0;
  for (const r of (sessionsRes.data ?? []) as { day: string; seconds: number }[]) {
    const d = String(r.day);
    minByDay.set(d, (minByDay.get(d) ?? 0) + Number(r.seconds ?? 0) / 60);
    seconds30 += Number(r.seconds ?? 0);
  }

  const score = computeClassLearnerScore({
    quizPercent:
      row.latestQuizPercentage ?? (graded.length >= MIN_TOTAL_ATTEMPTS ? accuracy : null),
    completionRate: row.completionRate,
    assignmentsAssigned: row.assignmentsAssigned,
    assignmentsCompleted: row.assignmentsCompleted,
    learnedWords: row.learnedWordsCount,
  });

  const att = attendanceRateByStudent((attendanceRes.data ?? []) as AttendanceRow[]);

  const assignments: StudentAssignmentRow[] = (
    (assignmentsRes.data ?? []) as {
      id: string;
      title: string;
      due_date: string | null;
      target_student_user_id: string | null;
    }[]
  )
    .filter((a) => !a.target_student_user_id || a.target_student_user_id === studentUserId)
    .map((a) => {
      const res = resultByAssignment.get(a.id);
      return {
        assignmentId: a.id,
        title: a.title,
        dueDate: a.due_date,
        status: res?.status ?? "not_started",
        quizPercentage: res?.quiz_percentage ?? null,
        targeted: a.target_student_user_id === studentUserId,
      };
    });

  return {
    data: {
      userId: studentUserId,
      name: row.displayName,
      studentRowId: row.studentRowId,
      points: pointsMap.get(studentUserId) ?? null,
      rank: ranks.get(studentUserId)?.rank ?? null,
      classSize: ranks.size,
      accuracy,
      attempts: graded.length,
      areaStats,
      weakArea: verdict.kind === "weakest" ? verdict.area : null,
      grade: score.grade,
      gradeScore: score.total,
      attendancePct: att.get(row.studentRowId) ?? null,
      minutes30: Math.round(seconds30 / 60),
      daily: {
        labels: labels.map((d) => d.slice(5)),
        points: labels.map((d) => ptsByDay.get(d) ?? 0),
        minutes: labels.map((d) => Math.round(minByDay.get(d) ?? 0)),
      },
      records: (
        (recordsRes.data ?? []) as {
          lesson_id: string;
          best_score_pct: number;
          attempts: number;
          last_attempt_at: string | null;
          first_attempt_at: string | null;
        }[]
      ).map((r) => ({
        lessonId: r.lesson_id,
        title: lessonTitles[r.lesson_id] ?? null,
        bestScorePct: Number(r.best_score_pct),
        attempts: Number(r.attempts),
        lastAttemptAt: r.last_attempt_at,
        firstAttemptAt: r.first_attempt_at,
      })),
      mistakes: recentWrong.map((r) => {
        const dbId = dbIdFromQuestionId(r.question_id);
        const info = dbId != null ? questionTexts.get(dbId) : undefined;
        return {
          questionId: r.question_id,
          lessonId: r.lesson_id,
          text: info?.text ?? null,
          selected: r.selected_answer,
          correct: r.correct_answer ?? info?.correctAnswer ?? null,
          at: r.created_at,
        };
      }),
      assignments,
      lessonTitles,
      quizzes: (
        (quizAttemptsRes.data ?? []) as unknown as {
          quiz_id: string;
          score_pct: number | null;
          submitted_at: string | null;
          class_quizzes: { title: string } | { title: string }[] | null;
        }[]
      ).map((r) => {
        const cq = Array.isArray(r.class_quizzes) ? r.class_quizzes[0] : r.class_quizzes;
        return {
          quizId: r.quiz_id,
          title: cq?.title ?? "Хурдан сорил",
          scorePct: r.score_pct != null ? Number(r.score_pct) : null,
          submittedAt: r.submitted_at,
        };
      }),
    },
    error: attemptsRes.error,
  };
}

export { VERDICT_AREAS };
