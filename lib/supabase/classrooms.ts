import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import {
  CUSTOM_ASSIGNMENT_LESSON_ID,
  type Assignment,
  type AssignmentAttachment,
  type AssignmentResult,
  type Classroom,
  type ClassroomStudent,
  type ClassroomVisibility,
  type StudentAssignment,
  type StudentProfile,
  type TeacherDashboardStats,
  type TeacherProfile,
} from "@/lib/classroom/types";

export type ClassroomResult<T> = { data: T | null; error: string | null };

function notConfigured<T>(): ClassroomResult<T> {
  return { data: null, error: "Supabase is not configured." };
}

function toError(error: { message: string } | null): string | null {
  return error?.message ?? null;
}

async function requireUserId(): Promise<string | null> {
  const { userId } = await getAuthenticatedUserId();
  return userId;
}

function mapTeacherProfile(row: Record<string, unknown>): TeacherProfile {
  return {
    userId: String(row.user_id),
    displayName: row.display_name ? String(row.display_name) : null,
    organization: row.organization ? String(row.organization) : null,
    bio: row.bio ? String(row.bio) : null,
    role: String(row.role ?? "teacher"),
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function mapStudentProfile(row: Record<string, unknown>): StudentProfile {
  return {
    userId: String(row.user_id),
    displayName: row.display_name ? String(row.display_name) : null,
    schoolName: row.school_name ? String(row.school_name) : null,
    gradeLevel: row.grade_level ? String(row.grade_level) : null,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function mapClassroom(row: Record<string, unknown>): Classroom {
  return mapClassroomFromRow(row);
}

export function mapClassroomFromRow(row: Record<string, unknown>): Classroom {
  const orgs = row.organizations as { name?: string } | null;
  return {
    id: String(row.id),
    teacherUserId: String(row.teacher_user_id),
    name: String(row.name),
    level: row.level ? String(row.level) : null,
    description: row.description ? String(row.description) : null,
    status: String(row.status ?? "active"),
    organizationId: row.organization_id ? String(row.organization_id) : null,
    visibility: String(row.visibility ?? "private") as ClassroomVisibility,
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    organizationName: orgs?.name ?? null,
    isPersonal: !row.organization_id,
    deliveryMode: row.delivery_mode
      ? (String(row.delivery_mode) as Classroom["deliveryMode"])
      : null,
    scheduleNote: row.schedule_note ? String(row.schedule_note) : null,
    courseId: row.course_id ? String(row.course_id) : null,
    joinCode: row.join_code ? String(row.join_code) : null,
    curriculumCourseId: row.curriculum_course_id
      ? String(row.curriculum_course_id)
      : null,
  };
}

function mapClassroomStudent(row: Record<string, unknown>): ClassroomStudent {
  return {
    id: String(row.id),
    classroomId: String(row.classroom_id),
    studentUserId: row.student_user_id ? String(row.student_user_id) : null,
    displayName: row.display_name ? String(row.display_name) : null,
    email: row.email ? String(row.email) : null,
    status: String(row.status ?? "invited"),
    joinedAt: row.joined_at ? String(row.joined_at) : null,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function mapAssignment(
  row: Record<string, unknown>,
  classroomName?: string
): Assignment {
  return mapAssignmentFromRow(row, classroomName);
}

export function mapAssignmentFromRow(
  row: Record<string, unknown>,
  classroomName?: string
): Assignment {
  const classrooms = row.classrooms as Record<string, unknown> | null;
  const name =
    classroomName ??
    (classrooms?.name ? String(classrooms.name) : undefined);
  const orgFromJoin = classrooms?.organization_id
    ? String(classrooms.organization_id)
    : null;
  const orgNested = classrooms?.organizations as { name?: string } | null;
  return {
    id: String(row.id),
    classroomId: String(row.classroom_id),
    // 058-аас хойш lesson_id нь NULL байж болно. Хуучин мөрүүдэд 'custom' гэж
    // бичигдсэн байдаг тул хоёуланг нь нэг утга болгож нэгтгэнэ.
    lessonId: row.lesson_id
      ? String(row.lesson_id)
      : CUSTOM_ASSIGNMENT_LESSON_ID,
    assignmentType: String(row.assignment_type ?? "full_lesson"),
    title: String(row.title),
    instructions: row.instructions ? String(row.instructions) : null,
    dueDate: row.due_date ? String(row.due_date) : null,
    status: String(row.status ?? "assigned"),
    organizationId: row.organization_id
      ? String(row.organization_id)
      : orgFromJoin,
    createdBy: row.created_by ? String(row.created_by) : null,
    targetStudentUserId: row.target_student_user_id
      ? String(row.target_student_user_id)
      : null,
    attachment: mapAssignmentAttachment(row),
    isCurriculum: row.is_curriculum === true,
    orderIndex: row.order_index != null ? Number(row.order_index) : null,
    courseId: row.course_id ? String(row.course_id) : null,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    classroomName: name,
    organizationName: orgNested?.name ?? null,
  };
}

function mapAssignmentAttachment(
  row: Record<string, unknown>
): AssignmentAttachment | null {
  if (!row.attachment_path) return null;
  const path = String(row.attachment_path);
  return {
    path,
    name: row.attachment_name
      ? String(row.attachment_name)
      : path.split("/").pop() || path,
    sizeBytes:
      row.attachment_size_bytes != null
        ? Number(row.attachment_size_bytes)
        : null,
    mimeType: row.attachment_mime_type
      ? String(row.attachment_mime_type)
      : null,
  };
}

function mapAssignmentResult(row: Record<string, unknown>): AssignmentResult {
  return {
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
  };
}

// --- Teacher profiles ---

export async function getCurrentTeacherProfile(): Promise<
  ClassroomResult<TeacherProfile | null>
> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: null };

  const { data, error } = await supabase
    .from("teacher_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { data: null, error: toError(error) };
  return { data: data ? mapTeacherProfile(data) : null, error: null };
}

export async function upsertCurrentTeacherProfile(input: {
  displayName?: string;
  organization?: string;
  bio?: string;
  role?: string;
}): Promise<ClassroomResult<TeacherProfile>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const { data, error } = await supabase
    .from("teacher_profiles")
    .upsert(
      {
        user_id: userId,
        display_name: input.displayName ?? null,
        organization: input.organization ?? null,
        bio: input.bio ?? null,
        role: input.role ?? "teacher",
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) return { data: null, error: toError(error) };
  return { data: mapTeacherProfile(data), error: null };
}

export async function isCurrentUserTeacher(): Promise<boolean> {
  const { data } = await getCurrentTeacherProfile();
  return Boolean(data);
}

// --- Student profiles ---

export async function getCurrentStudentProfile(): Promise<
  ClassroomResult<StudentProfile | null>
> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: null };

  const { data, error } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { data: null, error: toError(error) };
  return { data: data ? mapStudentProfile(data) : null, error: null };
}

export async function upsertCurrentStudentProfile(input: {
  displayName?: string;
  schoolName?: string;
  gradeLevel?: string;
}): Promise<ClassroomResult<StudentProfile>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const { data, error } = await supabase
    .from("student_profiles")
    .upsert(
      {
        user_id: userId,
        display_name: input.displayName ?? null,
        school_name: input.schoolName ?? null,
        grade_level: input.gradeLevel ?? null,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) return { data: null, error: toError(error) };
  return { data: mapStudentProfile(data), error: null };
}

// --- Classrooms ---

async function attachClassroomCounts(
  classrooms: Classroom[]
): Promise<Classroom[]> {
  if (!supabase || classrooms.length === 0) return classrooms;

  const ids = classrooms.map((c) => c.id);
  const [studentsRes, assignmentsRes] = await Promise.all([
    supabase
      .from("classroom_students")
      .select("classroom_id")
      .in("classroom_id", ids),
    supabase.from("assignments").select("classroom_id").in("classroom_id", ids),
  ]);

  const studentCounts = new Map<string, number>();
  for (const row of studentsRes.data ?? []) {
    const cid = String(row.classroom_id);
    studentCounts.set(cid, (studentCounts.get(cid) ?? 0) + 1);
  }

  const assignmentCounts = new Map<string, number>();
  for (const row of assignmentsRes.data ?? []) {
    const cid = String(row.classroom_id);
    assignmentCounts.set(cid, (assignmentCounts.get(cid) ?? 0) + 1);
  }

  return classrooms.map((c) => ({
    ...c,
    studentCount: studentCounts.get(c.id) ?? 0,
    assignmentCount: assignmentCounts.get(c.id) ?? 0,
  }));
}

export { attachClassroomCounts };

export async function getAccessibleClassrooms(): Promise<
  ClassroomResult<Classroom[]>
> {
  return getTeacherClassrooms();
}

export async function getTeacherClassrooms(): Promise<
  ClassroomResult<Classroom[]>
> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: [], error: null };

  const { data, error } = await supabase
    .from("classrooms")
    .select("*, organizations(name)")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: toError(error) };
  const mapped = (data ?? []).map(mapClassroomFromRow);
  const withCounts = await attachClassroomCounts(mapped);
  return { data: withCounts, error: null };
}

export async function getPersonalClassrooms(): Promise<
  ClassroomResult<Classroom[]>
> {
  const res = await getTeacherClassrooms();
  if (res.error || !res.data) return res;
  const userId = await requireUserId();
  return {
    data: res.data.filter(
      (c) => !c.organizationId && c.teacherUserId === userId
    ),
    error: null,
  };
}

export async function getOrganizationClassroomsForUser(
  organizationId: string
): Promise<ClassroomResult<Classroom[]>> {
  const res = await getTeacherClassrooms();
  if (res.error || !res.data) return res;
  return {
    data: res.data.filter((c) => c.organizationId === organizationId),
    error: null,
  };
}

export async function getClassroomById(
  classroomId: string
): Promise<ClassroomResult<Classroom | null>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const { data, error } = await supabase
    .from("classrooms")
    .select("*, organizations(name)")
    .eq("id", classroomId)
    .maybeSingle();

  if (error) return { data: null, error: toError(error) };
  if (!data) return { data: null, error: null };
  const [withCounts] = await attachClassroomCounts([mapClassroom(data)]);
  return { data: withCounts, error: null };
}

export async function createClassroom(input: {
  name: string;
  level?: string;
  description?: string;
  organizationId?: string | null;
  visibility?: ClassroomVisibility;
}): Promise<ClassroomResult<Classroom>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const orgId = input.organizationId?.trim() || null;
  const visibility =
    input.visibility ?? (orgId ? "organization" : "private");

  const { data, error } = await supabase
    .from("classrooms")
    .insert({
      teacher_user_id: userId,
      name: input.name.trim(),
      level: input.level?.trim() || null,
      description: input.description?.trim() || null,
      status: "active",
      organization_id: orgId,
      visibility,
      created_by: userId,
    })
    .select("*, organizations(name)")
    .single();

  if (error) return { data: null, error: toError(error) };
  return { data: mapClassroomFromRow(data as Record<string, unknown>), error: null };
}

export async function updateClassroom(
  classroomId: string,
  input: { name?: string; level?: string; description?: string; status?: string }
): Promise<ClassroomResult<Classroom>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.level !== undefined) patch.level = input.level.trim() || null;
  if (input.description !== undefined)
    patch.description = input.description.trim() || null;
  if (input.status !== undefined) patch.status = input.status;

  const { data, error } = await supabase
    .from("classrooms")
    .update(patch)
    .eq("id", classroomId)
    .select("*")
    .single();

  if (error) return { data: null, error: toError(error) };
  return { data: mapClassroom(data), error: null };
}

export async function deleteClassroom(
  classroomId: string
): Promise<ClassroomResult<null>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const { error } = await supabase
    .from("classrooms")
    .delete()
    .eq("id", classroomId);

  if (error) return { data: null, error: toError(error) };
  return { data: null, error: null };
}

// --- Classroom students ---

export async function getClassroomStudents(
  classroomId: string
): Promise<ClassroomResult<ClassroomStudent[]>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: [], error: null };

  const { data, error } = await supabase
    .from("classroom_students")
    .select("*")
    .eq("classroom_id", classroomId)
    .order("created_at", { ascending: true });

  if (error) return { data: null, error: toError(error) };
  return { data: (data ?? []).map(mapClassroomStudent), error: null };
}

export async function addStudentToClassroom(
  classroomId: string,
  input: {
    displayName: string;
    email?: string;
    studentUserId?: string;
  }
): Promise<ClassroomResult<ClassroomStudent>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const hasStudentId = Boolean(input.studentUserId?.trim());
  const { data, error } = await supabase
    .from("classroom_students")
    .insert({
      classroom_id: classroomId,
      display_name: input.displayName.trim(),
      email: input.email?.trim() || null,
      student_user_id: input.studentUserId?.trim() || null,
      status: hasStudentId ? "active" : "invited",
      joined_at: hasStudentId ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error) return { data: null, error: toError(error) };
  return { data: mapClassroomStudent(data), error: null };
}

export type BulkStudentImportRow = {
  rowIndex?: number;
  email?: string | null;
  displayName?: string | null;
  studentUserId?: string | null;
  status?: string;
};

export type BulkStudentImportResult = {
  inserted: number;
  skipped: number;
  errors: string[];
  rows: Array<{
    rowIndex?: number;
    email?: string | null;
    displayName?: string | null;
    status: "inserted" | "skipped" | "error";
    message?: string;
    studentId?: string;
  }>;
};

export async function bulkAddClassroomStudents(
  classroomId: string,
  rows: BulkStudentImportRow[],
  options?: { organizationId?: string }
): Promise<ClassroomResult<BulkStudentImportResult>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const existingRes = await getClassroomStudents(classroomId);
  if (existingRes.error) {
    return { data: null, error: existingRes.error };
  }

  const existingEmails = new Set(
    (existingRes.data ?? [])
      .map((s) => s.email?.trim().toLowerCase())
      .filter(Boolean) as string[]
  );
  const existingUserIds = new Set(
    (existingRes.data ?? [])
      .map((s) => s.studentUserId)
      .filter(Boolean) as string[]
  );

  const result: BulkStudentImportResult = {
    inserted: 0,
    skipped: 0,
    errors: [],
    rows: [],
  };

  for (const row of rows) {
    const email = row.email?.trim().toLowerCase() || null;
    const displayName =
      row.displayName?.trim() ||
      (email ? email.split("@")[0] : null);
    const studentUserId = row.studentUserId?.trim() || null;

    if (!displayName) {
      result.errors.push(`Row ${row.rowIndex ?? "?"}: display_name or email required.`);
      result.rows.push({
        rowIndex: row.rowIndex,
        email,
        displayName,
        status: "error",
        message: "display_name or email required.",
      });
      continue;
    }

    if (email && existingEmails.has(email)) {
      result.skipped += 1;
      result.rows.push({
        rowIndex: row.rowIndex,
        email,
        displayName,
        status: "skipped",
        message: "Student with this email already in classroom.",
      });
      continue;
    }

    if (studentUserId && existingUserIds.has(studentUserId)) {
      result.skipped += 1;
      result.rows.push({
        rowIndex: row.rowIndex,
        email,
        displayName,
        status: "skipped",
        message: "Student with this user_id already in classroom.",
      });
      continue;
    }

    const hasStudentId = Boolean(studentUserId);
    const { data, error } = await supabase
      .from("classroom_students")
      .insert({
        classroom_id: classroomId,
        display_name: displayName,
        email: email,
        student_user_id: studentUserId,
        status: row.status?.trim() || (hasStudentId ? "active" : "invited"),
        joined_at: hasStudentId ? new Date().toISOString() : null,
      })
      .select("*")
      .single();

    if (error) {
      result.errors.push(`Row ${row.rowIndex ?? "?"}: ${error.message}`);
      result.rows.push({
        rowIndex: row.rowIndex,
        email,
        displayName,
        status: "error",
        message: error.message,
      });
      continue;
    }

    result.inserted += 1;
    if (email) existingEmails.add(email);
    if (studentUserId) existingUserIds.add(studentUserId);
    result.rows.push({
      rowIndex: row.rowIndex,
      email,
      displayName,
      status: "inserted",
      studentId: data ? String(data.id) : undefined,
    });
  }

  if (result.inserted > 0 && options?.organizationId) {
    const { markOnboardingTaskCompleteByKey } = await import(
      "@/lib/supabase/organization-onboarding"
    );
    await markOnboardingTaskCompleteByKey(
      options.organizationId,
      "add_demo_students"
    );
  }

  return { data: result, error: null };
}

export async function removeStudentFromClassroom(
  rowId: string
): Promise<ClassroomResult<null>> {
  if (!supabase) return notConfigured();
  const { error } = await supabase
    .from("classroom_students")
    .delete()
    .eq("id", rowId);
  if (error) return { data: null, error: toError(error) };
  return { data: null, error: null };
}

export async function updateClassroomStudent(
  rowId: string,
  input: {
    displayName?: string;
    email?: string;
    studentUserId?: string;
    status?: string;
  }
): Promise<ClassroomResult<ClassroomStudent>> {
  if (!supabase) return notConfigured();
  const patch: Record<string, unknown> = {};
  if (input.displayName !== undefined) patch.display_name = input.displayName.trim();
  if (input.email !== undefined) patch.email = input.email.trim() || null;
  if (input.studentUserId !== undefined) {
    patch.student_user_id = input.studentUserId.trim() || null;
    if (input.studentUserId.trim()) {
      patch.status = "active";
      patch.joined_at = new Date().toISOString();
    }
  }
  if (input.status !== undefined) patch.status = input.status;

  const { data, error } = await supabase
    .from("classroom_students")
    .update(patch)
    .eq("id", rowId)
    .select("*")
    .single();

  if (error) return { data: null, error: toError(error) };
  return { data: mapClassroomStudent(data), error: null };
}

// --- Assignments ---

export async function getClassroomAssignments(
  classroomId: string
): Promise<ClassroomResult<Assignment[]>> {
  if (!supabase) return notConfigured();
  const { data, error } = await supabase
    .from("assignments")
    .select("*, classrooms(name)")
    .eq("classroom_id", classroomId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: toError(error) };
  return {
    data: (data ?? []).map((row) => mapAssignment(row as Record<string, unknown>)),
    error: null,
  };
}

export async function getTeacherAssignments(): Promise<
  ClassroomResult<Assignment[]>
> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: [], error: null };

  const { data: classrooms, error: classError } = await supabase
    .from("classrooms")
    .select("id");

  if (classError) return { data: null, error: toError(classError) };
  const ids = (classrooms ?? []).map((c) => String(c.id));
  if (ids.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from("assignments")
    .select("*, classrooms(name, organization_id, organizations(name))")
    .in("classroom_id", ids)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: toError(error) };
  return {
    data: (data ?? []).map((row) => mapAssignmentFromRow(row as Record<string, unknown>)),
    error: null,
  };
}

export async function getAssignmentById(
  assignmentId: string
): Promise<ClassroomResult<Assignment | null>> {
  if (!supabase) return notConfigured();
  const { data, error } = await supabase
    .from("assignments")
    .select("*, classrooms(name, teacher_user_id)")
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) return { data: null, error: toError(error) };
  if (!data) return { data: null, error: null };
  return {
    data: mapAssignment(data as Record<string, unknown>),
    error: null,
  };
}

export type CreateAssignmentInput = {
  classroomId: string;
  /**
   * Хичээлийн ID. Хичээл хавсраагүй (багшийн өөрийн) даалгаварт null өгнө —
   * 058-аас хойш assignments.lesson_id нь NULL байж болно.
   */
  lessonId: string | null;
  assignmentType: string;
  title: string;
  instructions?: string;
  dueDate?: string;
  status?: string;
  /**
   * Зорилтот сурагч. null/undefined бол ангид бүхэлд нь өгнө.
   *
   * Утга өгвөл assignments.target_student_user_id багана руу бичигдэж, RLS нь
   * тухайн мөрийг ангийн бусад сурагчаас НУУНА. Сурагчийн нэрийг instructions
   * дотор бүү бич — өмнө нь тэгснээс болж нэр задардаг байсан.
   */
  targetStudentUserId?: string | null;
  /** assignment_results мөрүүдэд бичих нэмэлт мэдээлэл. */
  resultMetadata?: Record<string, unknown>;
  /** Заавал биш хавсралт — даалгавар үүссэний дараа байршуулна. */
  attachment?: File | null;
};

export async function createAssignment(
  input: CreateAssignmentInput
): Promise<ClassroomResult<Assignment>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  if (input.attachment) {
    const invalid = validateAssignmentAttachment(input.attachment);
    if (invalid) return { data: null, error: invalid };
  }

  const { data: classroom, error: classLookupError } = await supabase
    .from("classrooms")
    .select("organization_id")
    .eq("id", input.classroomId)
    .maybeSingle();

  if (classLookupError) {
    return { data: null, error: toError(classLookupError) };
  }
  if (!classroom) {
    return { data: null, error: "Classroom not found." };
  }

  const organizationId = classroom.organization_id
    ? String(classroom.organization_id)
    : null;

  const targetStudentUserId = input.targetStudentUserId?.trim() || null;

  const { data, error } = await supabase
    .from("assignments")
    .insert({
      classroom_id: input.classroomId,
      // Хиймэл 'custom' утгыг дахин бичихгүй — хоосон бол NULL.
      lesson_id:
        input.lessonId && input.lessonId !== CUSTOM_ASSIGNMENT_LESSON_ID
          ? input.lessonId
          : null,
      assignment_type: input.assignmentType,
      title: input.title.trim(),
      instructions: input.instructions?.trim() || null,
      due_date: input.dueDate || null,
      status: input.status ?? "assigned",
      organization_id: organizationId,
      created_by: userId,
      target_student_user_id: targetStudentUserId,
    })
    .select("*, classrooms(name, organization_id)")
    .single();

  if (error) return { data: null, error: toError(error) };
  let assignment = mapAssignmentFromRow(data as Record<string, unknown>);

  const { data: students } = await supabase
    .from("classroom_students")
    .select("student_user_id")
    .eq("classroom_id", input.classroomId)
    .not("student_user_id", "is", null);

  const classStudentIds = (students ?? [])
    .map((s) => s.student_user_id)
    .filter(Boolean) as string[];

  // Онилсон даалгавар ч ангид харьяалагдана, гэхдээ ажиллах мөр нь зөвхөн
  // зорилтот сурагчид үүснэ.
  const seedFor = targetStudentUserId
    ? classStudentIds.filter((id) => id === targetStudentUserId)
    : classStudentIds;

  if (seedFor.length > 0) {
    await supabase.from("assignment_results").insert(
      seedFor.map((sid) => ({
        assignment_id: assignment.id,
        student_user_id: sid,
        status: "not_started",
        metadata: input.resultMetadata ?? {},
      }))
    );
  }

  if (input.attachment) {
    const uploaded = await uploadAssignmentAttachment({
      classroomId: input.classroomId,
      assignmentId: assignment.id,
      file: input.attachment,
    });
    if (uploaded.error) {
      // Даалгавар аль хэдийн үүссэн тул алдааг нуухгүй, гэхдээ даалгаврыг
      // буцаана — багш хавсралтыг дараа нь дахин оруулж болно.
      return { data: assignment, error: uploaded.error };
    }
    if (uploaded.data) {
      assignment = { ...assignment, attachment: uploaded.data };
    }
  }

  return { data: assignment, error: null };
}

export async function updateAssignment(
  assignmentId: string,
  input: {
    title?: string;
    instructions?: string;
    dueDate?: string | null;
    status?: string;
    assignmentType?: string;
  }
): Promise<ClassroomResult<Assignment>> {
  if (!supabase) return notConfigured();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.instructions !== undefined)
    patch.instructions = input.instructions.trim() || null;
  if (input.dueDate !== undefined) patch.due_date = input.dueDate;
  if (input.status !== undefined) patch.status = input.status;
  if (input.assignmentType !== undefined)
    patch.assignment_type = input.assignmentType;

  const { data, error } = await supabase
    .from("assignments")
    .update(patch)
    .eq("id", assignmentId)
    .select("*, classrooms(name)")
    .single();

  if (error) return { data: null, error: toError(error) };
  return { data: mapAssignment(data as Record<string, unknown>), error: null };
}

export async function deleteAssignment(
  assignmentId: string
): Promise<ClassroomResult<null>> {
  if (!supabase) return notConfigured();
  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", assignmentId);
  if (error) return { data: null, error: toError(error) };
  return { data: null, error: null };
}

// --- Assignment attachments ---
//
// Тусдаа uploader бичээгүй: lib/supabase/media-upload.ts нь зөвхөн админд
// зориулагдсан (lesson-media bucket хатуу бичигдсэн, isCurrentUserAdmin()
// шалгалттай) тул багшийн урсгалд тохирохгүй. Доорх функцууд түүнтэй ижил
// хэв маягийг (шалгалт → зам → upload) дагасан боловч багшийн bucket-тэй
// ажиллана.

export const ASSIGNMENT_ATTACHMENTS_BUCKET = "assignment-attachments";

/** Хавсралтын дээд хэмжээ. UI дээр мөн энэ тоог харуулна. */
export const ASSIGNMENT_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

/** Зөвшөөрөгдсөн өргөтгөлүүд. */
export const ASSIGNMENT_ATTACHMENT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "mp3",
  "m4a",
  "txt",
] as const;

/** Татаж авах холбоосын хүчинтэй хугацаа (секунд). */
const ASSIGNMENT_ATTACHMENT_SIGNED_URL_SECONDS = 10 * 60;

function attachmentExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1]! : "";
}

export function formatAttachmentSize(bytes: number | null): string {
  if (bytes == null || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** input[accept] утга. */
export function assignmentAttachmentAcceptAttribute(): string {
  return ASSIGNMENT_ATTACHMENT_EXTENSIONS.map((ext) => `.${ext}`).join(",");
}

/** Багшид харуулах хязгаарын тайлбар. */
export function assignmentAttachmentHint(): string {
  return `${ASSIGNMENT_ATTACHMENT_EXTENSIONS.join(", ")} · дээд тал нь ${Math.round(
    ASSIGNMENT_ATTACHMENT_MAX_BYTES / (1024 * 1024)
  )}MB`;
}

/** Алдаа байвал монголоор тайлбарлана, зөв бол null. */
export function validateAssignmentAttachment(file: File): string | null {
  const ext = attachmentExtension(file.name);
  if (!ext || !ASSIGNMENT_ATTACHMENT_EXTENSIONS.includes(ext as never)) {
    return `Зөвшөөрөгдөх файлын төрөл: ${ASSIGNMENT_ATTACHMENT_EXTENSIONS.join(", ")}.`;
  }
  if (file.size <= 0) {
    return "Файл хоосон байна.";
  }
  if (file.size > ASSIGNMENT_ATTACHMENT_MAX_BYTES) {
    return `Файл хэтэрхий том байна. Дээд хэмжээ ${Math.round(
      ASSIGNMENT_ATTACHMENT_MAX_BYTES / (1024 * 1024)
    )}MB.`;
  }
  return null;
}

/**
 * Storage доторх зам. Storage RLS нь эхний хоёр хэсгээр
 * (classrooms/{classroomId}) багшийн эрхийг шалгадаг тул бүтцийг бүү өөрчил.
 */
export function getAssignmentAttachmentPath(
  classroomId: string,
  assignmentId: string,
  file: File
): string {
  const safeName =
    file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 80) || "attachment";
  return `classrooms/${classroomId}/assignments/${assignmentId}/${Date.now()}-${safeName}`;
}

export async function uploadAssignmentAttachment(input: {
  classroomId: string;
  assignmentId: string;
  file: File;
}): Promise<ClassroomResult<AssignmentAttachment>> {
  if (!supabase || !hasSupabaseConfig) return notConfigured();

  const invalid = validateAssignmentAttachment(input.file);
  if (invalid) return { data: null, error: invalid };

  const path = getAssignmentAttachmentPath(
    input.classroomId,
    input.assignmentId,
    input.file
  );

  const { error: uploadError } = await supabase.storage
    .from(ASSIGNMENT_ATTACHMENTS_BUCKET)
    .upload(path, input.file, {
      cacheControl: "3600",
      upsert: false,
      contentType: input.file.type || undefined,
    });

  if (uploadError) {
    return { data: null, error: uploadError.message };
  }

  const attachment: AssignmentAttachment = {
    path,
    name: input.file.name,
    sizeBytes: input.file.size,
    mimeType: input.file.type || null,
  };

  const { error: updateError } = await supabase
    .from("assignments")
    .update({
      attachment_path: attachment.path,
      attachment_name: attachment.name,
      attachment_size_bytes: attachment.sizeBytes,
      attachment_mime_type: attachment.mimeType,
    })
    .eq("id", input.assignmentId);

  if (updateError) {
    // Мөр шинэчлэгдээгүй бол файл нь ямар ч даалгавартай холбогдоогүй үлдэнэ —
    // сурагч уншиж чадахгүй тул устгаад алдааг буцаана.
    await supabase.storage
      .from(ASSIGNMENT_ATTACHMENTS_BUCKET)
      .remove([attachment.path]);
    return { data: null, error: toError(updateError) };
  }

  return { data: attachment, error: null };
}

export async function removeAssignmentAttachment(
  assignmentId: string,
  path: string
): Promise<ClassroomResult<null>> {
  if (!supabase) return notConfigured();

  const { error: updateError } = await supabase
    .from("assignments")
    .update({
      attachment_path: null,
      attachment_name: null,
      attachment_size_bytes: null,
      attachment_mime_type: null,
    })
    .eq("id", assignmentId);

  if (updateError) return { data: null, error: toError(updateError) };

  const { error: removeError } = await supabase.storage
    .from(ASSIGNMENT_ATTACHMENTS_BUCKET)
    .remove([path]);

  if (removeError) return { data: null, error: removeError.message };
  return { data: null, error: null };
}

/**
 * Хавсралтыг татах хугацаатай холбоос. Bucket нь private тул ил URL байхгүй —
 * эрхгүй хүн зам нь мэдэгдсэн ч татаж чадахгүй.
 */
export async function getAssignmentAttachmentUrl(
  path: string
): Promise<ClassroomResult<string>> {
  if (!supabase) return notConfigured();

  const { data, error } = await supabase.storage
    .from(ASSIGNMENT_ATTACHMENTS_BUCKET)
    .createSignedUrl(path, ASSIGNMENT_ATTACHMENT_SIGNED_URL_SECONDS);

  if (error) return { data: null, error: error.message };
  if (!data?.signedUrl) {
    return { data: null, error: "Татах холбоос үүсгэж чадсангүй." };
  }
  return { data: data.signedUrl, error: null };
}

export async function getStudentAssignments(): Promise<
  ClassroomResult<StudentAssignment[]>
> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: [], error: null };

  const { data: enrollments, error: enrollError } = await supabase
    .from("classroom_students")
    .select("classroom_id")
    .eq("student_user_id", userId);

  if (enrollError) return { data: null, error: toError(enrollError) };
  const classroomIds = (enrollments ?? []).map((e) => String(e.classroom_id));
  if (classroomIds.length === 0) return { data: [], error: null };

  const { data: assignments, error: assignError } = await supabase
    .from("assignments")
    .select("*, classrooms(name, organization_id, organizations(name), teacher_user_id)")
    .in("classroom_id", classroomIds)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (assignError) return { data: null, error: toError(assignError) };

  const assignmentIds = (assignments ?? []).map((a) => String(a.id));
  const resultsMap = new Map<string, AssignmentResult>();

  if (assignmentIds.length > 0) {
    const { data: results } = await supabase
      .from("assignment_results")
      .select("*")
      .in("assignment_id", assignmentIds)
      .eq("student_user_id", userId);

    for (const row of results ?? []) {
      const mapped = mapAssignmentResult(row);
      resultsMap.set(mapped.assignmentId, mapped);
    }
  }

  const merged: StudentAssignment[] = (assignments ?? []).map((row) => {
    const a = mapAssignmentFromRow(row as Record<string, unknown>);
    const classrooms = row.classrooms as Record<string, unknown> | null;
    const orgs = classrooms?.organizations as { name?: string } | null;
    const result = resultsMap.get(a.id);
    return {
      ...a,
      organizationName: orgs?.name ?? null,
      resultStatus: result?.status ?? null,
      resultId: result?.id ?? null,
      quizPercentage: result?.quizPercentage ?? null,
      quizScore: result?.quizScore ?? null,
      quizTotal: result?.quizTotal ?? null,
      completedAt: result?.completedAt ?? null,
      teacherLabel: classrooms?.teacher_user_id ? "Ангийн багш" : null,
    };
  });

  return { data: merged, error: null };
}

// --- Assignment results ---

export async function getAssignmentResults(
  assignmentId: string
): Promise<ClassroomResult<AssignmentResult[]>> {
  if (!supabase) return notConfigured();
  const { data, error } = await supabase
    .from("assignment_results")
    .select("*")
    .eq("assignment_id", assignmentId)
    .order("updated_at", { ascending: false });

  if (error) return { data: null, error: toError(error) };
  return { data: (data ?? []).map(mapAssignmentResult), error: null };
}

export async function upsertAssignmentResult(input: {
  assignmentId: string;
  studentUserId: string;
  status?: string;
  completedAt?: string;
  quizScore?: number;
  quizTotal?: number;
  quizPercentage?: number;
  metadata?: Record<string, unknown>;
}): Promise<ClassroomResult<AssignmentResult>> {
  if (!supabase) return notConfigured();

  const { data: existing } = await supabase
    .from("assignment_results")
    .select("id")
    .eq("assignment_id", input.assignmentId)
    .eq("student_user_id", input.studentUserId)
    .maybeSingle();

  const payload = {
    assignment_id: input.assignmentId,
    student_user_id: input.studentUserId,
    status: input.status ?? "completed",
    completed_at: input.completedAt ?? new Date().toISOString(),
    quiz_score: input.quizScore ?? null,
    quiz_total: input.quizTotal ?? null,
    quiz_percentage: input.quizPercentage ?? null,
    metadata: input.metadata ?? {},
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("assignment_results")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return { data: null, error: toError(error) };
    return { data: mapAssignmentResult(data), error: null };
  }

  const { data, error } = await supabase
    .from("assignment_results")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { data: null, error: toError(error) };
  return { data: mapAssignmentResult(data), error: null };
}

export async function getTeacherDashboardStats(): Promise<
  ClassroomResult<TeacherDashboardStats>
> {
  const empty: TeacherDashboardStats = {
    classroomCount: 0,
    studentCount: 0,
    assignmentCount: 0,
    activeClassrooms: [],
    recentAssignments: [],
  };

  const { data: classrooms, error: classError } = await getTeacherClassrooms();
  if (classError) return { data: null, error: classError };
  const list = classrooms ?? [];

  const { data: assignments, error: assignError } = await getTeacherAssignments();
  if (assignError) return { data: null, error: assignError };

  let studentCount = 0;
  for (const c of list) {
    studentCount += c.studentCount ?? 0;
  }

  return {
    data: {
      classroomCount: list.length,
      studentCount,
      assignmentCount: (assignments ?? []).length,
      activeClassrooms: list.filter((c) => c.status === "active").slice(0, 5),
      recentAssignments: (assignments ?? []).slice(0, 5),
    },
    error: null,
  };
}

// --- Ангийн код (migration 064) ---

/** Багш: ангийн кодыг шинээр үүсгэнэ. */
export async function regenerateClassroomJoinCode(
  classroomId: string
): Promise<ClassroomResult<string>> {
  if (!supabase) return notConfigured();
  const { data, error } = await supabase.rpc("regenerate_classroom_join_code", {
    p_classroom_id: classroomId,
  });
  if (error) return { data: null, error: toError(error) };
  return { data: String(data), error: null };
}

export type JoinByCodeResult = {
  classroomId: string;
  classroomName: string;
  alreadyMember: boolean;
};

/** Сурагч: 6 оронтой кодоор ангид нэгдэнэ (нэвтэрсэн байх). */
export async function joinClassroomByCode(
  code: string,
  displayName?: string | null
): Promise<ClassroomResult<JoinByCodeResult>> {
  if (!supabase) return notConfigured();
  const clean = code.replace(/\D/g, "");
  if (clean.length !== 6) return { data: null, error: "Код 6 оронтой байх ёстой." };
  const { data, error } = await supabase.rpc("join_classroom_by_code", {
    p_code: clean,
    p_display_name: displayName?.trim() || null,
  });
  if (error) {
    const msg = error.message.includes("invalid code")
      ? "Ийм кодтой анги олдсонгүй."
      : error.message.includes("not signed in")
        ? "Эхлээд нэвтэрнэ үү."
        : error.message;
    return { data: null, error: msg };
  }
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
  if (!row) return { data: null, error: "Ийм кодтой анги олдсонгүй." };
  return {
    data: {
      classroomId: String(row.out_classroom_id),
      classroomName: String(row.out_classroom_name),
      alreadyMember: Boolean(row.out_already_member),
    },
    error: null,
  };
}

/** Кодыг шалгаад ангийн нэрийг харуулна (нэвтрээгүй ч болно). */
export async function peekClassroomByCode(
  code: string
): Promise<{ classroomName: string; organizationName: string | null } | null> {
  if (!supabase) return null;
  const clean = code.replace(/\D/g, "");
  if (clean.length !== 6) return null;
  const { data, error } = await supabase.rpc("peek_classroom_by_code", { p_code: clean });
  if (error) return null;
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
  if (!row?.out_classroom_name) return null;
  return {
    classroomName: String(row.out_classroom_name),
    organizationName: row.out_organization_name ? String(row.out_organization_name) : null,
  };
}

const PENDING_CLASS_CODE_KEY = "buunduu-pending-class-code-v1";

/** Бүртгүүлэхдээ код оруулсан ч имэйл баталгаажуулалт хүлээж байгаа үед хадгална. */
export function setPendingClassCode(code: string | null): void {
  try {
    if (code) localStorage.setItem(PENDING_CLASS_CODE_KEY, code.replace(/\D/g, ""));
    else localStorage.removeItem(PENDING_CLASS_CODE_KEY);
  } catch {
    // ignore
  }
}

export function getPendingClassCode(): string | null {
  try {
    const v = localStorage.getItem(PENDING_CLASS_CODE_KEY);
    return v && v.length === 6 ? v : null;
  } catch {
    return null;
  }
}
