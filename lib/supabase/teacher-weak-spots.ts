/**
 * Сурагч тус бүрийн сул тал — багшийн талаас.
 *
 * Бүх тоо БОДИТ мөрөөс гарна: question_attempts (асуулт бүрийн оролдлого) ба
 * user_quiz_attempts (дасгалын оноо). Мөр байхгүй бол тэг биш, «мэдээлэл алга»
 * гэж буцаана — багш байхгүй сул талыг хараад буруу дүгнэхээс сэргийлнэ.
 *
 * Уншихын тулд Supabase дээр 055_teacher_reads_student_attempts.sql засвар
 * ажилласан байх ёстой. Эсрэг тохиолдолд RLS нь мөрүүдийг нууна.
 */

import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import {
  createAssignment,
  getClassroomStudents,
} from "@/lib/supabase/classrooms";
import type { Assignment, ClassroomStudent } from "@/lib/classroom/types";
import type {
  AnalyticsResult,
  ClassroomWeakSpots,
  StudentWeakLesson,
  StudentWeakSpots,
  WeakSpotSource,
  WeakStageRow,
} from "@/lib/teacher/analytics-types";
import { emptyResult } from "@/lib/teacher/report-builder";

/** Нэг ангийн хэмжээнд татах оролдлогын дээд хязгаар. */
const ATTEMPT_FETCH_LIMIT = 4000;
const QUIZ_FETCH_LIMIT = 2000;
/** Нэг сурагчид харуулах сул хичээлийн дээд тоо. */
const MAX_WEAK_LESSONS_PER_STUDENT = 6;

type AttemptRow = {
  user_id: string;
  lesson_id: string;
  stage: string;
  question_id: string;
  is_correct: boolean;
  created_at: string;
};

type QuizRow = {
  user_id: string;
  lesson_id: string;
  score: number | null;
  total: number | null;
  percentage: number | null;
  created_at: string;
};

type LessonMeta = { title: string | null; courseId: string | null };

function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function studentLabel(student: ClassroomStudent): string {
  return student.displayName ?? student.email ?? "Сурагч";
}

/** Хичээлийн гарчгийг lessons хүснэгтээс татна (олдсон нь л бөглөгдөнө). */
async function fetchLessonMeta(
  lessonIds: string[]
): Promise<Map<string, LessonMeta>> {
  const meta = new Map<string, LessonMeta>();
  if (!supabase || lessonIds.length === 0) return meta;

  const chunkSize = 100;
  for (let i = 0; i < lessonIds.length; i += chunkSize) {
    const chunk = lessonIds.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("lessons")
      .select("id, title, course_id")
      .in("id", chunk);
    if (error) continue;
    for (const row of data ?? []) {
      meta.set(String(row.id), {
        title: row.title ? String(row.title) : null,
        courseId: row.course_id ? String(row.course_id) : null,
      });
    }
  }

  return meta;
}

type LessonBucket = {
  attempts: number;
  wrong: number;
  wrongQuestionIds: Set<string>;
  stages: Map<string, { attempts: number; wrong: number }>;
  lastAttemptAt: string | null;
  quizAttempts: number;
  latestQuizAt: string | null;
  latestQuizPercentage: number | null;
  latestQuizScore: number | null;
  latestQuizTotal: number | null;
};

function emptyBucket(): LessonBucket {
  return {
    attempts: 0,
    wrong: 0,
    wrongQuestionIds: new Set<string>(),
    stages: new Map(),
    lastAttemptAt: null,
    quizAttempts: 0,
    latestQuizAt: null,
    latestQuizPercentage: null,
    latestQuizScore: null,
    latestQuizTotal: null,
  };
}

/** userId → lessonId → тухайн хичээлийн хураангуй. */
type BucketsByStudent = Map<string, Map<string, LessonBucket>>;

function getBucket(
  buckets: BucketsByStudent,
  userId: string,
  lessonId: string
): LessonBucket {
  let byLesson = buckets.get(userId);
  if (!byLesson) {
    byLesson = new Map<string, LessonBucket>();
    buckets.set(userId, byLesson);
  }
  let bucket = byLesson.get(lessonId);
  if (!bucket) {
    bucket = emptyBucket();
    byLesson.set(lessonId, bucket);
  }
  return bucket;
}

function toWeakLesson(
  lessonId: string,
  bucket: LessonBucket,
  meta: LessonMeta | undefined
): StudentWeakLesson | null {
  const hasAttemptEvidence = bucket.wrong > 0;
  const quizMissed =
    bucket.latestQuizScore != null && bucket.latestQuizTotal != null
      ? bucket.latestQuizTotal - bucket.latestQuizScore
      : 0;
  const hasQuizEvidence = bucket.quizAttempts > 0 && quizMissed > 0;

  // Алдаагүй хичээл сул тал биш.
  if (!hasAttemptEvidence && !hasQuizEvidence) return null;

  let source: WeakSpotSource = "question_attempts";
  if (hasAttemptEvidence && bucket.quizAttempts > 0) source = "both";
  else if (!hasAttemptEvidence) source = "quiz_attempts";

  const stages: WeakStageRow[] = [...bucket.stages.entries()]
    .map(([stage, s]) => ({
      stage,
      attemptCount: s.attempts,
      wrongCount: s.wrong,
      accuracyPercent: percent(s.attempts - s.wrong, s.attempts),
    }))
    .filter((s) => s.wrongCount > 0)
    .sort((a, b) => b.wrongCount - a.wrongCount || a.accuracyPercent - b.accuracyPercent);

  return {
    lessonId,
    lessonTitle: meta?.title ?? null,
    courseId: meta?.courseId ?? null,
    attemptCount: bucket.attempts,
    wrongCount: bucket.wrong,
    missedQuestionCount: hasAttemptEvidence
      ? bucket.wrongQuestionIds.size
      : quizMissed,
    accuracyPercent:
      bucket.attempts > 0
        ? percent(bucket.attempts - bucket.wrong, bucket.attempts)
        : null,
    stages,
    quizAttemptCount: bucket.quizAttempts,
    latestQuizPercentage: bucket.latestQuizPercentage,
    latestQuizScore: bucket.latestQuizScore,
    latestQuizTotal: bucket.latestQuizTotal,
    lastAttemptAt: bucket.lastAttemptAt ?? bucket.latestQuizAt,
    source,
  };
}

/** Хамгийн олон алдсан нь эхэндээ; тэнцвэл зөв хариултын хувь багатай нь. */
function sortWeakLessons(lessons: StudentWeakLesson[]): StudentWeakLesson[] {
  return [...lessons].sort((a, b) => {
    if (b.missedQuestionCount !== a.missedQuestionCount) {
      return b.missedQuestionCount - a.missedQuestionCount;
    }
    if (b.wrongCount !== a.wrongCount) return b.wrongCount - a.wrongCount;
    return (a.accuracyPercent ?? 100) - (b.accuracyPercent ?? 100);
  });
}

export async function getClassroomWeakSpots(
  classroomId: string
): Promise<AnalyticsResult<ClassroomWeakSpots>> {
  if (!hasSupabaseConfig || !supabase) {
    return emptyResult("Supabase тохиргоо байхгүй.");
  }

  const warnings: string[] = [];
  const { data: students, error: studentsError } =
    await getClassroomStudents(classroomId);
  if (studentsError) return emptyResult(studentsError);

  const studentList = students ?? [];
  const linkedIds = studentList
    .map((s) => s.studentUserId)
    .filter((id): id is string => Boolean(id));

  if (linkedIds.length === 0) {
    return {
      data: {
        classroomId,
        students: studentList.map((s) => ({
          studentRowId: s.id,
          displayName: studentLabel(s),
          email: s.email,
          studentUserId: null,
          hasData: false,
          noDataReason:
            "Апп дээрх бүртгэл нь ангийн жагсаалттай холбогдоогүй тул алдааны мэдээлэл алга.",
          totalAttempts: 0,
          totalWrong: 0,
          overallAccuracyPercent: null,
          weakLessons: [],
        })),
        attemptsBlocked: false,
      },
      error: null,
      warnings,
    };
  }

  const { data: attemptData, error: attemptError } = await supabase
    .from("question_attempts")
    .select("user_id, lesson_id, stage, question_id, is_correct, created_at")
    .in("user_id", linkedIds)
    .order("created_at", { ascending: false })
    .limit(ATTEMPT_FETCH_LIMIT);

  const { data: quizData, error: quizError } = await supabase
    .from("user_quiz_attempts")
    .select("user_id, lesson_id, score, total, percentage, created_at")
    .in("user_id", linkedIds)
    .order("created_at", { ascending: false })
    .limit(QUIZ_FETCH_LIMIT);

  if (attemptError) {
    warnings.push(
      "Асуулт бүрийн оролдлогыг уншиж чадсангүй. Supabase дээр 055_teacher_reads_student_attempts.sql засвар ажиллуулсан эсэхийг шалгана уу."
    );
  }
  if (quizError) {
    warnings.push(
      "Дасгалын оноог уншиж чадсангүй. Supabase дээр 055_teacher_reads_student_attempts.sql засвар ажиллуулсан эсэхийг шалгана уу."
    );
  }

  const attemptRows = (attemptData ?? []) as AttemptRow[];
  const quizRows = (quizData ?? []) as QuizRow[];
  const attemptsBlocked = Boolean(attemptError) && Boolean(quizError);

  if (attemptRows.length >= ATTEMPT_FETCH_LIMIT) {
    warnings.push(
      `Зөвхөн хамгийн сүүлийн ${ATTEMPT_FETCH_LIMIT} оролдлогыг тооцлоо — түүнээс өмнөх алдаа энд ороогүй.`
    );
  }

  const buckets: BucketsByStudent = new Map();
  const lessonIds = new Set<string>();
  const perStudent = new Map<
    string,
    { attempts: number; wrong: number }
  >();

  for (const row of attemptRows) {
    if (!row.user_id || !row.lesson_id) continue;
    lessonIds.add(row.lesson_id);

    const bucket = getBucket(buckets, row.user_id, row.lesson_id);
    bucket.attempts += 1;
    if (!row.is_correct) {
      bucket.wrong += 1;
      bucket.wrongQuestionIds.add(row.question_id);
    }
    const stage = bucket.stages.get(row.stage) ?? { attempts: 0, wrong: 0 };
    stage.attempts += 1;
    if (!row.is_correct) stage.wrong += 1;
    bucket.stages.set(row.stage, stage);
    if (!bucket.lastAttemptAt || row.created_at > bucket.lastAttemptAt) {
      bucket.lastAttemptAt = row.created_at;
    }

    const totals = perStudent.get(row.user_id) ?? { attempts: 0, wrong: 0 };
    totals.attempts += 1;
    if (!row.is_correct) totals.wrong += 1;
    perStudent.set(row.user_id, totals);
  }

  for (const row of quizRows) {
    if (!row.user_id || !row.lesson_id) continue;
    lessonIds.add(row.lesson_id);

    const bucket = getBucket(buckets, row.user_id, row.lesson_id);
    bucket.quizAttempts += 1;
    if (!bucket.latestQuizAt || row.created_at > bucket.latestQuizAt) {
      bucket.latestQuizAt = row.created_at;
      bucket.latestQuizPercentage =
        row.percentage != null ? Number(row.percentage) : null;
      bucket.latestQuizScore = row.score != null ? Number(row.score) : null;
      bucket.latestQuizTotal = row.total != null ? Number(row.total) : null;
    }
  }

  const lessonMeta = await fetchLessonMeta([...lessonIds]);

  const rows: StudentWeakSpots[] = studentList.map((student) => {
    const userId = student.studentUserId;
    if (!userId) {
      return {
        studentRowId: student.id,
        displayName: studentLabel(student),
        email: student.email,
        studentUserId: null,
        hasData: false,
        noDataReason:
          "Апп дээрх бүртгэл нь ангийн жагсаалттай холбогдоогүй тул алдааны мэдээлэл алга.",
        totalAttempts: 0,
        totalWrong: 0,
        overallAccuracyPercent: null,
        weakLessons: [],
      };
    }

    const weakLessons: StudentWeakLesson[] = [];
    let quizRowsForStudent = 0;
    for (const [lessonId, bucket] of buckets.get(userId) ?? []) {
      quizRowsForStudent += bucket.quizAttempts;
      const weak = toWeakLesson(lessonId, bucket, lessonMeta.get(lessonId));
      if (weak) weakLessons.push(weak);
    }

    const totals = perStudent.get(userId) ?? { attempts: 0, wrong: 0 };
    const hasData = totals.attempts > 0 || quizRowsForStudent > 0;

    let noDataReason: string | null = null;
    if (!hasData) {
      noDataReason = attemptsBlocked
        ? "Оролдлогын мэдээллийг унших эрх алга — 055 засварыг ажиллуулаагүй байж болзошгүй."
        : "Бүртгэгдсэн оролдлого алга.";
    }

    return {
      studentRowId: student.id,
      displayName: studentLabel(student),
      email: student.email,
      studentUserId: userId,
      hasData,
      noDataReason,
      totalAttempts: totals.attempts,
      totalWrong: totals.wrong,
      overallAccuracyPercent:
        totals.attempts > 0
          ? percent(totals.attempts - totals.wrong, totals.attempts)
          : null,
      weakLessons: sortWeakLessons(weakLessons).slice(
        0,
        MAX_WEAK_LESSONS_PER_STUDENT
      ),
    };
  });

  return {
    data: { classroomId, students: rows, attemptsBlocked },
    error: null,
    warnings,
  };
}

/** Хичээлийг багшид ойлгомжтой нэрээр бичнэ. */
export function weakLessonLabel(lesson: {
  lessonId: string;
  lessonTitle: string | null;
}): string {
  return lesson.lessonTitle
    ? `${lesson.lessonTitle} (${lesson.lessonId})`
    : `${lesson.lessonId} хичээл`;
}

/** Сул талын шалтгааныг нэг өгүүлбэрээр — багш ч, сурагч ч уншина. */
export function weakLessonReason(lesson: StudentWeakLesson): string {
  const parts: string[] = [];
  if (lesson.wrongCount > 0) {
    parts.push(
      `${lesson.missedQuestionCount} асуулт дээр алдсан (нийт ${lesson.wrongCount} буруу оролдлого)`
    );
  }
  if (lesson.accuracyPercent != null) {
    parts.push(`зөв хариултын хувь ${lesson.accuracyPercent}%`);
  }
  if (
    lesson.latestQuizPercentage != null &&
    lesson.latestQuizScore != null &&
    lesson.latestQuizTotal != null
  ) {
    parts.push(
      `сүүлийн дасгал ${lesson.latestQuizScore}/${lesson.latestQuizTotal} (${lesson.latestQuizPercentage}%)`
    );
  }
  return parts.join(", ");
}

export type AssignWeakLessonInput = {
  classroomId: string;
  studentUserId: string;
  studentName: string;
  lesson: StudentWeakLesson;
  dueDate?: string;
};

/**
 * Сул хичээлийг ТУХАЙН сурагчид онилж өгнө.
 *
 * Схемийн хязгаарлалт: assignments нь ангийн түвшний хүснэгт (нэг мөр = нэг
 * анги), сурагчийн талбар байхгүй. Тиймээс зорилтот сурагчийг
 * (1) даалгаврын instructions дотор нэрлэж, (2) зөвхөн түүнд assignment_results
 * мөр үүсгэж, (3) тэр мөрийн metadata дотор target_student_user_id-г бичнэ.
 */
export async function assignWeakLessonToStudent(
  input: AssignWeakLessonInput
): Promise<{ data: Assignment | null; error: string | null }> {
  const { lesson } = input;
  const label = weakLessonLabel(lesson);
  const reason = weakLessonReason(lesson);
  const title = `${input.studentName} — ${label} дахин давтах`;

  const instructionLines = [
    `Зорилтот сурагч: ${input.studentName}.`,
    reason ? `Шалтгаан: ${reason}.` : null,
    lesson.stages.length > 0
      ? `Хамгийн их алдсан хэсэг: ${lesson.stages
          .slice(0, 3)
          .map((s) => `${s.stage} — ${s.wrongCount} алдаа`)
          .join("; ")}.`
      : null,
    "Энэ даалгавар нь ангийн жагсаалтад харагдах ч зөвхөн дээрх сурагчид оноогдсон.",
  ].filter((line): line is string => Boolean(line));

  const { data, error } = await createAssignment({
    classroomId: input.classroomId,
    lessonId: lesson.lessonId,
    assignmentType: "review",
    title,
    instructions: instructionLines.join(" "),
    dueDate: input.dueDate,
    targetStudentUserIds: [input.studentUserId],
    resultMetadata: {
      target_student_user_id: input.studentUserId,
      assigned_reason: reason,
      weak_lesson_id: lesson.lessonId,
      missed_question_count: lesson.missedQuestionCount,
      accuracy_percent: lesson.accuracyPercent,
    },
  });

  return { data, error };
}
