/**
 * Sync quiz completion to matching classroom assignments (logged-in students).
 */
export async function completeMatchingAssignmentsForLesson(
  lessonId: string,
  quizResult: { score: number; total: number; percentage: number }
): Promise<void> {
  try {
    const { getAuthenticatedUserId, hasSupabaseConfig } = await import(
      "@/lib/supabase/auth"
    );
    if (!hasSupabaseConfig) return;

    const { userId } = await getAuthenticatedUserId();
    if (!userId) return;

    const { getStudentAssignments, upsertAssignmentResult } = await import(
      "@/lib/supabase/classrooms"
    );

    const { data: assignments, error } = await getStudentAssignments();
    if (error || !assignments?.length) return;

    const matching = assignments.filter(
      (a) =>
        a.lessonId === lessonId &&
        (a.assignmentType === "quiz" ||
          a.assignmentType === "full_lesson" ||
          a.assignmentType === "watch")
    );

    await Promise.all(
      matching.map((a) =>
        upsertAssignmentResult({
          assignmentId: a.id,
          studentUserId: userId,
          status: "completed",
          quizScore: quizResult.score,
          quizTotal: quizResult.total,
          quizPercentage: quizResult.percentage,
          metadata: { source: "quiz_completion" },
        })
      )
    );
  } catch (err) {
    console.warn("[classroom] Assignment result sync skipped.", err);
  }
}

/**
 * «Бичих дэвтэр»: ангийн бичих даалгаврын бүх нүд дуусахад тухайн
 * assignment_results мөрийг 'completed' болгоно (нэвтэрсэн сурагч).
 */
export async function completeWritingAssignment(
  assignmentId: string,
  summary?: { charsTotal: number; mistakes: number }
): Promise<boolean> {
  try {
    const { getAuthenticatedUserId, hasSupabaseConfig } = await import(
      "@/lib/supabase/auth"
    );
    if (!hasSupabaseConfig) return false;

    const { userId } = await getAuthenticatedUserId();
    if (!userId) return false;

    const { upsertAssignmentResult } = await import("@/lib/supabase/classrooms");
    const res = await upsertAssignmentResult({
      assignmentId,
      studentUserId: userId,
      status: "completed",
      metadata: {
        source: "writing_list",
        ...(summary ?? {}),
      },
    });
    return !res.error;
  } catch (err) {
    console.warn("[classroom] Writing assignment completion skipped.", err);
    return false;
  }
}
