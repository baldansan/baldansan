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
  /** 6 оронтой ангийн код (migration 064); null бол migration ажиллаагүй. */
  joinCode: string | null;
  /** Заавал хөтөлбөрийн түвшин (migration 066); null бол хөтөлбөр алга. */
  curriculumCourseId: string | null;
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
  /** Ангийн заавал хөтөлбөрийн хичээл эсэх (migration 066). Хуучин DB дээр false. */
  isCurriculum: boolean;
  /** Заавал хөтөлбөр доторх дараалал (0-ээс); энгийн даалгаварт null. */
  orderIndex: number | null;
  /** Хөтөлбөрийн түвшин/курс (жишээ нь hsk1); энгийн даалгаварт null. */
  courseId: string | null;
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

// --- Ангийн заавал хөтөлбөр (migration 066) ---

/** Заавал хөтөлбөр сонгож болох түвшнүүд (апп дахь курсын ID). */
export const CURRICULUM_COURSE_IDS = [
  "hsk1",
  "hsk2",
  "hsk3",
  "hsk4",
  "hsk5",
  "hsk6",
] as const;

export type CurriculumCourseId = (typeof CURRICULUM_COURSE_IDS)[number];

export function isCurriculumCourseId(value: unknown): value is CurriculumCourseId {
  return (
    typeof value === "string" &&
    (CURRICULUM_COURSE_IDS as readonly string[]).includes(value)
  );
}

/** "hsk3" → "HSK 3" */
export function curriculumCourseLabel(courseId: string | null | undefined): string {
  if (!courseId) return "";
  const m = courseId.match(/^hsk(\d)$/i);
  return m ? `HSK ${m[1]}` : courseId;
}

/** Хөтөлбөрт сонгож болох нэг хичээл (/api/curriculum/lessons). */
export type CurriculumLessonOption = {
  id: string;
  title: string;
  chineseTitle: string | null;
};

/** set_classroom_curriculum RPC-д өгөх нэг мөр. */
export type CurriculumLessonInput = {
  lessonId: string;
  title: string;
  orderIndex: number;
};

/** classroom_curriculum_progress RPC-ийн нэг мөр. */
export type CurriculumProgressRow = {
  studentUserId: string;
  displayName: string;
  total: number;
  completed: number;
  percent: number;
  lastCompletedAt: string | null;
};

export type MyCurriculumLesson = {
  assignmentId: string;
  lessonId: string;
  title: string;
  orderIndex: number;
  completed: boolean;
  completedAt: string | null;
};

export type MyCurriculumClass = {
  classroomId: string;
  classroomName: string;
  courseId: string | null;
  lessons: MyCurriculumLesson[];
  completedCount: number;
  totalCount: number;
  percent: number;
  /** Дараагийн дуусаагүй хичээл; бүгд дууссан бол null. */
  nextLessonId: string | null;
  nextLessonTitle: string | null;
};

export type MyCurriculum = {
  classes: MyCurriculumClass[];
  completedCount: number;
  totalCount: number;
  /** Эхний дуусаагүй хичээл (анги дарааллаар); бүгд дууссан бол null. */
  nextLessonId: string | null;
  nextLessonTitle: string | null;
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
