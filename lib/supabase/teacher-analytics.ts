import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import type { Assignment, AssignmentResult, ClassroomStudent } from "@/lib/classroom/types";
import type {
  AnalyticsResult,
  AssignmentAnalytics,
  AssignmentStudentResultRow,
  AssignmentSummaryRow,
  ClassroomProgressAnalytics,
  MissingStudentRow,
  NeedsAttentionItem,
  RecentClassActivity,
  RecentQuizRow,
  StudentProgressRow,
  TeacherAssignmentSummaryItem,
  TeacherOverviewMetrics,
} from "@/lib/teacher/analytics-types";
import {
  avg,
  completedStatus,
  emptyResult,
  rate,
  startedStatus,
} from "@/lib/teacher/report-builder";
import {
  getAssignmentById,
  getClassroomAssignments,
  getClassroomById,
  getClassroomStudents,
  getTeacherClassrooms,
  mapAssignmentFromRow,
} from "@/lib/supabase/classrooms";

function withWarnings<T>(
  data: T,
  error: string | null,
  warnings: string[]
): AnalyticsResult<T> {
  return { data, error, warnings };
}

async function requireUserId(): Promise<string | null> {
  const { userId } = await getAuthenticatedUserId();
  return userId;
}

async function fetchResultsForAssignments(
  assignmentIds: string[]
): Promise<{ results: AssignmentResult[]; error: string | null }> {
  if (!supabase || assignmentIds.length === 0) {
    return { results: [], error: null };
  }

  const { data, error } = await supabase
    .from("assignment_results")
    .select("*")
    .in("assignment_id", assignmentIds);

  if (error) return { results: [], error: error.message };

  return {
    results: (data ?? []).map((row) => ({
      id: String(row.id),
      assignmentId: String(row.assignment_id),
      studentUserId: row.student_user_id ? String(row.student_user_id) : null,
      status: String(row.status ?? "not_started"),
      completedAt: row.completed_at ? String(row.completed_at) : null,
      quizScore: row.quiz_score != null ? Number(row.quiz_score) : null,
      quizTotal: row.quiz_total != null ? Number(row.quiz_total) : null,
      quizPercentage:
        row.quiz_percentage != null ? Number(row.quiz_percentage) : null,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: row.created_at ? String(row.created_at) : undefined,
      updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    })),
    error: null,
  };
}

function studentLabel(s: ClassroomStudent): string {
  return s.displayName ?? s.email ?? "Student";
}

async function tryFetchLearnedVocabCounts(
  userIds: string[]
): Promise<{ counts: Map<string, number>; blocked: boolean }> {
  const counts = new Map<string, number>();
  if (!supabase || userIds.length === 0) {
    return { counts, blocked: false };
  }

  const { data, error } = await supabase
    .from("user_vocabulary_progress")
    .select("user_id")
    .in("user_id", userIds)
    .eq("learned", true);

  if (error) {
    return { counts, blocked: true };
  }

  for (const row of data ?? []) {
    const uid = String(row.user_id);
    counts.set(uid, (counts.get(uid) ?? 0) + 1);
  }

  return { counts, blocked: data?.length === 0 && userIds.length > 0 };
}

function buildNeedsAttention(
  students: StudentProgressRow[],
  assignmentSummaries: AssignmentSummaryRow[],
  avgQuiz: number | null
): NeedsAttentionItem[] {
  const items: NeedsAttentionItem[] = [];

  for (const s of students) {
    if (s.status === "invited" && !s.studentUserId) {
      items.push({
        kind: "invited_unlinked",
        label: s.displayName,
        detail: "Account not linked",
      });
    }
    if (s.studentUserId && s.assignmentsCompleted === 0 && s.assignmentsAssigned > 0) {
      items.push({
        kind: "student_no_completions",
        label: s.displayName,
        detail: "0 assignments completed",
      });
    }
  }

  for (const a of assignmentSummaries) {
    if (a.totalCount > 0 && a.completionRate < 50) {
      items.push({
        kind: "low_assignment_completion",
        label: a.title,
        detail: `${a.completionRate}% completion`,
      });
    }
  }

  if (avgQuiz != null && avgQuiz < 70) {
    items.push({
      kind: "low_quiz_average",
      label: "Class average quiz",
      detail: `${avgQuiz}%`,
    });
  }

  return items;
}

export async function getTeacherOverviewMetrics(): Promise<
  AnalyticsResult<TeacherOverviewMetrics>
> {
  if (!hasSupabaseConfig || !supabase) {
    return emptyResult("Supabase is not configured.");
  }

  const warnings: string[] = [];
  const { data: classrooms, error: classError } = await getTeacherClassrooms();
  if (classError) return emptyResult(classError);

  const list = classrooms ?? [];
  const classroomIds = list.map((c) => c.id);

  let assignmentCount = 0;
  let allAssignments: Assignment[] = [];

  if (classroomIds.length > 0) {
    const { data, error } = await supabase
      .from("assignments")
      .select("*, classrooms(name)")
      .in("classroom_id", classroomIds);

    if (error) return emptyResult(error.message);
    allAssignments = (data ?? []).map((row) =>
      mapAssignmentFromRow(row as Record<string, unknown>)
    );
    assignmentCount = allAssignments.length;
  }

  const assignmentIds = allAssignments.map((a) => a.id);
  const { results, error: resultsError } =
    await fetchResultsForAssignments(assignmentIds);
  if (resultsError) warnings.push(resultsError);

  const completedResults = results.filter((r) => completedStatus(r.status));
  const quizPercents = completedResults
    .map((r) => r.quizPercentage)
    .filter((p): p is number => p != null);

  let studentCount = 0;
  for (const c of list) {
    studentCount += c.studentCount ?? 0;
  }

  const classesNeedingAttention = list
    .filter((c) => (c.studentCount ?? 0) === 0 || (c.assignmentCount ?? 0) === 0)
    .map((c) => ({
      classroomId: c.id,
      name: c.name,
      reason:
        (c.studentCount ?? 0) === 0
          ? "No students enrolled"
          : "No assignments yet",
    }));

  return withWarnings(
    {
      classroomCount: list.length,
      studentCount,
      assignmentCount,
      completedResultCount: completedResults.length,
      averageQuizPercentage: avg(quizPercents),
      activeClassroomCount: list.filter((c) => c.status === "active").length,
      classesNeedingAttention,
    },
    null,
    warnings
  );
}

export async function getClassroomProgressAnalytics(
  classroomId: string
): Promise<AnalyticsResult<ClassroomProgressAnalytics>> {
  const warnings: string[] = [];

  const { data: classroom, error: classError } =
    await getClassroomById(classroomId);
  if (classError) return emptyResult(classError);
  if (!classroom) return emptyResult("Classroom not found.");

  const { data: students, error: studentsError } =
    await getClassroomStudents(classroomId);
  if (studentsError) return emptyResult(studentsError);

  const { data: assignments, error: assignError } =
    await getClassroomAssignments(classroomId);
  if (assignError) return emptyResult(assignError);

  const studentList = students ?? [];
  const assignmentList = assignments ?? [];
  const linkedStudents = studentList.filter((s) => s.studentUserId);
  const activeStudents = studentList.filter(
    (s) => s.status === "active" || Boolean(s.studentUserId)
  );

  const { results, error: resultsError } = await fetchResultsForAssignments(
    assignmentList.map((a) => a.id)
  );
  if (resultsError) warnings.push(resultsError);

  const completedResults = results.filter((r) => completedStatus(r.status));
  const quizPercents = completedResults
    .map((r) => r.quizPercentage)
    .filter((p): p is number => p != null);

  const linkedIds = linkedStudents
    .map((s) => s.studentUserId)
    .filter(Boolean) as string[];
  const { counts: vocabCounts, blocked: vocabBlocked } =
    await tryFetchLearnedVocabCounts(linkedIds);
  if (vocabBlocked) {
    warnings.push(
      "Learned vocabulary counts may be unavailable (RLS: teacher cannot read all student progress)."
    );
  }

  let learnedTotal: number | null = null;
  if (linkedIds.length > 0 && !vocabBlocked) {
    learnedTotal = [...vocabCounts.values()].reduce((a, b) => a + b, 0);
  } else if (linkedIds.length > 0) {
    learnedTotal = null;
  } else {
    learnedTotal = 0;
  }

  const assignmentSummaries: AssignmentSummaryRow[] = assignmentList.map((a) => {
    const forAssignment = results.filter((r) => r.assignmentId === a.id);
    const linkedCount = linkedStudents.length;
    const completed = forAssignment.filter((r) =>
      completedStatus(r.status)
    ).length;
    const percents = forAssignment
      .filter((r) => completedStatus(r.status) && r.quizPercentage != null)
      .map((r) => r.quizPercentage as number);

    return {
      assignmentId: a.id,
      title: a.title,
      lessonId: a.lessonId,
      dueDate: a.dueDate,
      completedCount: completed,
      totalCount: linkedCount,
      completionRate: rate(completed, linkedCount),
      averageQuizPercentage: avg(percents),
    };
  });

  const totalPossible = linkedStudents.length * assignmentList.length;
  const overallCompletion = rate(completedResults.length, totalPossible);

  const recentQuizAttempts: RecentQuizRow[] = completedResults
    .slice(0, 10)
    .map((r) => {
      const student = studentList.find((s) => s.studentUserId === r.studentUserId);
      const assignment = assignmentList.find((a) => a.id === r.assignmentId);
      return {
        studentLabel: student ? studentLabel(student) : r.studentUserId ?? "—",
        lessonId: assignment?.lessonId ?? "—",
        percentage: r.quizPercentage,
        at: r.completedAt ?? r.updatedAt ?? null,
      };
    });

  const studentRows = buildStudentProgressRows(
    studentList,
    assignmentList.length,
    results
  );

  const needsAttention = buildNeedsAttention(
    studentRows,
    assignmentSummaries,
    avg(quizPercents)
  );

  return withWarnings(
    {
      classroom,
      totalStudents: studentList.length,
      activeStudents: activeStudents.length,
      assignmentsCount: assignmentList.length,
      completedAssignmentsCount: completedResults.length,
      completionRate: overallCompletion,
      averageQuizPercentage: avg(quizPercents),
      learnedVocabularyRows: learnedTotal,
      recentQuizAttempts,
      assignmentSummaries,
      needsAttention,
    },
    null,
    warnings
  );
}

function buildStudentProgressRows(
  students: ClassroomStudent[],
  assignmentCount: number,
  results: AssignmentResult[],
  vocabCounts?: Map<string, number>
): StudentProgressRow[] {
  return students.map((s) => {
    const studentResults = s.studentUserId
      ? results.filter((r) => r.studentUserId === s.studentUserId)
      : [];
    const completed = studentResults.filter((r) =>
      completedStatus(r.status)
    ).length;
    const quizPercents = studentResults
      .map((r) => r.quizPercentage)
      .filter((p): p is number => p != null);
    const latestQuiz = quizPercents.length ? Math.max(...quizPercents) : null;
    const lastActivity = studentResults
      .map((r) => r.completedAt ?? r.updatedAt)
      .filter(Boolean)
      .sort()
      .reverse()[0] ?? null;

    return {
      studentRowId: s.id,
      displayName: studentLabel(s),
      email: s.email,
      status: s.status,
      studentUserId: s.studentUserId,
      assignmentsAssigned: assignmentCount,
      assignmentsCompleted: completed,
      completionRate: rate(completed, assignmentCount),
      latestQuizPercentage: latestQuiz,
      learnedWordsCount: s.studentUserId
        ? (vocabCounts?.get(s.studentUserId) ?? null)
        : null,
      lastActivityAt: lastActivity,
      progressUnavailable: !s.studentUserId,
    };
  });
}

export async function getClassroomStudentProgress(
  classroomId: string
): Promise<AnalyticsResult<StudentProgressRow[]>> {
  const warnings: string[] = [];
  const { data: students, error } = await getClassroomStudents(classroomId);
  if (error) return emptyResult(error);

  const { data: assignments } = await getClassroomAssignments(classroomId);
  const assignmentList = assignments ?? [];
  const { results, error: resultsError } = await fetchResultsForAssignments(
    assignmentList.map((a) => a.id)
  );
  if (resultsError) warnings.push(resultsError);

  const linkedIds = (students ?? [])
    .map((s) => s.studentUserId)
    .filter(Boolean) as string[];
  const { counts: vocabCounts, blocked } =
    await tryFetchLearnedVocabCounts(linkedIds);
  if (blocked) {
    warnings.push(
      "Per-student vocabulary counts may be unavailable due to RLS."
    );
  }

  return withWarnings(
    buildStudentProgressRows(
      students ?? [],
      assignmentList.length,
      results,
      vocabCounts
    ),
    null,
    warnings
  );
}

export async function getAssignmentAnalytics(
  assignmentId: string
): Promise<AnalyticsResult<AssignmentAnalytics>> {
  const warnings: string[] = [];
  const { data: assignment, error: assignError } =
    await getAssignmentById(assignmentId);
  if (assignError) return emptyResult(assignError);
  if (!assignment) return emptyResult("Assignment not found.");

  const { data: students, error: studentsError } = await getClassroomStudents(
    assignment.classroomId
  );
  if (studentsError) return emptyResult(studentsError);

  const { results, error: resultsError } = await fetchResultsForAssignments([
    assignmentId,
  ]);
  if (resultsError) warnings.push(resultsError);

  const studentList = students ?? [];
  const linkedStudents = studentList.filter((s) => s.studentUserId);
  const resultsByUser = new Map(
    results
      .filter((r) => r.studentUserId)
      .map((r) => [r.studentUserId as string, r])
  );

  const studentResults: AssignmentStudentResultRow[] = studentList.map((s) => {
    const result = s.studentUserId
      ? resultsByUser.get(s.studentUserId)
      : undefined;
    return {
      displayName: studentLabel(s),
      email: s.email,
      studentUserId: s.studentUserId,
      status: result?.status ?? (s.studentUserId ? "not_started" : "invited"),
      quizPercentage: result?.quizPercentage ?? null,
      quizScore: result?.quizScore ?? null,
      quizTotal: result?.quizTotal ?? null,
      completedAt: result?.completedAt ?? null,
    };
  });

  const missingStudents: MissingStudentRow[] = studentList
    .filter((s) => {
      if (!s.studentUserId) return true;
      const r = resultsByUser.get(s.studentUserId);
      return !r || r.status === "not_started";
    })
    .map((s) => ({
      displayName: studentLabel(s),
      email: s.email,
      reason: s.studentUserId ? "Not started" : "Invited — no account linked",
    }));

  const started = results.filter((r) => startedStatus(r.status)).length;
  const completed = results.filter((r) => completedStatus(r.status)).length;
  const percents = results
    .filter((r) => r.quizPercentage != null && completedStatus(r.status))
    .map((r) => r.quizPercentage as number);

  return withWarnings(
    {
      assignment,
      totalStudents: linkedStudents.length,
      startedCount: started,
      completedCount: completed,
      completionRate: rate(completed, linkedStudents.length),
      averageQuizPercentage: avg(percents),
      studentResults,
      missingStudents,
    },
    null,
    warnings
  );
}

export async function getTeacherAssignmentSummary(): Promise<
  AnalyticsResult<TeacherAssignmentSummaryItem[]>
> {
  const warnings: string[] = [];
  const userId = await requireUserId();
  if (!userId || !supabase) return emptyResult("Not signed in.");

  const { data: classrooms } = await getTeacherClassrooms();
  const ids = (classrooms ?? []).map((c) => c.id);
  if (ids.length === 0) return withWarnings([], null, warnings);

  const { data, error } = await supabase
    .from("assignments")
    .select("*, classrooms(name)")
    .in("classroom_id", ids)
    .order("created_at", { ascending: false });

  if (error) return emptyResult(error.message);

  const assignments = (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    lessonId: String(row.lesson_id),
    classroomId: String(row.classroom_id),
    classroomName: (row.classrooms as { name?: string } | null)?.name ?? null,
    dueDate: row.due_date ? String(row.due_date) : null,
  }));

  const { results } = await fetchResultsForAssignments(
    assignments.map((a) => a.id)
  );

  const items: TeacherAssignmentSummaryItem[] = assignments.map((a) => {
    const forA = results.filter((r) => r.assignmentId === a.id);
    const completed = forA.filter((r) => completedStatus(r.status)).length;
    const percents = forA
      .filter((r) => r.quizPercentage != null)
      .map((r) => r.quizPercentage as number);
    const total = forA.length;

    return {
      assignmentId: a.id,
      title: a.title,
      lessonId: a.lessonId,
      classroomId: a.classroomId,
      classroomName: a.classroomName,
      dueDate: a.dueDate,
      completionRate: rate(completed, total),
      averageQuizPercentage: avg(percents),
    };
  });

  return withWarnings(items, null, warnings);
}

export async function getTeacherRecentClassActivity(
  limit = 8
): Promise<AnalyticsResult<RecentClassActivity[]>> {
  if (!supabase) return emptyResult("Supabase not configured.");

  const { data: classrooms } = await getTeacherClassrooms();
  const classMap = new Map((classrooms ?? []).map((c) => [c.id, c.name]));
  const ids = [...classMap.keys()];
  if (ids.length === 0) return withWarnings([], null, []);

  const { data: assignments, error } = await supabase
    .from("assignments")
    .select("id, title, classroom_id, created_at")
    .in("classroom_id", ids)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return emptyResult(error.message);

  const assignmentIds = (assignments ?? []).map((a) => String(a.id));
  const { results } = await fetchResultsForAssignments(assignmentIds);

  const fromAssignments: RecentClassActivity[] = (assignments ?? []).map((a) => ({
    id: String(a.id),
    type: "assignment_created" as const,
    label: String(a.title),
    classroomName: classMap.get(String(a.classroom_id)) ?? null,
    at: String(a.created_at),
  }));

  const fromResults: RecentClassActivity[] = results
    .filter((r) => completedStatus(r.status))
    .map((r) => ({
      id: r.id,
      type: "result_completed" as const,
      label: `Quiz completed (${r.quizPercentage ?? "—"}%)`,
      classroomName: null,
      at: r.completedAt ?? r.updatedAt ?? new Date().toISOString(),
    }));

  const merged = [...fromResults, ...fromAssignments]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);

  return withWarnings(merged, null, []);
}
