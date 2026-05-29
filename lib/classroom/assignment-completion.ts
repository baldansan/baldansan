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
