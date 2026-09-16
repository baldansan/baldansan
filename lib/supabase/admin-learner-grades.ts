import "server-only";

import {
  computeLearnerScore,
  type LearnerGradeBucket,
  type LearnerScore,
} from "@/lib/learner-grade";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type LearnerGradeRow = {
  userId: string;
  /** Name from a classroom roster when one exists, otherwise null. */
  displayName: string | null;
  email: string | null;
  quizAttempts: number;
  quizAveragePercent: number | null;
  mockAttempts: number;
  mockAveragePercent: number | null;
  completedLessons: number;
  learnedWords: number;
  activeMinutes: number;
  lastActiveAt: string | null;
  score: LearnerScore;
};

export type LearnerGradeBoard = {
  rows: LearnerGradeRow[];
  /** Counts per bucket in A → F → unrated order. */
  distribution: { bucket: LearnerGradeBucket; count: number }[];
  ratedCount: number;
  averageScore: number | null;
  warnings: string[];
};

/** PostgREST caps a single response, so wide reads page through. */
const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

type Accumulator = {
  quizTotalPercent: number;
  quizAttempts: number;
  mockTotalPercent: number;
  mockAttempts: number;
  completedLessons: number;
  learnedWords: number;
  activeSeconds: number;
  lastActiveAt: string | null;
};

function emptyAccumulator(): Accumulator {
  return {
    quizTotalPercent: 0,
    quizAttempts: 0,
    mockTotalPercent: 0,
    mockAttempts: 0,
    completedLessons: 0,
    learnedWords: 0,
    activeSeconds: 0,
    lastActiveAt: null,
  };
}

type SupabaseServerClient = NonNullable<
  Awaited<ReturnType<typeof createServerSupabaseClient>>
>;

/** Read every row of a table's selected columns, a page at a time. */
async function readAll(
  client: SupabaseServerClient,
  table: string,
  columns: string,
  warnings: string[]
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE;
    const { data, error } = await client
      .from(table)
      .select(columns)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      warnings.push(`${table} уншиж чадсангүй: ${error.message}`);
      return rows;
    }
    const batch = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }

  return rows;
}

function touchLastActive(acc: Accumulator, value: unknown) {
  if (typeof value !== "string" || !value) return;
  if (!acc.lastActiveAt || value > acc.lastActiveAt) {
    acc.lastActiveAt = value;
  }
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Grades for every learner with any recorded activity.
 *
 * Reads are bulk and column-narrow — five table scans total, not one per
 * learner — because this page has to stay usable as the user base grows.
 */
export async function getLearnerGradeBoard(
  options: { activityWindowDays?: number } = {}
): Promise<LearnerGradeBoard> {
  const warnings: string[] = [];
  const empty: LearnerGradeBoard = {
    rows: [],
    distribution: [],
    ratedCount: 0,
    averageScore: null,
    warnings,
  };

  if (!hasSupabaseConfig) {
    warnings.push("Supabase тохиргоо алга.");
    return empty;
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    warnings.push("Supabase холболт үүсгэж чадсангүй.");
    return empty;
  }

  const windowDays = options.activityWindowDays ?? 90;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (windowDays - 1));
  const sinceDay = since.toISOString().slice(0, 10);

  const [quizRows, mockRows, lessonRows, wordRows] = await Promise.all([
    readAll(
      client,
      "user_quiz_attempts",
      "user_id, percentage, created_at",
      warnings
    ),
    readAll(
      client,
      "user_test_attempts",
      "user_id, score, max_score, finished_at",
      warnings
    ),
    readAll(
      client,
      "user_lesson_progress",
      "user_id, status, completed_at, updated_at",
      warnings
    ),
    readAll(
      client,
      "user_vocabulary_progress",
      "user_id, status, learned_at",
      warnings
    ),
  ]);

  // Activity is optional: the table only exists once migration 050 has run.
  let activityRows: Record<string, unknown>[] = [];
  {
    const { data, error } = await client
      .from("user_activity_sessions")
      .select("user_id, seconds, day")
      .gte("day", sinceDay)
      .limit(20000);
    if (error) {
      warnings.push(
        "Хэрэглээний хэмжилт унших боломжгүй байна — 050_learner_activity.sql миграцыг шалгана уу."
      );
    } else {
      activityRows = (data ?? []) as unknown as Record<string, unknown>[];
    }
  }

  const byUser = new Map<string, Accumulator>();
  const ensure = (userId: string): Accumulator => {
    const existing = byUser.get(userId);
    if (existing) return existing;
    const created = emptyAccumulator();
    byUser.set(userId, created);
    return created;
  };

  for (const row of quizRows) {
    const userId = row.user_id ? String(row.user_id) : "";
    if (!userId) continue;
    const acc = ensure(userId);
    acc.quizAttempts += 1;
    acc.quizTotalPercent += toNumber(row.percentage);
    touchLastActive(acc, row.created_at);
  }

  for (const row of mockRows) {
    const userId = row.user_id ? String(row.user_id) : "";
    if (!userId) continue;
    const maxScore = toNumber(row.max_score);
    if (maxScore <= 0) continue;
    const acc = ensure(userId);
    acc.mockAttempts += 1;
    acc.mockTotalPercent += (toNumber(row.score) / maxScore) * 100;
    touchLastActive(acc, row.finished_at);
  }

  for (const row of lessonRows) {
    const userId = row.user_id ? String(row.user_id) : "";
    if (!userId) continue;
    const acc = ensure(userId);
    if (String(row.status) === "completed") acc.completedLessons += 1;
    touchLastActive(acc, row.completed_at ?? row.updated_at);
  }

  for (const row of wordRows) {
    const userId = row.user_id ? String(row.user_id) : "";
    if (!userId) continue;
    const acc = ensure(userId);
    if (String(row.status) === "learned") acc.learnedWords += 1;
    touchLastActive(acc, row.learned_at);
  }

  for (const row of activityRows) {
    const userId = row.user_id ? String(row.user_id) : "";
    if (!userId) continue;
    ensure(userId).activeSeconds += toNumber(row.seconds);
  }

  const names = await readRosterNames(client);

  const rows: LearnerGradeRow[] = [...byUser.entries()].map(
    ([userId, acc]) => {
      const quizAveragePercent =
        acc.quizAttempts > 0 ? acc.quizTotalPercent / acc.quizAttempts : null;
      const mockAveragePercent =
        acc.mockAttempts > 0 ? acc.mockTotalPercent / acc.mockAttempts : null;
      const activeMinutes = Math.round(acc.activeSeconds / 60);

      const score = computeLearnerScore({
        quizAttempts: acc.quizAttempts,
        quizAveragePercent,
        mockAttempts: acc.mockAttempts,
        mockAveragePercent,
        completedLessons: acc.completedLessons,
        learnedWords: acc.learnedWords,
        activeMinutes,
      });

      const roster = names.get(userId);

      return {
        userId,
        displayName: roster?.displayName ?? null,
        email: roster?.email ?? null,
        quizAttempts: acc.quizAttempts,
        quizAveragePercent:
          quizAveragePercent == null ? null : Math.round(quizAveragePercent),
        mockAttempts: acc.mockAttempts,
        mockAveragePercent:
          mockAveragePercent == null ? null : Math.round(mockAveragePercent),
        completedLessons: acc.completedLessons,
        learnedWords: acc.learnedWords,
        activeMinutes,
        lastActiveAt: acc.lastActiveAt,
        score,
      };
    }
  );

  rows.sort((a, b) => {
    const left = a.score.total ?? -1;
    const right = b.score.total ?? -1;
    if (left !== right) return right - left;
    return b.quizAttempts - a.quizAttempts;
  });

  const rated = rows.filter((row) => row.score.total != null);
  const averageScore =
    rated.length > 0
      ? Math.round(
          rated.reduce((sum, row) => sum + (row.score.total ?? 0), 0) /
            rated.length
        )
      : null;

  const counts = new Map<LearnerGradeBucket, number>();
  for (const row of rows) {
    counts.set(row.score.grade, (counts.get(row.score.grade) ?? 0) + 1);
  }

  return {
    rows,
    distribution: (["A", "B", "C", "D", "F", "unrated"] as const).map(
      (bucket) => ({ bucket, count: counts.get(bucket) ?? 0 })
    ),
    ratedCount: rated.length,
    averageScore,
    warnings,
  };
}

/** Names from class rosters, when the admin can read them. */
async function readRosterNames(
  client: SupabaseServerClient
): Promise<Map<string, { displayName: string | null; email: string | null }>> {
  const names = new Map<
    string,
    { displayName: string | null; email: string | null }
  >();

  try {
    const { data, error } = await client
      .from("classroom_students")
      .select("student_user_id, display_name, email")
      .not("student_user_id", "is", null)
      .limit(5000);

    if (error || !data) return names;

    for (const row of data as unknown as Record<string, unknown>[]) {
      const userId = row.student_user_id ? String(row.student_user_id) : "";
      if (!userId || names.has(userId)) continue;
      names.set(userId, {
        displayName: row.display_name ? String(row.display_name) : null,
        email: row.email ? String(row.email) : null,
      });
    }
  } catch {
    // Roster names are a nicety; the board works without them.
  }

  return names;
}
