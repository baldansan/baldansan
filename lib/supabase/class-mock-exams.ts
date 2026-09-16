/**
 * Ангийн загвар шалгалт — Supabase хандалт (browser client).
 *
 * Хүснэгтүүд:
 *   public.classroom_exams     — 059_class_mock_exams.sql
 *   public.mock_tests          — 029_mock_tests_system.sql (id нь TEXT)
 *   public.user_test_attempts  — 029_mock_tests_system.sql
 *   public.classroom_students  — 011_classroom_roles_assignments.sql
 */

import {
  resolvePassThreshold,
  scoreFromAttempt,
  summarizeExam,
  type ClassroomExam,
  type ClassroomExamStatus,
  type ClassroomExamSummary,
  type ClassroomExamStudentRow,
  type ExamAttemptRow,
  type ExamTestOption,
} from "@/lib/classroom/exam-types";
import type { HskAttemptScoreMetadata } from "@/lib/mock-test/hsk-scoring";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { getClassroomStudents } from "@/lib/supabase/classrooms";
import { supabase } from "@/lib/supabase/client";

export type ExamResult<T> = { data: T | null; error: string | null };

export type ExamListResult<T> = {
  data: T | null;
  error: string | null;
  warnings: string[];
};

const NOT_CONFIGURED = "Supabase тохируулагдаагүй.";

function notConfigured<T>(): ExamResult<T> {
  return { data: null, error: NOT_CONFIGURED };
}

function toError(error: { message: string } | null): string | null {
  return error?.message ?? null;
}

function mapExam(row: Record<string, unknown>): ClassroomExam {
  const test = row.mock_tests as Record<string, unknown> | null;
  return {
    id: String(row.id),
    classroomId: String(row.classroom_id),
    testId: String(row.test_id),
    title: row.title ? String(row.title) : null,
    scheduledFor: row.scheduled_for ? String(row.scheduled_for) : null,
    dueDate: row.due_date ? String(row.due_date) : null,
    status: String(row.status ?? "scheduled") as ClassroomExamStatus,
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    testTitle: test?.title != null ? String(test.title) : null,
    hskLevel: test?.hsk_level != null ? Number(test.hsk_level) : null,
  };
}

const EXAM_SELECT = "*, mock_tests(title, hsk_level)";

/** Багшид сонгуулах бэлэн загвар шалгалтууд. */
export async function getExamTestOptions(): Promise<
  ExamResult<ExamTestOption[]>
> {
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("mock_tests")
    .select("id, title, hsk_level, total_questions, time_limit_min")
    .order("hsk_level", { ascending: true })
    .order("id", { ascending: true });

  if (error) return { data: null, error: toError(error) };

  return {
    data: (data ?? []).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      hskLevel: Number(row.hsk_level),
      totalQuestions: Number(row.total_questions),
      timeLimitMin: Number(row.time_limit_min),
    })),
    error: null,
  };
}

export async function getClassroomExams(
  classroomId: string
): Promise<ExamResult<ClassroomExam[]>> {
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("classroom_exams")
    .select(EXAM_SELECT)
    .eq("classroom_id", classroomId)
    .order("scheduled_for", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: toError(error) };
  return {
    data: (data ?? []).map((row) => mapExam(row as Record<string, unknown>)),
    error: null,
  };
}

export async function createClassroomExam(input: {
  classroomId: string;
  testId: string;
  title?: string;
  scheduledFor?: string;
  dueDate?: string;
  status?: ClassroomExamStatus;
}): Promise<ExamResult<ClassroomExam>> {
  if (!supabase) return notConfigured();

  const { userId } = await getAuthenticatedUserId();
  if (!userId) return { data: null, error: "Нэвтрээгүй байна." };

  const { data, error } = await supabase
    .from("classroom_exams")
    .insert({
      classroom_id: input.classroomId,
      test_id: input.testId,
      title: input.title?.trim() || null,
      scheduled_for: input.scheduledFor || null,
      due_date: input.dueDate || null,
      status: input.status ?? "scheduled",
      created_by: userId,
    })
    .select(EXAM_SELECT)
    .single();

  if (error) return { data: null, error: toError(error) };
  return { data: mapExam(data as Record<string, unknown>), error: null };
}

export async function updateClassroomExamStatus(
  examId: string,
  status: ClassroomExamStatus
): Promise<ExamResult<ClassroomExam>> {
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("classroom_exams")
    .update({ status })
    .eq("id", examId)
    .select(EXAM_SELECT)
    .single();

  if (error) return { data: null, error: toError(error) };
  return { data: mapExam(data as Record<string, unknown>), error: null };
}

export async function deleteClassroomExam(
  examId: string
): Promise<ExamResult<null>> {
  if (!supabase) return notConfigured();

  const { error } = await supabase
    .from("classroom_exams")
    .delete()
    .eq("id", examId);

  if (error) return { data: null, error: toError(error) };
  return { data: null, error: null };
}

/**
 * Оролдлого нь шалгалтын хугацаанд багтаж байна уу?
 *
 * Товлосон огноо байвал түүнээс өмнөх (өөрөө дасгал болгож өгсөн) оролдлогыг
 * ангийн шалгалт гэж тооцохгүй. Дуусах огноо байвал тэр өдрийн төгсгөл хүртэл.
 */
function attemptInWindow(
  finishedAt: string | null,
  scheduledFor: string | null,
  dueDate: string | null
): boolean {
  if (!finishedAt) return false;
  const finished = new Date(finishedAt).getTime();
  if (Number.isNaN(finished)) return false;

  if (scheduledFor) {
    const start = new Date(`${scheduledFor}T00:00:00`).getTime();
    if (!Number.isNaN(start) && finished < start) return false;
  }
  if (dueDate) {
    const end = new Date(`${dueDate}T00:00:00`).getTime() + 24 * 60 * 60 * 1000;
    if (!Number.isNaN(end) && finished >= end) return false;
  }
  return true;
}

async function fetchAttempts(
  testIds: string[],
  studentIds: string[]
): Promise<{ attempts: ExamAttemptRow[]; error: string | null }> {
  if (!supabase || testIds.length === 0 || studentIds.length === 0) {
    return { attempts: [], error: null };
  }

  const { data, error } = await supabase
    .from("user_test_attempts")
    .select("id, user_id, test_id, finished_at, raw_score, max_score, score_metadata")
    .in("test_id", testIds)
    .in("user_id", studentIds)
    .eq("status", "completed")
    .order("finished_at", { ascending: false });

  if (error) return { attempts: [], error: error.message };

  return {
    attempts: (data ?? []).map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      testId: String(row.test_id ?? ""),
      finishedAt: row.finished_at ? String(row.finished_at) : null,
      rawScore: row.raw_score != null ? Number(row.raw_score) : null,
      maxScore: row.max_score != null ? Number(row.max_score) : null,
      metadata: (row.score_metadata ?? null) as HskAttemptScoreMetadata | null,
    })),
    error: null,
  };
}

/**
 * Ангийн шалгалт бүрийн дүн: хэн өгсөн, хэдэн оноо, дундаж, тэнцсэн хувь.
 *
 * Шалгалт өгөөгүй сурагч «Өгөөгүй» мөр болж үлдэнэ — 0 оноо гэж тооцохгүй.
 */
export async function getClassroomExamSummaries(
  classroomId: string
): Promise<ExamListResult<ClassroomExamSummary[]>> {
  if (!supabase) {
    return { data: null, error: NOT_CONFIGURED, warnings: [] };
  }

  const warnings: string[] = [];

  const [examsRes, studentsRes] = await Promise.all([
    getClassroomExams(classroomId),
    getClassroomStudents(classroomId),
  ]);

  if (examsRes.error) {
    return { data: null, error: examsRes.error, warnings };
  }
  if (studentsRes.error) warnings.push(studentsRes.error);

  const exams = examsRes.data ?? [];
  const students = studentsRes.data ?? [];

  if (exams.length === 0) {
    return { data: [], error: null, warnings };
  }

  const studentIds = students
    .map((student) => student.studentUserId)
    .filter((id): id is string => Boolean(id));

  const missingAccounts = students.length - studentIds.length;
  if (missingAccounts > 0) {
    warnings.push(
      `${missingAccounts} сурагч апп дээрх бүртгэлтэй холбогдоогүй тул дүн нь татагдахгүй.`
    );
  }

  const { attempts, error: attemptsError } = await fetchAttempts(
    exams.map((exam) => exam.testId),
    studentIds
  );
  if (attemptsError) warnings.push(attemptsError);

  const summaries = exams.map((exam) => {
    const threshold = resolvePassThreshold(exam.hskLevel);

    // finished_at буурахаар эрэмбэлэгдсэн тул эхний тохирох нь хамгийн сүүлийнх.
    const latestByStudent = new Map<string, ExamAttemptRow>();
    for (const attempt of attempts) {
      if (attempt.testId !== exam.testId) continue;
      if (!attemptInWindow(attempt.finishedAt, exam.scheduledFor, exam.dueDate)) {
        continue;
      }
      if (!latestByStudent.has(attempt.userId)) {
        latestByStudent.set(attempt.userId, attempt);
      }
    }

    const rows: ClassroomExamStudentRow[] = students.map((student) => {
      const attempt = student.studentUserId
        ? latestByStudent.get(student.studentUserId)
        : undefined;
      const label =
        student.displayName?.trim() ||
        student.email?.trim() ||
        "Нэргүй сурагч";

      if (!attempt) {
        return {
          studentRowId: student.id,
          studentUserId: student.studentUserId,
          displayName: label,
          sat: false,
          attemptId: null,
          score: null,
          maxScore: null,
          percentage: null,
          passed: null,
          writingPending: false,
          finishedAt: null,
        };
      }

      const scored = scoreFromAttempt(attempt, threshold);
      return {
        studentRowId: student.id,
        studentUserId: student.studentUserId,
        displayName: label,
        sat: true,
        attemptId: attempt.id,
        score: scored.score,
        maxScore: scored.maxScore,
        percentage: scored.percentage,
        passed: scored.passed,
        writingPending: scored.writingPending,
        finishedAt: attempt.finishedAt,
      };
    });

    return summarizeExam(exam, rows, threshold);
  });

  return { data: summaries, error: null, warnings };
}

export type LearnerClassExam = ClassroomExam & {
  classroomName: string | null;
  /** Суралцагч энэ шалгалтыг хугацаанд нь өгсөн эсэх. */
  sat: boolean;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  passed: boolean | null;
};

/**
 * Суралцагчийн ангид өгсөн загвар шалгалтууд (хаасныг оруулахгүй).
 *
 * RLS: classroom_exams_select политик тухайн ангийн сурагчид л мөрийг харуулна.
 */
export async function getLearnerClassExams(): Promise<
  ExamResult<LearnerClassExam[]>
> {
  if (!supabase) return notConfigured();

  const { userId } = await getAuthenticatedUserId();
  if (!userId) return { data: [], error: null };

  const { data, error } = await supabase
    .from("classroom_exams")
    .select("*, mock_tests(title, hsk_level), classrooms(name)")
    .neq("status", "closed")
    .order("scheduled_for", { ascending: true, nullsFirst: false });

  if (error) return { data: null, error: toError(error) };

  const exams = (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const classroom = record.classrooms as Record<string, unknown> | null;
    return {
      ...mapExam(record),
      classroomName: classroom?.name != null ? String(classroom.name) : null,
    };
  });

  if (exams.length === 0) return { data: [], error: null };

  const { attempts } = await fetchAttempts(
    exams.map((exam) => exam.testId),
    [userId]
  );

  const withScores: LearnerClassExam[] = exams.map((exam) => {
    const threshold = resolvePassThreshold(exam.hskLevel);
    const attempt = attempts.find(
      (row) =>
        row.testId === exam.testId &&
        attemptInWindow(row.finishedAt, exam.scheduledFor, exam.dueDate)
    );

    if (!attempt) {
      return {
        ...exam,
        sat: false,
        score: null,
        maxScore: null,
        percentage: null,
        passed: null,
      };
    }

    const scored = scoreFromAttempt(attempt, threshold);
    return {
      ...exam,
      sat: true,
      score: scored.score,
      maxScore: scored.maxScore,
      percentage: scored.percentage,
      passed: scored.passed,
    };
  });

  return { data: withScores, error: null };
}
