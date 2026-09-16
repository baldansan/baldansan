import "server-only";

import {
  computeClassLearnerScore,
  gradeFromScore,
  summarizeGrades,
  type LearnerGradeBucket,
} from "@/lib/learner-grade";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Training-centre overview: every class in one place so a director can compare
 * them.
 *
 * Reads are bulk and column-narrow — a handful of table scans, never one query
 * per class or per student — because a centre with twelve classes today may
 * have sixty next year.
 *
 * Nothing here invents a number. Anything that cannot be computed from the
 * database comes back as `null`, and the view shows «—» plus the reason.
 */

export type ClassDeliveryMode = "in_person" | "online" | "hybrid";

export type TrainingCenterOrganizationOption = {
  id: string;
  name: string;
  organizationType: string | null;
  status: string | null;
  classroomCount: number;
};

export type TrainingCenterClassRow = {
  classroomId: string;
  name: string;
  /** Free-text level from the class row, when the centre filled one in. */
  level: string | null;
  /** hsk1 … hsk6 when the class is tied to a course, otherwise null. */
  courseId: string | null;
  /** Label built from courseId or level; null when neither is recorded. */
  levelLabel: string | null;
  deliveryMode: ClassDeliveryMode | null;
  scheduleNote: string | null;
  status: string | null;
  organizationId: string | null;
  organizationName: string | null;
  teacherUserId: string | null;
  teacherLabel: string;
  /** Everyone on the roster, including invitees who never signed in. */
  studentCount: number;
  /** Roster rows with a real user behind them — the only ones with data. */
  linkedStudentCount: number;
  assignmentCount: number;
  /** Mean of the rated students' scores, 0–100. Null when nobody is rated. */
  averageScore: number | null;
  averageGrade: LearnerGradeBucket;
  ratedStudentCount: number;
  /** Assignment completion across the class, 0–100. Null when nothing assigned. */
  completionRate: number | null;
  /** Mean tracked study minutes per linked student. Null when untracked. */
  averageStudyMinutes: number | null;
  /** Linked students with no recorded activity in the window. Null when none linked. */
  inactiveStudentCount: number | null;
  distribution: { bucket: LearnerGradeBucket; count: number }[];
  /** Why a figure is missing, shown next to the «—». */
  notes: string[];
};

export type TrainingCenterTeacherRow = {
  teacherUserId: string;
  teacherLabel: string;
  classes: {
    classroomId: string;
    name: string;
    levelLabel: string | null;
    deliveryMode: ClassDeliveryMode | null;
    studentCount: number;
  }[];
  studentCount: number;
  ratedStudentCount: number;
  averageScore: number | null;
  averageGrade: LearnerGradeBucket;
  completionRate: number | null;
  distribution: { bucket: LearnerGradeBucket; count: number }[];
};

export type TrainingCenterTotals = {
  classroomCount: number;
  teacherCount: number;
  studentCount: number;
  linkedStudentCount: number;
  ratedStudentCount: number;
  averageScore: number | null;
  averageGrade: LearnerGradeBucket;
  completionRate: number | null;
  /** Share of linked students active in the window, 0–100. Null when unknown. */
  activeShare: number | null;
  activeStudentCount: number | null;
};

export type TrainingCenterOverview = {
  organizations: TrainingCenterOrganizationOption[];
  /** The organization currently filtered to, or null for the whole centre. */
  selectedOrganizationId: string | null;
  selectedOrganizationName: string | null;
  /** True when ?org= named an organization that does not exist. */
  unknownOrganization: boolean;
  /** Classes with no organization_id at all, within the current filter. */
  unassignedClassroomCount: number;
  classes: TrainingCenterClassRow[];
  teachers: TrainingCenterTeacherRow[];
  totals: TrainingCenterTotals;
  activityWindowDays: number;
  /** True when study minutes could not be read at all. */
  studyMinutesUnavailable: boolean;
  warnings: string[];
};

/** PostgREST caps a single response, so wide reads page through. */
const PAGE_SIZE = 1000;
const MAX_PAGES = 20;
const ACTIVITY_WINDOW_DAYS = 14;

const DELIVERY_MODES: ClassDeliveryMode[] = ["in_person", "online", "hybrid"];

type SupabaseServerClient = NonNullable<
  Awaited<ReturnType<typeof createServerSupabaseClient>>
>;

type Row = Record<string, unknown>;

function isMissingColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("column") &&
    (lower.includes("does not exist") || lower.includes("could not find"))
  );
}

function isMissingTableError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    (lower.includes("relation") || lower.includes("table")) &&
    (lower.includes("does not exist") || lower.includes("could not find"))
  );
}

function text(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rate(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 100);
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

/** Read every row of a table's selected columns, a page at a time. */
async function readAll(
  client: SupabaseServerClient,
  table: string,
  columns: string,
  warnings: string[],
  missingTableWarning?: string
): Promise<Row[]> {
  const rows: Row[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE;
    const { data, error } = await client
      .from(table)
      .select(columns)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      warnings.push(
        missingTableWarning && isMissingTableError(error.message)
          ? missingTableWarning
          : `${table} уншиж чадсангүй: ${error.message}`
      );
      return rows;
    }
    const batch = (data ?? []) as unknown as Row[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }

  return rows;
}

const CLASSROOM_COLUMNS =
  "id, teacher_user_id, name, level, description, status, organization_id, delivery_mode, schedule_note, course_id";
/** Fallback for databases where 054_classroom_delivery_mode.sql has not run. */
const CLASSROOM_COLUMNS_CORE =
  "id, teacher_user_id, name, level, description, status, organization_id";

/**
 * Classes, tolerating a database where migration 054 has not run yet: the
 * delivery-mode columns are selected first and dropped on a missing-column
 * error rather than failing the whole page.
 */
async function readClassrooms(
  client: SupabaseServerClient,
  warnings: string[]
): Promise<{ rows: Row[]; deliveryColumnsMissing: boolean }> {
  const probe = await client.from("classrooms").select(CLASSROOM_COLUMNS).limit(1);

  if (probe.error && isMissingColumnError(probe.error.message)) {
    warnings.push(
      "Хичээллэх хэлбэр (танхим/онлайн) хадгалагдаагүй байна — 054_classroom_delivery_mode.sql миграцыг ажиллуулна уу."
    );
    return {
      rows: await readAll(client, "classrooms", CLASSROOM_COLUMNS_CORE, warnings),
      deliveryColumnsMissing: true,
    };
  }

  if (probe.error) {
    warnings.push(`classrooms уншиж чадсангүй: ${probe.error.message}`);
    return { rows: [], deliveryColumnsMissing: false };
  }

  return {
    rows: await readAll(client, "classrooms", CLASSROOM_COLUMNS, warnings),
    deliveryColumnsMissing: false,
  };
}

function normalizeDeliveryMode(value: unknown): ClassDeliveryMode | null {
  const raw = text(value)?.toLowerCase();
  if (!raw) return null;
  return DELIVERY_MODES.find((mode) => mode === raw) ?? null;
}

const HSK_COURSE_LABELS: Record<string, string> = {
  hsk1: "HSK 1",
  hsk2: "HSK 2",
  hsk3: "HSK 3",
  hsk4: "HSK 4",
  hsk5: "HSK 5",
  hsk6: "HSK 6",
};

function levelLabelFor(courseId: string | null, level: string | null): string | null {
  if (courseId) {
    const known = HSK_COURSE_LABELS[courseId.toLowerCase()];
    if (known) return known;
    return courseId;
  }
  return level;
}

/** Latest of two ISO timestamps, either of which may be missing. */
function latest(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

/** One row of a class roster; `userId` is null while an invitee has not joined. */
type RosterEntry = {
  rowId: string;
  userId: string | null;
};

export async function getTrainingCenterOverview(
  options: { organizationId?: string | null } = {}
): Promise<TrainingCenterOverview> {
  const warnings: string[] = [];
  const requestedOrganizationId = text(options.organizationId);

  const empty: TrainingCenterOverview = {
    organizations: [],
    selectedOrganizationId: null,
    selectedOrganizationName: null,
    unknownOrganization: false,
    unassignedClassroomCount: 0,
    classes: [],
    teachers: [],
    totals: {
      classroomCount: 0,
      teacherCount: 0,
      studentCount: 0,
      linkedStudentCount: 0,
      ratedStudentCount: 0,
      averageScore: null,
      averageGrade: "unrated",
      completionRate: null,
      activeShare: null,
      activeStudentCount: null,
    },
    activityWindowDays: ACTIVITY_WINDOW_DAYS,
    studyMinutesUnavailable: true,
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

  const windowStart = new Date();
  windowStart.setUTCDate(windowStart.getUTCDate() - (ACTIVITY_WINDOW_DAYS - 1));
  const windowStartDay = windowStart.toISOString().slice(0, 10);

  const [
    organizationRows,
    classroomResult,
    memberRows,
    teacherProfileRows,
    studentRows,
    assignmentRows,
    resultRows,
  ] = await Promise.all([
    readAll(
      client,
      "organizations",
      "id, name, organization_type, status",
      warnings
    ),
    readClassrooms(client, warnings),
    readAll(
      client,
      "organization_members",
      "organization_id, user_id, email, display_name, role, status",
      warnings
    ),
    readAll(
      client,
      "teacher_profiles",
      "user_id, display_name, organization, role",
      warnings
    ),
    readAll(
      client,
      "classroom_students",
      "id, classroom_id, student_user_id, display_name, email, status",
      warnings
    ),
    readAll(
      client,
      "assignments",
      "id, classroom_id, lesson_id, title, due_date, status",
      warnings
    ),
    readAll(
      client,
      "assignment_results",
      "assignment_id, student_user_id, status, quiz_score, quiz_total, quiz_percentage, completed_at",
      warnings
    ),
  ]);

  const classroomRows = classroomResult.rows;

  // Learner-side signals. These are whole-account, not per-class, so they are
  // read once and joined in memory.
  const [quizRows, lessonRows, wordRows] = await Promise.all([
    readAll(client, "user_quiz_attempts", "user_id, percentage, created_at", warnings),
    readAll(
      client,
      "user_lesson_progress",
      "user_id, status, progress_percent, completed_at",
      warnings
    ),
    readAll(
      client,
      "user_vocabulary_progress",
      "user_id, status, learned_at",
      warnings
    ),
  ]);

  // Study minutes are optional: the table only exists once migration 050 has run.
  let activityRows: Row[] = [];
  let studyMinutesUnavailable = false;
  {
    const { data, error } = await client
      .from("user_activity_sessions")
      .select("user_id, surface, seconds, day")
      .gte("day", windowStartDay)
      .limit(20000);
    if (error) {
      studyMinutesUnavailable = true;
      warnings.push(
        "Суралцсан хугацаа унших боломжгүй байна — 050_learner_activity.sql миграцыг шалгана уу. Хугацааны багана «—» харагдана."
      );
    } else {
      activityRows = (data ?? []) as unknown as Row[];
    }
  }

  // ---------------------------------------------------------------- lookups

  const organizationNames = new Map<string, string>();
  for (const row of organizationRows) {
    const id = text(row.id);
    if (!id) continue;
    organizationNames.set(id, text(row.name) ?? `Байгууллага ${id.slice(0, 8)}`);
  }

  const selectedOrganizationId =
    requestedOrganizationId && organizationNames.has(requestedOrganizationId)
      ? requestedOrganizationId
      : null;
  const unknownOrganization = Boolean(
    requestedOrganizationId && !selectedOrganizationId
  );

  const memberNameByUser = new Map<string, string>();
  const memberNameByOrgUser = new Map<string, string>();
  for (const row of memberRows) {
    const userId = text(row.user_id);
    if (!userId) continue;
    const label = text(row.display_name) ?? text(row.email);
    if (!label) continue;
    if (!memberNameByUser.has(userId)) memberNameByUser.set(userId, label);
    const organizationId = text(row.organization_id);
    if (organizationId) {
      memberNameByOrgUser.set(`${organizationId}:${userId}`, label);
    }
  }

  const profileNameByUser = new Map<string, string>();
  for (const row of teacherProfileRows) {
    const userId = text(row.user_id);
    const label = text(row.display_name);
    if (userId && label && !profileNameByUser.has(userId)) {
      profileNameByUser.set(userId, label);
    }
  }

  function teacherLabelFor(
    teacherUserId: string | null,
    organizationId: string | null
  ): string {
    if (!teacherUserId) return "Багш оноогоогүй";
    const scoped = organizationId
      ? memberNameByOrgUser.get(`${organizationId}:${teacherUserId}`)
      : null;
    return (
      scoped ??
      memberNameByUser.get(teacherUserId) ??
      profileNameByUser.get(teacherUserId) ??
      `Багш ${teacherUserId.slice(0, 8)}`
    );
  }

  // --------------------------------------------------------------- classes

  const allClassrooms = classroomRows
    .map((row) => {
      const id = text(row.id);
      if (!id) return null;
      const organizationId = text(row.organization_id);
      const courseId = text(row.course_id);
      const level = text(row.level);
      return {
        id,
        name: text(row.name) ?? `Бүлэг ${id.slice(0, 8)}`,
        level,
        courseId,
        levelLabel: levelLabelFor(courseId, level),
        deliveryMode: normalizeDeliveryMode(row.delivery_mode),
        scheduleNote: text(row.schedule_note),
        status: text(row.status),
        organizationId,
        organizationName: organizationId
          ? (organizationNames.get(organizationId) ?? null)
          : null,
        teacherUserId: text(row.teacher_user_id),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);

  const classroomCountByOrg = new Map<string, number>();
  for (const classroom of allClassrooms) {
    if (!classroom.organizationId) continue;
    classroomCountByOrg.set(
      classroom.organizationId,
      (classroomCountByOrg.get(classroom.organizationId) ?? 0) + 1
    );
  }

  const organizations: TrainingCenterOrganizationOption[] = organizationRows
    .map((row) => {
      const id = text(row.id);
      if (!id) return null;
      return {
        id,
        name: organizationNames.get(id) ?? id,
        organizationType: text(row.organization_type),
        status: text(row.status),
        classroomCount: classroomCountByOrg.get(id) ?? 0,
      };
    })
    .filter((row): row is TrainingCenterOrganizationOption => row != null)
    .sort((a, b) => a.name.localeCompare(b.name, "mn"));

  const classrooms = selectedOrganizationId
    ? allClassrooms.filter(
        (classroom) => classroom.organizationId === selectedOrganizationId
      )
    : allClassrooms;

  const classroomIds = new Set(classrooms.map((classroom) => classroom.id));

  // ------------------------------------------------------- roster & results

  /** classroomId → roster rows */
  const rosterByClass = new Map<string, RosterEntry[]>();
  /** Every user id that sits in one of the classes in scope. */
  const linkedUserIds = new Set<string>();

  for (const row of studentRows) {
    const classroomId = text(row.classroom_id);
    const rowId = text(row.id);
    if (!classroomId || !rowId || !classroomIds.has(classroomId)) continue;
    if (text(row.status) === "removed") continue;

    const userId = text(row.student_user_id);
    if (userId) linkedUserIds.add(userId);

    const roster = rosterByClass.get(classroomId) ?? [];
    roster.push({ rowId, userId });
    rosterByClass.set(classroomId, roster);
  }

  const assignmentCountByClass = new Map<string, number>();
  /** assignmentId → classroomId, for the classes in scope only. */
  const assignmentClass = new Map<string, string>();
  for (const row of assignmentRows) {
    const classroomId = text(row.classroom_id);
    const assignmentId = text(row.id);
    if (!classroomId || !assignmentId || !classroomIds.has(classroomId)) continue;
    assignmentClass.set(assignmentId, classroomId);
    assignmentCountByClass.set(
      classroomId,
      (assignmentCountByClass.get(classroomId) ?? 0) + 1
    );
  }

  /** userId → per-user signals shared across every class they sit in. */
  type UserSignals = {
    completedByClass: Map<string, number>;
    quizPercent: number | null;
    quizAt: string | null;
    learnedWords: number;
    activeSeconds: number;
    lastActiveAt: string | null;
  };

  const userSignals = new Map<string, UserSignals>();
  const ensureUser = (userId: string): UserSignals => {
    const existing = userSignals.get(userId);
    if (existing) return existing;
    const created: UserSignals = {
      completedByClass: new Map(),
      quizPercent: null,
      quizAt: null,
      learnedWords: 0,
      activeSeconds: 0,
      lastActiveAt: null,
    };
    userSignals.set(userId, created);
    return created;
  };

  const noteQuiz = (
    signals: UserSignals,
    percent: number | null,
    at: string | null
  ) => {
    if (percent == null) return;
    if (signals.quizAt && at && at <= signals.quizAt) return;
    if (signals.quizAt && !at) return;
    signals.quizPercent = percent;
    signals.quizAt = at ?? signals.quizAt;
  };

  for (const row of resultRows) {
    const assignmentId = text(row.assignment_id);
    const userId = text(row.student_user_id);
    if (!assignmentId || !userId) continue;
    const classroomId = assignmentClass.get(assignmentId);
    if (!classroomId) continue;

    const signals = ensureUser(userId);
    const completedAt = text(row.completed_at);

    if (text(row.status) === "completed") {
      signals.completedByClass.set(
        classroomId,
        (signals.completedByClass.get(classroomId) ?? 0) + 1
      );
      signals.lastActiveAt = latest(signals.lastActiveAt, completedAt);
    }

    const percentage =
      row.quiz_percentage != null
        ? toNumber(row.quiz_percentage)
        : toNumber(row.quiz_total) > 0
          ? Math.round((toNumber(row.quiz_score) / toNumber(row.quiz_total)) * 100)
          : null;
    noteQuiz(signals, percentage, completedAt);
  }

  for (const row of quizRows) {
    const userId = text(row.user_id);
    if (!userId || !linkedUserIds.has(userId)) continue;
    const signals = ensureUser(userId);
    const createdAt = text(row.created_at);
    noteQuiz(
      signals,
      row.percentage == null ? null : toNumber(row.percentage),
      createdAt
    );
    signals.lastActiveAt = latest(signals.lastActiveAt, createdAt);
  }

  for (const row of lessonRows) {
    const userId = text(row.user_id);
    if (!userId || !linkedUserIds.has(userId)) continue;
    const signals = ensureUser(userId);
    if (text(row.status) === "completed") {
      signals.lastActiveAt = latest(signals.lastActiveAt, text(row.completed_at));
    }
  }

  for (const row of wordRows) {
    const userId = text(row.user_id);
    if (!userId || !linkedUserIds.has(userId)) continue;
    const signals = ensureUser(userId);
    if (text(row.status) === "learned") {
      signals.learnedWords += 1;
      signals.lastActiveAt = latest(signals.lastActiveAt, text(row.learned_at));
    }
  }

  for (const row of activityRows) {
    const userId = text(row.user_id);
    if (!userId || !linkedUserIds.has(userId)) continue;
    const signals = ensureUser(userId);
    signals.activeSeconds += toNumber(row.seconds);
    const day = text(row.day);
    if (day) signals.lastActiveAt = latest(signals.lastActiveAt, day);
  }

  const wordsUnavailable = warnings.some((warning) =>
    warning.startsWith("user_vocabulary_progress")
  );

  // ------------------------------------------------------------- aggregate

  const centreScores: number[] = [];
  let centreCompleted = 0;
  let centrePossible = 0;
  /** Distinct people, so a student in two classes is counted once. */
  const centreRosterKeys = new Set<string>();
  const centreLinkedUsers = new Set<string>();
  const centreActiveUsers = new Set<string>();

  type TeacherAccumulator = {
    teacherUserId: string;
    teacherLabel: string;
    classes: TrainingCenterTeacherRow["classes"];
    studentCount: number;
    scores: number[];
    buckets: LearnerGradeBucket[];
    completed: number;
    possible: number;
  };
  const teacherAcc = new Map<string, TeacherAccumulator>();

  const classes: TrainingCenterClassRow[] = classrooms.map((classroom) => {
    const rosterRows = rosterByClass.get(classroom.id) ?? [];
    const assignmentCount = assignmentCountByClass.get(classroom.id) ?? 0;
    const linked = rosterRows.filter((entry) => entry.userId != null);

    const notes: string[] = [];
    const scores: number[] = [];
    const buckets: LearnerGradeBucket[] = [];
    let completed = 0;
    let activeSeconds = 0;
    let inactive = 0;

    for (const entry of rosterRows) {
      centreRosterKeys.add(entry.userId ? `u:${entry.userId}` : `r:${entry.rowId}`);
    }

    for (const entry of linked) {
      const userId = entry.userId as string;
      centreLinkedUsers.add(userId);
      const signals = userSignals.get(userId);
      const studentCompleted =
        signals?.completedByClass.get(classroom.id) ?? 0;
      completed += studentCompleted;
      activeSeconds += signals?.activeSeconds ?? 0;

      const lastActiveAt = signals?.lastActiveAt ?? null;
      if (!lastActiveAt || lastActiveAt.slice(0, 10) < windowStartDay) {
        inactive += 1;
      } else {
        centreActiveUsers.add(userId);
      }

      const score = computeClassLearnerScore({
        quizPercent: signals?.quizPercent ?? null,
        completionRate: rate(studentCompleted, assignmentCount) ?? 0,
        assignmentsAssigned: assignmentCount,
        assignmentsCompleted: studentCompleted,
        learnedWords: wordsUnavailable ? null : (signals?.learnedWords ?? 0),
      });

      buckets.push(score.grade);
      if (score.total != null) scores.push(score.total);
    }

    const possible = linked.length * assignmentCount;
    const averageScore = mean(scores);
    const completionRate = rate(completed, possible);
    const averageStudyMinutes =
      studyMinutesUnavailable || linked.length === 0
        ? null
        : Math.round(activeSeconds / 60 / linked.length);

    if (rosterRows.length === 0) {
      notes.push("Сурагч бүртгэгдээгүй.");
    } else if (linked.length === 0) {
      notes.push("Сурагчид урилгаа хүлээж аваагүй тул өгөгдөл алга.");
    }
    if (assignmentCount === 0) {
      notes.push("Даалгавар оноогоогүй тул гүйцэтгэл тооцох боломжгүй.");
    }

    centreScores.push(...scores);
    centreCompleted += completed;
    centrePossible += possible;

    const teacherLabel = teacherLabelFor(
      classroom.teacherUserId,
      classroom.organizationId
    );

    if (classroom.teacherUserId) {
      const acc =
        teacherAcc.get(classroom.teacherUserId) ??
        ({
          teacherUserId: classroom.teacherUserId,
          teacherLabel,
          classes: [],
          studentCount: 0,
          scores: [],
          buckets: [],
          completed: 0,
          possible: 0,
        } satisfies TeacherAccumulator);
      acc.classes.push({
        classroomId: classroom.id,
        name: classroom.name,
        levelLabel: classroom.levelLabel,
        deliveryMode: classroom.deliveryMode,
        studentCount: rosterRows.length,
      });
      acc.studentCount += rosterRows.length;
      acc.scores.push(...scores);
      acc.buckets.push(...buckets);
      acc.completed += completed;
      acc.possible += possible;
      teacherAcc.set(classroom.teacherUserId, acc);
    }

    return {
      classroomId: classroom.id,
      name: classroom.name,
      level: classroom.level,
      courseId: classroom.courseId,
      levelLabel: classroom.levelLabel,
      deliveryMode: classroom.deliveryMode,
      scheduleNote: classroom.scheduleNote,
      status: classroom.status,
      organizationId: classroom.organizationId,
      organizationName: classroom.organizationName,
      teacherUserId: classroom.teacherUserId,
      teacherLabel,
      studentCount: rosterRows.length,
      linkedStudentCount: linked.length,
      assignmentCount,
      averageScore,
      averageGrade: averageScore == null ? "unrated" : gradeFromScore(averageScore),
      ratedStudentCount: scores.length,
      completionRate,
      averageStudyMinutes,
      inactiveStudentCount: linked.length === 0 ? null : inactive,
      distribution: summarizeGrades(buckets),
      notes,
    };
  });

  classes.sort((a, b) => {
    const left = a.averageScore ?? -1;
    const right = b.averageScore ?? -1;
    if (left !== right) return right - left;
    return a.name.localeCompare(b.name, "mn");
  });

  const teachers: TrainingCenterTeacherRow[] = [...teacherAcc.values()]
    .map((acc): TrainingCenterTeacherRow => {
      const averageScore = mean(acc.scores);
      return {
        teacherUserId: acc.teacherUserId,
        teacherLabel: acc.teacherLabel,
        classes: acc.classes.sort((a, b) =>
          (a.levelLabel ?? "").localeCompare(b.levelLabel ?? "", "mn")
        ),
        studentCount: acc.studentCount,
        ratedStudentCount: acc.scores.length,
        averageScore,
        averageGrade:
          averageScore == null ? "unrated" : gradeFromScore(averageScore),
        completionRate: rate(acc.completed, acc.possible),
        distribution: summarizeGrades(acc.buckets),
      };
    })
    .sort((a, b) => {
      const left = a.averageScore ?? -1;
      const right = b.averageScore ?? -1;
      if (left !== right) return right - left;
      return a.teacherLabel.localeCompare(b.teacherLabel, "mn");
    });

  const centreAverage = mean(centreScores);

  return {
    organizations,
    selectedOrganizationId,
    selectedOrganizationName: selectedOrganizationId
      ? (organizationNames.get(selectedOrganizationId) ?? null)
      : null,
    unknownOrganization,
    unassignedClassroomCount: classrooms.filter(
      (classroom) => !classroom.organizationId
    ).length,
    classes,
    teachers,
    totals: {
      classroomCount: classes.length,
      teacherCount: teachers.length,
      studentCount: centreRosterKeys.size,
      linkedStudentCount: centreLinkedUsers.size,
      ratedStudentCount: centreScores.length,
      averageScore: centreAverage,
      averageGrade:
        centreAverage == null ? "unrated" : gradeFromScore(centreAverage),
      completionRate: rate(centreCompleted, centrePossible),
      activeShare: rate(centreActiveUsers.size, centreLinkedUsers.size),
      activeStudentCount:
        centreLinkedUsers.size === 0 ? null : centreActiveUsers.size,
    },
    activityWindowDays: ACTIVITY_WINDOW_DAYS,
    studyMinutesUnavailable,
    warnings,
  };
}
