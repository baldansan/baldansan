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
  /** Added by migration 054; null on databases that have not run it. */
  deliveryMode: ClassroomDeliveryMode | null;
  scheduleNote: string | null;
  courseId: string | null;
};

export type ClassroomDeliveryMode = "in_person" | "online" | "hybrid";

export const CLASSROOM_DELIVERY_MODE_LABELS: Record<
  ClassroomDeliveryMode,
  string
> = {
  in_person: "Танхимаар",
  online: "Онлайнаар",
  hybrid: "Танхим + онлайн",
};

export function classroomDeliveryModeLabel(
  mode: string | null | undefined
): string | null {
  if (!mode) return null;
  return (
    CLASSROOM_DELIVERY_MODE_LABELS[mode as ClassroomDeliveryMode] ?? mode
  );
}

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

/** Даалгаврын хавсралт — assignment-attachments bucket доторх нэг файл. */
export type AssignmentAttachment = {
  /** Bucket доторх зам. Ил URL БИШ — татахдаа хугацаатай холбоос үүсгэнэ. */
  path: string;
  /** Багшийн байршуулсан анхны файлын нэр. */
  name: string;
  sizeBytes: number | null;
  mimeType: string | null;
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
  /**
   * null бол ангид бүхэлд нь өгсөн даалгавар.
   * Утгатай бол ЗӨВХӨН тэр сурагчид харагдана (RLS — 058 засвар).
   */
  targetStudentUserId: string | null;
  attachment: AssignmentAttachment | null;
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

/**
 * Багш өөрөө бичсэн, хичээл хавсраагүй даалгаврын хиймэл lesson id.
 *
 * 058 засвараас хойш `assignments.lesson_id` нь NULL байж болно, тиймээс ШИНЭ
 * мөрүүд NULL бичигдэнэ. Гэхдээ хуучин мөрүүд энэ утгатай хэвээр үлдсэн тул
 * аппын давхаргад NULL-ыг энэ утга руу хөрвүүлж, хоёуланг нь ижил гэж уншина
 * (`mapAssignmentFromRow`). Ингэснээр хуучин өгөгдлийг засах шаардлагагүй.
 */
export const CUSTOM_ASSIGNMENT_LESSON_ID = "custom";

export function isCustomAssignment(lessonId: string | null | undefined): boolean {
  return !lessonId || lessonId === CUSTOM_ASSIGNMENT_LESSON_ID;
}

/** What to show where a lesson id would go, including the no-lesson case. */
export function assignmentLessonLabel(
  lessonId: string | null | undefined
): string {
  return isCustomAssignment(lessonId)
    ? "Хичээл хавсаргаагүй"
    : `Хичээл ${lessonId}`;
}

export const ASSIGNMENT_TYPES = [
  "full_lesson",
  "watch",
  "vocabulary",
  "quiz",
  "review",
] as const;

export type AssignmentType = (typeof ASSIGNMENT_TYPES)[number];
