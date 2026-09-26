/** Teacher analytics types — Phase 7 Step 9 */

import type { Assignment, Classroom } from "@/lib/classroom/types";

export type AnalyticsResult<T> = {
  data: T | null;
  error: string | null;
  warnings: string[];
};

export type TeacherOverviewMetrics = {
  classroomCount: number;
  studentCount: number;
  assignmentCount: number;
  completedResultCount: number;
  averageQuizPercentage: number | null;
  activeClassroomCount: number;
  classesNeedingAttention: ClassNeedingAttention[];
};

export type ClassNeedingAttention = {
  classroomId: string;
  name: string;
  reason: string;
};

export type ClassroomProgressAnalytics = {
  classroom: Classroom;
  totalStudents: number;
  activeStudents: number;
  assignmentsCount: number;
  completedAssignmentsCount: number;
  completionRate: number;
  averageQuizPercentage: number | null;
  learnedVocabularyRows: number | null;
  recentQuizAttempts: RecentQuizRow[];
  assignmentSummaries: AssignmentSummaryRow[];
  needsAttention: NeedsAttentionItem[];
};

export type StudentProgressRow = {
  studentRowId: string;
  displayName: string;
  email: string | null;
  status: string;
  studentUserId: string | null;
  assignmentsAssigned: number;
  assignmentsCompleted: number;
  completionRate: number;
  latestQuizPercentage: number | null;
  learnedWordsCount: number | null;
  lastActivityAt: string | null;
  progressUnavailable: boolean;
};

export type AssignmentSummaryRow = {
  assignmentId: string;
  title: string;
  lessonId: string;
  dueDate: string | null;
  completedCount: number;
  totalCount: number;
  completionRate: number;
  averageQuizPercentage: number | null;
  /** Ангийн заавал хөтөлбөрийн хичээл (066) — даалгаврын жагсаалтаас тусад нь харуулна. */
  isCurriculum: boolean;
};

export type AssignmentAnalytics = {
  assignment: Assignment;
  totalStudents: number;
  startedCount: number;
  completedCount: number;
  completionRate: number;
  averageQuizPercentage: number | null;
  studentResults: AssignmentStudentResultRow[];
  missingStudents: MissingStudentRow[];
};

export type AssignmentStudentResultRow = {
  displayName: string;
  email: string | null;
  studentUserId: string | null;
  status: string;
  quizPercentage: number | null;
  quizScore: number | null;
  quizTotal: number | null;
  completedAt: string | null;
};

export type MissingStudentRow = {
  displayName: string;
  email: string | null;
  reason: string;
};

export type TeacherAssignmentSummaryItem = {
  assignmentId: string;
  title: string;
  /** Null for a teacher's own task with no lesson attached (migration 058). */
  lessonId: string | null;
  classroomId: string;
  classroomName: string | null;
  dueDate: string | null;
  completionRate: number;
  averageQuizPercentage: number | null;
};

export type RecentClassActivity = {
  id: string;
  type: "result_completed" | "assignment_created";
  label: string;
  classroomName: string | null;
  at: string;
};

export type RecentQuizRow = {
  studentLabel: string;
  lessonId: string;
  percentage: number | null;
  at: string | null;
};

/** Where the evidence for a weak lesson came from. Never guessed. */
export type WeakSpotSource = "question_attempts" | "quiz_attempts" | "both";

export type WeakStageRow = {
  stage: string;
  attemptCount: number;
  wrongCount: number;
  accuracyPercent: number;
};

export type StudentWeakLesson = {
  lessonId: string;
  lessonTitle: string | null;
  courseId: string | null;
  /** question_attempts rows for this student on this lesson. */
  attemptCount: number;
  /** Wrong answers among those rows. */
  wrongCount: number;
  /** Distinct questions the student got wrong at least once. */
  missedQuestionCount: number;
  /** Correct share of question_attempts, 0–100. Null when there are none. */
  accuracyPercent: number | null;
  stages: WeakStageRow[];
  quizAttemptCount: number;
  latestQuizPercentage: number | null;
  latestQuizScore: number | null;
  latestQuizTotal: number | null;
  lastAttemptAt: string | null;
  source: WeakSpotSource;
};

export type StudentWeakSpots = {
  studentRowId: string;
  displayName: string;
  email: string | null;
  studentUserId: string | null;
  /** True only when at least one real attempt row was read for this student. */
  hasData: boolean;
  /** Mongolian explanation shown instead of numbers when hasData is false. */
  noDataReason: string | null;
  totalAttempts: number;
  totalWrong: number;
  overallAccuracyPercent: number | null;
  weakLessons: StudentWeakLesson[];
};

export type ClassroomWeakSpots = {
  classroomId: string;
  students: StudentWeakSpots[];
  /** True when the attempt tables could not be read at all (RLS / config). */
  attemptsBlocked: boolean;
};

export type NeedsAttentionItem = {
  kind:
    | "student_no_completions"
    | "low_assignment_completion"
    | "low_quiz_average"
    | "invited_unlinked";
  label: string;
  detail?: string;
};
