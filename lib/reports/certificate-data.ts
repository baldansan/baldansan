import "server-only";

/**
 * Evidence for a course-completion certificate.
 *
 * Reads are bulk and column-narrow, in the same shape as
 * `lib/supabase/admin-training-center.ts`: a few table scans joined in memory,
 * never one query per student. Anything that cannot be read is reported as a
 * warning and left `null`, which the certificate check then treats as "unknown"
 * and refuses on — a missing read must never look like a passing grade.
 */

import { normalizePublishStatus } from "@/lib/lesson-publish";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  evaluateCertificate,
  type CertificateEvaluation,
  type CertificateInput,
} from "@/lib/reports/certificate";

export type CertificateCourseOption = {
  courseId: string;
  courseTitle: string;
  publishedLessonCount: number | null;
};

export type CertificateCandidateCourse = {
  courseId: string;
  courseTitle: string;
  completedLessons: number;
  publishedLessonCount: number | null;
};

export type CertificateCandidate = {
  userId: string;
  name: string | null;
  courses: CertificateCandidateCourse[];
};

export type CertificateSubject = {
  userId: string;
  studentName: string | null;
  courseId: string;
  courseTitle: string;
  courseLevel: string | null;
  input: CertificateInput;
  evaluation: CertificateEvaluation;
  /** Latest completion timestamp inside the course. Null when none recorded. */
  lastCompletedAt: string | null;
  /** Classes the student is on the roster of, for context in the picker. */
  classroomNames: string[];
};

export type CertificateData = {
  courses: CertificateCourseOption[];
  candidates: CertificateCandidate[];
  subject: CertificateSubject | null;
  /** Set when ?user= or ?course= named something that is not in the data. */
  notFound: string | null;
  warnings: string[];
};

const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

type SupabaseServerClient = NonNullable<
  Awaited<ReturnType<typeof createServerSupabaseClient>>
>;

type Row = Record<string, unknown>;

function text(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Read every row of a table's selected columns, a page at a time. */
async function readAll(
  client: SupabaseServerClient,
  table: string,
  columns: string,
  warnings: string[],
  filters: { column: string; value: string }[] = []
): Promise<{ rows: Row[]; ok: boolean }> {
  const rows: Row[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE;
    let query = client.from(table).select(columns);
    for (const filter of filters) {
      query = query.eq(filter.column, filter.value);
    }
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);

    if (error) {
      warnings.push(`${table} уншиж чадсангүй: ${error.message}`);
      return { rows, ok: false };
    }
    const batch = (data ?? []) as unknown as Row[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }

  return { rows, ok: true };
}

function isPublished(status: unknown): boolean {
  return normalizePublishStatus(String(status ?? "draft")) === "available";
}

export async function getCertificateData(
  options: { userId?: string | null; courseId?: string | null } = {}
): Promise<CertificateData> {
  const warnings: string[] = [];
  const requestedUserId = text(options.userId);
  const requestedCourseId = text(options.courseId);

  const empty: CertificateData = {
    courses: [],
    candidates: [],
    subject: null,
    notFound: null,
    warnings,
  };

  if (!hasSupabaseConfig) {
    warnings.push("Supabase тохиргоо алга — бичиг олгох өгөгдөл унших боломжгүй.");
    return empty;
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    warnings.push("Supabase холболт үүсгэж чадсангүй.");
    return empty;
  }

  const [courseRead, lessonRead, rosterRead, memberRead, progressRead] =
    await Promise.all([
      readAll(client, "courses", "id, title, level, status", warnings),
      readAll(client, "lessons", "id, course_id, title, status", warnings),
      readAll(
        client,
        "classroom_students",
        "classroom_id, student_user_id, display_name, email, status",
        warnings
      ),
      readAll(
        client,
        "organization_members",
        "user_id, display_name, email",
        warnings
      ),
      readAll(
        client,
        "user_lesson_progress",
        "user_id, lesson_id, status, completed_at, updated_at",
        warnings,
        [{ column: "status", value: "completed" }]
      ),
    ]);

  const classroomRead = await readAll(client, "classrooms", "id, name", warnings);

  // ------------------------------------------------------------- lesson index

  const courseTitles = new Map<string, string>();
  const courseLevels = new Map<string, string | null>();
  for (const row of courseRead.rows) {
    const id = text(row.id);
    if (!id) continue;
    courseTitles.set(id, text(row.title) ?? id);
    courseLevels.set(id, text(row.level));
  }

  /** lessonId → courseId, published lessons only. */
  const lessonCourse = new Map<string, string>();
  const publishedByCourse = new Map<string, number>();
  for (const row of lessonRead.rows) {
    const lessonId = text(row.id);
    const courseId = text(row.course_id);
    if (!lessonId || !courseId) continue;
    if (!isPublished(row.status)) continue;
    lessonCourse.set(lessonId, courseId);
    publishedByCourse.set(courseId, (publishedByCourse.get(courseId) ?? 0) + 1);
    if (!courseTitles.has(courseId)) courseTitles.set(courseId, courseId);
  }

  const courses: CertificateCourseOption[] = [...courseTitles.entries()]
    .map(([courseId, courseTitle]) => ({
      courseId,
      courseTitle,
      publishedLessonCount: lessonRead.ok
        ? (publishedByCourse.get(courseId) ?? 0)
        : null,
    }))
    .sort((a, b) => a.courseId.localeCompare(b.courseId, "mn"));

  // --------------------------------------------------------------- names

  const classroomNames = new Map<string, string>();
  for (const row of classroomRead.rows) {
    const id = text(row.id);
    if (!id) continue;
    classroomNames.set(id, text(row.name) ?? id);
  }

  const nameByUser = new Map<string, string>();
  const classesByUser = new Map<string, string[]>();
  for (const row of rosterRead.rows) {
    const userId = text(row.student_user_id);
    if (!userId) continue;
    if (text(row.status) === "removed") continue;
    const label = text(row.display_name) ?? text(row.email);
    if (label && !nameByUser.has(userId)) nameByUser.set(userId, label);
    const classroomId = text(row.classroom_id);
    const className = classroomId ? classroomNames.get(classroomId) : null;
    if (className) {
      const list = classesByUser.get(userId) ?? [];
      if (!list.includes(className)) list.push(className);
      classesByUser.set(userId, list);
    }
  }
  for (const row of memberRead.rows) {
    const userId = text(row.user_id);
    if (!userId || nameByUser.has(userId)) continue;
    const label = text(row.display_name) ?? text(row.email);
    if (label) nameByUser.set(userId, label);
  }

  // ------------------------------------------------- completed lessons

  /** userId → courseId → { count, lastAt } */
  const completedByUser = new Map<
    string,
    Map<string, { count: number; lastAt: string | null }>
  >();

  for (const row of progressRead.rows) {
    const userId = text(row.user_id);
    const lessonId = text(row.lesson_id);
    if (!userId || !lessonId) continue;
    const courseId = lessonCourse.get(lessonId);
    if (!courseId) continue;

    const byCourse = completedByUser.get(userId) ?? new Map();
    const entry = byCourse.get(courseId) ?? { count: 0, lastAt: null };
    entry.count += 1;
    const at = text(row.completed_at) ?? text(row.updated_at);
    if (at && (!entry.lastAt || at > entry.lastAt)) entry.lastAt = at;
    byCourse.set(courseId, entry);
    completedByUser.set(userId, byCourse);
  }

  const candidates: CertificateCandidate[] = [...completedByUser.entries()]
    .map(([userId, byCourse]) => ({
      userId,
      name: nameByUser.get(userId) ?? null,
      courses: [...byCourse.entries()]
        .map(([courseId, entry]) => ({
          courseId,
          courseTitle: courseTitles.get(courseId) ?? courseId,
          completedLessons: entry.count,
          publishedLessonCount: lessonRead.ok
            ? (publishedByCourse.get(courseId) ?? 0)
            : null,
        }))
        .sort((a, b) => b.completedLessons - a.completedLessons),
    }))
    .sort((a, b) =>
      (a.name ?? a.userId).localeCompare(b.name ?? b.userId, "mn")
    );

  if (!progressRead.ok) {
    warnings.push(
      "Хичээлийн ахиц уншигдаагүй тул нэг ч бичиг олгох боломжгүй — шалгах өгөгдөл байхгүй."
    );
  }

  // --------------------------------------------------------------- subject

  if (!requestedUserId || !requestedCourseId) {
    return { courses, candidates, subject: null, notFound: null, warnings };
  }

  if (!courseTitles.has(requestedCourseId)) {
    return {
      courses,
      candidates,
      subject: null,
      notFound: `«${requestedCourseId}» гэсэн курс бүртгэлд алга.`,
      warnings,
    };
  }

  const quizRead = await readAll(
    client,
    "user_quiz_attempts",
    "user_id, lesson_id, percentage, created_at",
    warnings,
    [{ column: "user_id", value: requestedUserId }]
  );

  let quizAttemptCount: number | null = null;
  let quizAveragePercent: number | null = null;
  if (quizRead.ok) {
    const percents: number[] = [];
    for (const row of quizRead.rows) {
      const lessonId = text(row.lesson_id);
      if (!lessonId) continue;
      if (lessonCourse.get(lessonId) !== requestedCourseId) continue;
      percents.push(toNumber(row.percentage));
    }
    quizAttemptCount = percents.length;
    quizAveragePercent =
      percents.length > 0
        ? Math.round(
            percents.reduce((sum, value) => sum + value, 0) / percents.length
          )
        : null;
  }

  const courseProgress = completedByUser.get(requestedUserId)?.get(requestedCourseId);
  const input: CertificateInput = {
    studentName: nameByUser.get(requestedUserId) ?? null,
    courseLessonCount: lessonRead.ok
      ? (publishedByCourse.get(requestedCourseId) ?? 0)
      : null,
    completedLessonCount: progressRead.ok ? (courseProgress?.count ?? 0) : null,
    quizAttemptCount,
    quizAveragePercent,
  };

  const subject: CertificateSubject = {
    userId: requestedUserId,
    studentName: input.studentName,
    courseId: requestedCourseId,
    courseTitle: courseTitles.get(requestedCourseId) ?? requestedCourseId,
    courseLevel: courseLevels.get(requestedCourseId) ?? null,
    input,
    evaluation: evaluateCertificate(input),
    lastCompletedAt: courseProgress?.lastAt ?? null,
    classroomNames: classesByUser.get(requestedUserId) ?? [],
  };

  return { courses, candidates, subject, notFound: null, warnings };
}
