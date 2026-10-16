import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { avg, completedStatus, rate } from "@/lib/teacher/report-builder";

/**
 * Багшийн долоо хоногийн тайлангийн өгөгдөл — cron-оос service-role клиентээр
 * дуудагдана (хэрэглэгчийн session байхгүй тул lib/supabase/teacher-analytics.ts-ийн
 * session-based (`getAuthenticatedUserId` → RLS) функцүүдийг шууд ашиглаж чадахгүй:
 * тэдгээр нь auth.uid()-д түшиглэсэн багшийн ангиудыг шүүдэг тул service-role
 * клиентээр дуудвал бүх багшийн бүх ангийг буцаана).
 *
 * Тул энд adhoc тооцоог teacher-analytics.ts-тэй ижил арга зүйгээр (avg/rate/
 * completedStatus report-builder helper-үүд, ижил "needs attention" логик)
 * гэхдээ teacher_user_id-аар тодорхой шүүж дахин бичсэн.
 */

export type WeeklyClassSummary = {
  classroomId: string;
  name: string;
  studentCount: number;
  activeStudentCount: number;
  inactiveStudentCount: number;
  assignmentsCount: number;
  completionRate: number;
  averageQuizPercentage: number | null;
  weeklyCompletedCount: number;
  needsAttention: string[];
};

export type WeeklyTeacherReportData = {
  teacherUserId: string;
  teacherName: string;
  classCount: number;
  totalStudents: number;
  totalInactiveStudents: number;
  averageQuizPercentage: number | null;
  weeklyCompletedCount: number;
  classes: WeeklyClassSummary[];
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const INACTIVE_DAYS = 7;

export async function getWeeklyTeacherReportData(
  service: SupabaseClient,
  teacherUserId: string,
  teacherName: string
): Promise<WeeklyTeacherReportData | null> {
  const { data: classrooms, error: classError } = await service
    .from("classrooms")
    .select("id, name, status")
    .eq("teacher_user_id", teacherUserId);

  if (classError || !classrooms || classrooms.length === 0) {
    return null;
  }

  const classroomIds = classrooms.map((c) => String(c.id));

  const { data: students } = await service
    .from("classroom_students")
    .select("id, classroom_id, student_user_id, status")
    .in("classroom_id", classroomIds);

  const { data: assignments } = await service
    .from("assignments")
    .select("id, classroom_id")
    .in("classroom_id", classroomIds);

  const assignmentIds = (assignments ?? []).map((a) => String(a.id));

  const { data: results } =
    assignmentIds.length > 0
      ? await service
          .from("assignment_results")
          .select(
            "id, assignment_id, student_user_id, status, quiz_percentage, completed_at, updated_at"
          )
          .in("assignment_id", assignmentIds)
      : { data: [] as Record<string, unknown>[] };

  const now = Date.now();
  const weekAgo = now - WEEK_MS;
  const inactiveSinceMs = now - INACTIVE_DAYS * 24 * 60 * 60 * 1000;

  // Сурагч бүрийн сүүлийн идэвхийн огноо (assignment_results-ийн completed_at/updated_at дээр тулгуурлав)
  const lastActivityByStudent = new Map<string, number>();
  for (const r of results ?? []) {
    const sid = r.student_user_id ? String(r.student_user_id) : null;
    if (!sid) continue;
    const atRaw = (r.completed_at as string | null) ?? (r.updated_at as string | null);
    if (!atRaw) continue;
    const at = new Date(atRaw).getTime();
    if (Number.isNaN(at)) continue;
    const prev = lastActivityByStudent.get(sid) ?? 0;
    if (at > prev) lastActivityByStudent.set(sid, at);
  }

  const classSummaries: WeeklyClassSummary[] = classrooms.map((c) => {
    const classroomId = String(c.id);
    const classStudents = (students ?? []).filter(
      (s) => String(s.classroom_id) === classroomId
    );
    const linkedStudentIds = classStudents
      .map((s) => (s.student_user_id ? String(s.student_user_id) : null))
      .filter((v): v is string => Boolean(v));

    const classAssignmentIds = (assignments ?? [])
      .filter((a) => String(a.classroom_id) === classroomId)
      .map((a) => String(a.id));

    const classResults = (results ?? []).filter((r) =>
      classAssignmentIds.includes(String(r.assignment_id))
    );
    const completed = classResults.filter((r) =>
      completedStatus(String(r.status))
    );
    const weeklyCompleted = completed.filter((r) => {
      const atRaw =
        (r.completed_at as string | null) ?? (r.updated_at as string | null);
      if (!atRaw) return false;
      const at = new Date(atRaw).getTime();
      return !Number.isNaN(at) && at >= weekAgo;
    });
    const quizPercents = completed
      .map((r) => (r.quiz_percentage != null ? Number(r.quiz_percentage) : null))
      .filter((p): p is number => p != null);

    const activeStudentCount = linkedStudentIds.filter((sid) => {
      const last = lastActivityByStudent.get(sid);
      return last != null && last >= inactiveSinceMs;
    }).length;
    const inactiveStudentCount = linkedStudentIds.length - activeStudentCount;

    const totalPossible = linkedStudentIds.length * classAssignmentIds.length;

    const needsAttention: string[] = [];
    if (inactiveStudentCount > 0) {
      needsAttention.push(
        `${inactiveStudentCount} сурагч ${INACTIVE_DAYS}+ хоног идэвхгүй байна`
      );
    }
    const avgQuiz = avg(quizPercents);
    if (avgQuiz != null && avgQuiz < 70) {
      needsAttention.push(`Дасгалын дундаж оноо ${avgQuiz}% — анхаарах хэрэгтэй`);
    }

    return {
      classroomId,
      name: String(c.name ?? "—"),
      studentCount: classStudents.length,
      activeStudentCount,
      inactiveStudentCount,
      assignmentsCount: classAssignmentIds.length,
      completionRate: rate(completed.length, totalPossible),
      averageQuizPercentage: avgQuiz,
      weeklyCompletedCount: weeklyCompleted.length,
      needsAttention,
    };
  });

  const allQuizPercents = classSummaries
    .map((c) => c.averageQuizPercentage)
    .filter((p): p is number => p != null);

  return {
    teacherUserId,
    teacherName,
    classCount: classSummaries.length,
    totalStudents: classSummaries.reduce((a, b) => a + b.studentCount, 0),
    totalInactiveStudents: classSummaries.reduce(
      (a, b) => a + b.inactiveStudentCount,
      0
    ),
    averageQuizPercentage: avg(allQuizPercents),
    weeklyCompletedCount: classSummaries.reduce(
      (a, b) => a + b.weeklyCompletedCount,
      0
    ),
    classes: classSummaries,
  };
}
