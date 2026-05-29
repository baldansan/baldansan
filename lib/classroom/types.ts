/** Classroom domain types — Phase 7 Step 8 */

export type TeacherProfile = {
  userId: string;
  displayName: string | null;
  organization: string | null;
  bio: string | null;
  role: string;
  createdAt?: string;
  updatedAt?: string;
};

export type StudentProfile = {
  userId: string;
  displayName: string | null;
  schoolName: string | null;
  gradeLevel: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ClassroomVisibility = "private" | "organization" | "archived";

export type Classroom = {
  id: string;
  teacherUserId: string;
  name: string;
  level: string | null;
  description: string | null;
  status: string;
  organizationId: string | null;
  visibility: ClassroomVisibility;
  createdBy: string | null;
  createdAt?: string;
  updatedAt?: string;
  studentCount?: number;
  assignmentCount?: number;
  organizationName?: string | null;
  isPersonal?: boolean;
};

export type ClassroomStudent = {
  id: string;
  classroomId: string;
  studentUserId: string | null;
  displayName: string | null;
  email: string | null;
  status: string;
  joinedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Assignment = {
  id: string;
  classroomId: string;
  lessonId: string;
  assignmentType: string;
  title: string;
  instructions: string | null;
  dueDate: string | null;
  status: string;
  organizationId: string | null;
  createdBy: string | null;
  createdAt?: string;
  updatedAt?: string;
  classroomName?: string;
  organizationName?: string | null;
};

export type AssignmentResult = {
  id: string;
  assignmentId: string;
  studentUserId: string | null;
  status: string;
  completedAt: string | null;
  quizScore: number | null;
  quizTotal: number | null;
  quizPercentage: number | null;
  metadata: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  studentDisplayName?: string;
};

export type StudentAssignment = Assignment & {
  resultStatus: string | null;
  resultId: string | null;
  quizPercentage: number | null;
  quizScore: number | null;
  quizTotal: number | null;
  completedAt: string | null;
  teacherLabel?: string | null;
};

export type TeacherDashboardStats = {
  classroomCount: number;
  studentCount: number;
  assignmentCount: number;
  activeClassrooms: Classroom[];
  recentAssignments: Assignment[];
};

export const ASSIGNMENT_TYPES = [
  "full_lesson",
  "watch",
  "vocabulary",
  "quiz",
  "review",
] as const;

export type AssignmentType = (typeof ASSIGNMENT_TYPES)[number];
