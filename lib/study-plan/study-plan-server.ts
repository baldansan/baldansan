import { cookies } from "next/headers";
import {
  lessonPath,
  getPublicLessonSummariesByCourseId,
} from "@/lib/content";
import {
  ACTIVE_HSK_LEVEL_KEY,
  activeLevelToCatalogLevel,
  filterLessonsByActiveHskLevel,
  formatActiveHskLevel,
  resolveServerActiveHskLevel,
  primaryCourseIdForActiveLevel,
  type ActiveHskLevel,
} from "@/lib/hsk/active-hsk-level";
import {
  collectTargetLessonIds,
  weakLessonsFromResponses,
  type LessonTitleRow,
} from "@/lib/mock-test/weak-lessons";
import type { MockTestQuestionRow } from "@/lib/mock-test/types";
import {
  getActiveDatesFromSupabaseRows,
  getWeekActivity,
  toLocalDateKey,
  addDays,
} from "@/lib/retention/streak-utils";
import { DAILY_SRS_GOAL } from "@/lib/srs/word-srs-types";
import {
  fetchBichlegContinueTarget,
  fetchSeriesWatchProgressMap,
} from "@/lib/supabase/video-progress-server";
import { fetchVideoSeriesCatalog } from "@/lib/supabase/videos-server";
import {
  createServerSupabaseClient,
  hasServerSupabaseConfig,
} from "@/lib/supabase/server";
import { normalizeLessonStatus } from "@/lib/supabase/progress";
import {
  DEFAULT_DAILY_GOAL,
  type GoalProgress,
} from "@/lib/retention/types";
import { getSupabaseRetentionSummary } from "@/lib/supabase/retention";
import {
  buildWeeklyPlan,
  type StudyPlanWeeklyItem,
} from "@/lib/study-plan/weekly-plan";

export type StudyPlanTask = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  href: string;
  done?: boolean;
};

export type StudyPlanWeekDay = {
  label: string;
  active: boolean;
  isToday: boolean;
};

export type StudyPlanDailyGoal = {
  goalProgress: GoalProgress;
  sourceLabel: string;
  lessonsPerDay: number;
};

export type StudyPlanData = {
  isLoggedIn: boolean;
  levelLabel: string;
  courseHref: string;
  tasks: StudyPlanTask[];
  weekDays: StudyPlanWeekDay[];
  weeklyPlan: StudyPlanWeeklyItem[];
  dailyGoal: StudyPlanDailyGoal | null;
  currentStreak: number;
  progress: {
    lessonsDone: number;
    lessonsTotal: number;
    srsWords: number;
    videosWatched: number;
    videosTotal: number;
  };
};

const WEEKDAY_MN = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"] as const;

function sortLessons<T extends { id: string }>(lessons: T[]): T[] {
  return [...lessons].sort((a, b) => {
    const na = Number(a.id);
    const nb = Number(b.id);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.id.localeCompare(b.id);
  });
}

function lessonLabel(
  lessons: { id: string }[],
  lessonId: string,
  levelLabel: string
): string {
  const sorted = sortLessons(lessons);
  const idx = sorted.findIndex((l) => l.id === lessonId);
  const n = idx >= 0 ? idx + 1 : lessonId;
  return `${levelLabel} · ${n}-р хичээл`;
}

async function countDueWords(
  userId: string,
  activeLevel: ActiveHskLevel
): Promise<number> {
  const client = await createServerSupabaseClient();
  if (!client) return 0;

  const catalogLevel = activeLevelToCatalogLevel(activeLevel);
  const nowIso = new Date().toISOString();

  const { data: dueRows, error } = await client
    .from("user_word_srs")
    .select("word_id")
    .eq("user_id", userId)
    .lte("due_at", nowIso)
    .limit(DAILY_SRS_GOAL * 20);

  if (error || !dueRows?.length) return 0;

  const wordIds = dueRows.map((r) => r.word_id as number).filter(Boolean);
  const eligible = new Set<number>();

  for (let i = 0; i < wordIds.length; i += 200) {
    const chunk = wordIds.slice(i, i + 200);
    const { data: words } = await client
      .from("hsk_words")
      .select("id")
      .in("id", chunk)
      .eq("hsk_level", catalogLevel)
      .eq("is_function_word", false);
    for (const w of words ?? []) {
      if (w.id != null) eligible.add(w.id as number);
    }
  }

  return eligible.size;
}

async function countSrsWords(userId: string): Promise<number> {
  const client = await createServerSupabaseClient();
  if (!client) return 0;

  const { count, error } = await client
    .from("user_word_srs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("reps", 0);

  if (error) return 0;
  return count ?? 0;
}

async function resolveLessonTask(
  userId: string,
  activeLevel: ActiveHskLevel,
  levelLabel: string
): Promise<StudyPlanTask | null> {
  const courseId = primaryCourseIdForActiveLevel(activeLevel);
  const allLessons = await getPublicLessonSummariesByCourseId(courseId);
  const lessons = sortLessons(
    filterLessonsByActiveHskLevel(allLessons, activeLevel)
  );
  if (!lessons.length) return null;

  const client = await createServerSupabaseClient();
  if (!client) return null;

  const lessonIds = lessons.map((l) => l.id);
  const { data: progressRows } = await client
    .from("user_lesson_progress")
    .select("lesson_id, status, updated_at")
    .eq("user_id", userId)
    .in("lesson_id", lessonIds);

  const statusByLesson = new Map(
    (progressRows ?? []).map((r) => [
      String(r.lesson_id),
      normalizeLessonStatus(String(r.status)),
    ])
  );

  const started = (progressRows ?? [])
    .filter((r) => normalizeLessonStatus(String(r.status)) === "started")
    .sort(
      (a, b) =>
        new Date(String(b.updated_at)).getTime() -
        new Date(String(a.updated_at)).getTime()
    )[0];

  const targetId =
    (started ? String(started.lesson_id) : null) ??
    lessons.find((l) => statusByLesson.get(l.id) === "not_started")?.id ??
    lessons.find((l) => statusByLesson.get(l.id) !== "completed")?.id ??
    lessons[0]?.id;

  if (!targetId) return null;

  const status = statusByLesson.get(targetId) ?? "not_started";
  const lesson = lessons.find((l) => l.id === targetId);
  const title =
    status === "started" ? "Үргэлжлүүлэх хичээл" : "Дараагийн хичээл";

  return {
    id: "lesson",
    emoji: "📖",
    title,
    subtitle: lessonLabel(lessons, targetId, levelLabel),
    href: lessonPath(targetId),
  };
}

async function resolveBichlegTask(): Promise<StudyPlanTask | null> {
  const continued = await fetchBichlegContinueTarget();
  if (continued) {
    return {
      id: "bichleg",
      emoji: "▶",
      title: "Бичлэг",
      subtitle: `Үргэлжлүүлэх: ${continued.title}`,
      href: continued.href,
    };
  }

  const userId = await getServerUserId();
  if (!userId) return null;

  const client = await createServerSupabaseClient();
  if (!client) return null;

  const { data: videos } = await client
    .from("videos")
    .select("id, title_mn, title_zh, series_id, episode_no")
    .order("series_id", { ascending: true })
    .order("episode_no", { ascending: true, nullsFirst: false });

  if (!videos?.length) return null;

  const { data: completed } = await client
    .from("user_video_progress")
    .select("video_id")
    .eq("user_id", userId)
    .eq("completed", true);

  const done = new Set((completed ?? []).map((r) => String(r.video_id)));
  const next = videos.find((v) => !done.has(String(v.id)));
  if (!next?.series_id) return null;

  const title =
    (next.title_mn ? String(next.title_mn) : null) ??
    (next.title_zh ? String(next.title_zh) : null) ??
    "Бичлэг";
  const ep =
    next.episode_no != null ? `${Number(next.episode_no)}-р анги` : "Дараагийн анги";

  return {
    id: "bichleg",
    emoji: "▶",
    title: "Бичлэг",
    subtitle: `${title} · ${ep}`,
    href: `/bichleg/${encodeURIComponent(String(next.series_id))}`,
  };
}

async function getServerUserId(): Promise<string | null> {
  if (!hasServerSupabaseConfig) return null;
  const client = await createServerSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

function mapQuestion(raw: Record<string, unknown>): MockTestQuestionRow {
  return {
    id: String(raw.id),
    test_id: String(raw.test_id),
    skill: String(raw.skill),
    part: Number(raw.part),
    q_no: Number(raw.q_no),
    q_type: String(raw.q_type),
    stem: raw.stem ? String(raw.stem) : null,
    options: null,
    correct_answer: raw.correct_answer ? String(raw.correct_answer) : null,
    autograde: String(raw.autograde ?? "auto"),
    points: Number(raw.points ?? 1),
    audio_url: null,
    image_url: null,
    needs_image: false,
    tags: [],
    target_lesson_id: raw.target_lesson_id ? String(raw.target_lesson_id) : null,
    explanation_mn: null,
  };
}

async function resolveWeakSpotTask(
  userId: string
): Promise<StudyPlanTask | null> {
  const client = await createServerSupabaseClient();
  if (!client) return null;

  const { data: attempt } = await client
    .from("user_test_attempts")
    .select("id, test_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!attempt?.test_id) return null;

  const attemptId = String(attempt.id);
  const testId = String(attempt.test_id);

  const [questionsResult, responsesResult] = await Promise.all([
    client.from("mock_test_questions").select("*").eq("test_id", testId),
    client
      .from("user_question_responses")
      .select("question_id, is_correct")
      .eq("attempt_id", attemptId),
  ]);

  if (questionsResult.error || responsesResult.error) return null;

  const questions = (questionsResult.data ?? []).map((row) =>
    mapQuestion(row as Record<string, unknown>)
  );
  const responses = responsesResult.data ?? [];
  const lessonIds = collectTargetLessonIds(questions);

  const { data: lessonRows } = await client
    .from("lessons")
    .select("id, title, title_mn")
    .in("id", lessonIds)
    .eq("status", "available");

  const lessons: LessonTitleRow[] = (lessonRows ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    title_mn: row.title_mn ? String(row.title_mn) : null,
  }));

  const weak = weakLessonsFromResponses(responses, questions, lessons, 1)[0];
  if (!weak) return null;

  return {
    id: "weak",
    emoji: "🎯",
    title: "Сул тал",
    subtitle: `Сул талаа нөхөх: ${weak.title}`,
    href: lessonPath(weak.lessonId),
  };
}

async function fetchWeekDays(
  userId: string
): Promise<{ weekDays: StudyPlanWeekDay[]; currentStreak: number }> {
  const client = await createServerSupabaseClient();
  const today = toLocalDateKey();
  const emptyWeek = Array.from({ length: 7 }, (_, i) => {
    const dateKey = addDays(today, i - 6);
    const d = new Date(dateKey);
    return {
      label: WEEKDAY_MN[d.getDay()],
      active: false,
      isToday: i === 6,
    };
  });

  if (!client) {
    return { weekDays: emptyWeek, currentStreak: 0 };
  }

  const [{ data: activity }, { data: streakRow }] = await Promise.all([
    client
      .from("user_daily_activity")
      .select("activity_date, count")
      .eq("user_id", userId),
    client
      .from("user_streaks")
      .select("current_streak")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const activeDates = getActiveDatesFromSupabaseRows(
    (activity ?? []).map((r) => ({
      activity_date: String(r.activity_date),
      count: Number(r.count ?? 0),
    }))
  );
  const { weekActivity } = getWeekActivity(activeDates, today);

  const weekDays = weekActivity.map((active, i) => {
    const dateKey = addDays(today, i - 6);
    const d = new Date(dateKey);
    return {
      label: WEEKDAY_MN[d.getDay()],
      active,
      isToday: i === 6,
    };
  });

  return {
    weekDays,
    currentStreak: Number(streakRow?.current_streak ?? 0),
  };
}

async function fetchVideoProgressTotals(
  userId: string
): Promise<{ watched: number; total: number }> {
  const catalog = await fetchVideoSeriesCatalog();
  const seriesIds = catalog.map((s) => s.id);
  const totals: Record<string, number> = {};
  let total = 0;
  for (const s of catalog) {
    totals[s.id] = s.videoCount;
    total += s.videoCount;
  }

  const progressMap = await fetchSeriesWatchProgressMap(seriesIds, totals);
  let watched = 0;
  for (const id of seriesIds) {
    watched += progressMap[id]?.watchedCount ?? 0;
  }

  void userId;
  return { watched, total };
}

export async function loadStudyPlanData(): Promise<StudyPlanData> {
  const cookieStore = await cookies();
  const activeLevel = resolveServerActiveHskLevel(
    cookieStore.get(ACTIVE_HSK_LEVEL_KEY)?.value
  );
  const levelLabel = formatActiveHskLevel(activeLevel);

  const courseId = primaryCourseIdForActiveLevel(activeLevel);
  const courseHref = `/courses/${courseId}`;
  const weeklyPlan = buildWeeklyPlan(courseHref);

  const userId = await getServerUserId();
  if (!userId) {
    return {
      isLoggedIn: false,
      levelLabel,
      courseHref,
      tasks: [],
      weekDays: [],
      weeklyPlan,
      dailyGoal: null,
      currentStreak: 0,
      progress: {
        lessonsDone: 0,
        lessonsTotal: 0,
        srsWords: 0,
        videosWatched: 0,
        videosTotal: 0,
      },
    };
  }
  const allLessons = await getPublicLessonSummariesByCourseId(courseId);
  const levelLessons = sortLessons(
    filterLessonsByActiveHskLevel(allLessons, activeLevel)
  );
  const lessonIds = levelLessons.map((l) => l.id);

  const client = await createServerSupabaseClient();

  const [
    lessonTask,
    dueCount,
    bichlegTask,
    weakTask,
    weekMeta,
    srsWords,
    videoTotals,
    progressRows,
    retentionResult,
  ] = await Promise.all([
    resolveLessonTask(userId, activeLevel, levelLabel),
    countDueWords(userId, activeLevel),
    resolveBichlegTask(),
    resolveWeakSpotTask(userId),
    fetchWeekDays(userId),
    countSrsWords(userId),
    fetchVideoProgressTotals(userId),
    client && lessonIds.length
      ? client
          .from("user_lesson_progress")
          .select("lesson_id, status")
          .eq("user_id", userId)
          .in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] as { lesson_id: string; status: string }[] }),
    getSupabaseRetentionSummary(userId),
  ]);

  const retention = retentionResult.data;
  const dailyGoal: StudyPlanDailyGoal = {
    goalProgress: retention?.goalProgress ?? {
      lessons: { current: 0, target: DEFAULT_DAILY_GOAL.lessonsPerDay, met: false },
      words: { current: 0, target: DEFAULT_DAILY_GOAL.wordsPerDay, met: false },
      quizzes: { current: 0, target: DEFAULT_DAILY_GOAL.quizzesPerDay, met: false },
      overallMet: false,
      overallPercent: 0,
    },
    sourceLabel: "Бүртгэлд хадгалагдаж байна",
    lessonsPerDay: retention?.goal.lessonsPerDay ?? DEFAULT_DAILY_GOAL.lessonsPerDay,
  };

  const lessonsDone = (progressRows.data ?? []).filter(
    (r) => normalizeLessonStatus(String(r.status)) === "completed"
  ).length;

  const reviewTask: StudyPlanTask = dueCount > 0
    ? {
        id: "review",
        emoji: "🔁",
        title: "Давталт",
        subtitle: `${dueCount} үг давтах`,
        href: "/review/daily",
      }
    : {
        id: "review",
        emoji: "🔁",
        title: "Давталт",
        subtitle: "Өнөөдрийн давталт дууссан ✓",
        href: "/review/daily",
        done: true,
      };

  const tasks: StudyPlanTask[] = [
    ...(lessonTask ? [lessonTask] : []),
    reviewTask,
    ...(bichlegTask ? [bichlegTask] : []),
    ...(weakTask ? [weakTask] : []),
  ];

  return {
    isLoggedIn: true,
    levelLabel,
    courseHref,
    tasks,
    weekDays: weekMeta.weekDays,
    weeklyPlan,
    dailyGoal,
    currentStreak: weekMeta.currentStreak,
    progress: {
      lessonsDone,
      lessonsTotal: levelLessons.length,
      srsWords,
      videosWatched: videoTotals.watched,
      videosTotal: videoTotals.total,
    },
  };
}
