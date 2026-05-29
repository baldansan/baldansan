import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import type {
  OnboardingStatus,
  OnboardingTaskStatus,
  OrganizationOnboarding,
  OrganizationOnboardingTask,
  OrganizationPilotSummary,
  PilotReadiness,
  PilotStage,
} from "@/lib/b2b/types";
import {
  getOrganizationAssignments,
  getOrganizationById,
  getOrganizationClassrooms,
  getOrganizationMembers,
} from "@/lib/supabase/organizations";

export type OnboardingResult<T> = { data: T | null; error: string | null };

function notConfigured<T>(): OnboardingResult<T> {
  return { data: null, error: "Supabase is not configured." };
}

export const DEFAULT_ONBOARDING_TASKS: Array<{
  taskKey: string;
  title: string;
  description: string;
  category: string;
}> = [
  {
    taskKey: "organization_profile_complete",
    title: "Байгууллагын мэдээлэл бөглөх",
    description: "Organization name, type, contact email/phone.",
    category: "setup",
  },
  {
    taskKey: "add_owner_or_manager",
    title: "Owner/manager эрхтэй хэрэглэгч баталгаажуулах",
    description: "At least one owner or manager member.",
    category: "team",
  },
  {
    taskKey: "add_first_teacher",
    title: "Эхний багшийг нэмэх",
    description: "Add a teacher to the organization team.",
    category: "team",
  },
  {
    taskKey: "create_first_classroom",
    title: "Эхний classroom үүсгэх",
    description: "Create an organization classroom.",
    category: "classroom",
  },
  {
    taskKey: "add_demo_students",
    title: "Demo сурагчид нэмэх",
    description: "Add students to the classroom.",
    category: "students",
  },
  {
    taskKey: "create_first_assignment",
    title: "Эхний assignment үүсгэх",
    description: "Assign a lesson to the classroom.",
    category: "assignment",
  },
  {
    taskKey: "test_student_assignment",
    title: "Сурагчийн assignment flow шалгах",
    description: "Student opens /my-assignments and completes quiz.",
    category: "pilot",
  },
  {
    taskKey: "review_teacher_report",
    title: "Багшийн report шалгах",
    description: "Review class or organization reports.",
    category: "pilot",
  },
  {
    taskKey: "export_pilot_plan",
    title: "Pilot plan export хийх",
    description: "Copy or download pilot plan markdown/JSON.",
    category: "pilot",
  },
  {
    taskKey: "mark_ready_for_pilot",
    title: "Pilot эхлүүлэхэд бэлэн гэж тэмдэглэх",
    description: "Confirm readiness and start pilot.",
    category: "pilot",
  },
];

const KEY_TASKS = [
  "organization_profile_complete",
  "add_owner_or_manager",
  "add_first_teacher",
  "create_first_classroom",
  "add_demo_students",
  "create_first_assignment",
  "mark_ready_for_pilot",
];

function mapOnboarding(row: Record<string, unknown>): OrganizationOnboarding {
  return {
    organizationId: String(row.organization_id),
    onboardingStatus: String(row.onboarding_status ?? "not_started") as OnboardingStatus,
    pilotStage: String(row.pilot_stage ?? "inquiry") as PilotStage,
    targetStartDate: row.target_start_date ? String(row.target_start_date) : null,
    targetStudentCount:
      row.target_student_count != null ? Number(row.target_student_count) : null,
    pilotGoal: row.pilot_goal ? String(row.pilot_goal) : null,
    onboardingNote: row.onboarding_note ? String(row.onboarding_note) : null,
    completedSteps: (row.completed_steps as Record<string, boolean>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapTask(row: Record<string, unknown>): OrganizationOnboardingTask {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    taskKey: String(row.task_key),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    category: String(row.category ?? "setup"),
    status: String(row.status ?? "open") as OnboardingTaskStatus,
    dueDate: row.due_date ? String(row.due_date) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    completedBy: row.completed_by ? String(row.completed_by) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getOrganizationOnboarding(
  organizationId: string
): Promise<OnboardingResult<OrganizationOnboarding | null>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("organization_onboarding")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: mapOnboarding(data as Record<string, unknown>), error: null };
}

export type UpsertOrganizationOnboardingInput = {
  onboardingStatus?: OnboardingStatus;
  pilotStage?: PilotStage;
  targetStartDate?: string | null;
  targetStudentCount?: number | null;
  pilotGoal?: string | null;
  onboardingNote?: string | null;
  completedSteps?: Record<string, boolean>;
};

export async function upsertOrganizationOnboarding(
  organizationId: string,
  input: UpsertOrganizationOnboardingInput
): Promise<OnboardingResult<OrganizationOnboarding>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const payload: Record<string, unknown> = {
    organization_id: organizationId,
  };
  if (input.onboardingStatus != null) {
    payload.onboarding_status = input.onboardingStatus;
  }
  if (input.pilotStage != null) payload.pilot_stage = input.pilotStage;
  if (input.targetStartDate !== undefined) {
    payload.target_start_date = input.targetStartDate || null;
  }
  if (input.targetStudentCount !== undefined) {
    payload.target_student_count = input.targetStudentCount;
  }
  if (input.pilotGoal !== undefined) payload.pilot_goal = input.pilotGoal || null;
  if (input.onboardingNote !== undefined) {
    payload.onboarding_note = input.onboardingNote || null;
  }
  if (input.completedSteps != null) payload.completed_steps = input.completedSteps;

  const { data, error } = await supabase
    .from("organization_onboarding")
    .upsert(payload, { onConflict: "organization_id" })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapOnboarding(data as Record<string, unknown>), error: null };
}

export async function initializeOrganizationOnboarding(
  organizationId: string,
  options?: { pilotStage?: PilotStage; onboardingStatus?: OnboardingStatus }
): Promise<OnboardingResult<OrganizationOnboarding>> {
  const upsertRes = await upsertOrganizationOnboarding(organizationId, {
    onboardingStatus: options?.onboardingStatus ?? "in_progress",
    pilotStage: options?.pilotStage ?? "organization_setup",
  });
  if (upsertRes.error || !upsertRes.data) return upsertRes;

  const seedRes = await seedDefaultOnboardingTasks(organizationId);
  if (seedRes.error) return { data: upsertRes.data, error: seedRes.error };
  return upsertRes;
}

export async function getOrganizationOnboardingTasks(
  organizationId: string
): Promise<OnboardingResult<OrganizationOnboardingTask[]>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("organization_onboarding_tasks")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) return { data: null, error: error.message };
  return {
    data: (data ?? []).map((row) => mapTask(row as Record<string, unknown>)),
    error: null,
  };
}

export async function seedDefaultOnboardingTasks(
  organizationId: string
): Promise<OnboardingResult<OrganizationOnboardingTask[]>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const rows = DEFAULT_ONBOARDING_TASKS.map((t) => ({
    organization_id: organizationId,
    task_key: t.taskKey,
    title: t.title,
    description: t.description,
    category: t.category,
    status: "open",
  }));

  const { data, error } = await supabase
    .from("organization_onboarding_tasks")
    .upsert(rows, { onConflict: "organization_id,task_key", ignoreDuplicates: true })
    .select("*");

  if (error) return { data: null, error: error.message };

  return getOrganizationOnboardingTasks(organizationId);
}

export async function updateOnboardingTaskStatus(
  taskId: string,
  status: OnboardingTaskStatus
): Promise<OnboardingResult<OrganizationOnboardingTask>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { userId } = await getAuthenticatedUserId();
  const payload: Record<string, unknown> = { status };
  if (status === "completed") {
    payload.completed_at = new Date().toISOString();
    payload.completed_by = userId;
  } else if (status === "open" || status === "in_progress") {
    payload.completed_at = null;
    payload.completed_by = null;
  }

  const { data, error } = await supabase
    .from("organization_onboarding_tasks")
    .update(payload)
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapTask(data as Record<string, unknown>), error: null };
}

export async function updateOnboardingStep(
  organizationId: string,
  stepKey: string,
  completed: boolean
): Promise<OnboardingResult<OrganizationOnboarding>> {
  const current = await getOrganizationOnboarding(organizationId);
  const steps = { ...(current.data?.completedSteps ?? {}), [stepKey]: completed };
  return upsertOrganizationOnboarding(organizationId, { completedSteps: steps });
}

async function countClassroomStudents(classroomIds: string[]): Promise<number> {
  if (!supabase || classroomIds.length === 0) return 0;
  const { count, error } = await supabase
    .from("classroom_students")
    .select("*", { count: "exact", head: true })
    .in("classroom_id", classroomIds);
  if (error) return 0;
  return count ?? 0;
}

export async function calculatePilotReadiness(
  organizationId: string
): Promise<OnboardingResult<PilotReadiness>> {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const [orgRes, membersRes, classroomsRes, assignmentsRes, onboardingRes, tasksRes] =
    await Promise.all([
      getOrganizationById(organizationId),
      getOrganizationMembers(organizationId),
      getOrganizationClassrooms(organizationId),
      getOrganizationAssignments(organizationId),
      getOrganizationOnboarding(organizationId),
      getOrganizationOnboardingTasks(organizationId),
    ]);

  if (orgRes.error || !orgRes.data) {
    return { data: null, error: orgRes.error ?? "Organization not found." };
  }

  const org = orgRes.data;
  const members = membersRes.data ?? [];
  const classrooms = classroomsRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];
  const onboarding = onboardingRes.data;
  const tasks = tasksRes.data ?? [];

  if (onboarding?.onboardingStatus === "paused") {
    blockers.push("Onboarding is paused.");
  }

  const ownersManagers = members.filter((m) =>
    ["owner", "manager"].includes(m.role)
  );
  if (ownersManagers.length === 0) {
    blockers.push("No owner or manager member.");
  }

  const teachers = members.filter((m) =>
    ["owner", "manager", "teacher"].includes(m.role)
  );
  if (teachers.length === 0) {
    blockers.push("No teacher on the team.");
  }

  if (classrooms.length === 0) {
    blockers.push("No organization classroom.");
  }

  const classroomIds = classrooms.map((c) => c.id);
  const studentRows = await countClassroomStudents(classroomIds);
  if (studentRows === 0) {
    blockers.push("No students in organization classrooms.");
  }

  if (assignments.length === 0) {
    blockers.push("No assignments created.");
  }

  if (!org.email && !org.phone) {
    warnings.push("Organization contact email or phone is missing.");
  }

  const pendingInvites = members.filter((m) => m.status === "invited").length;
  if (pendingInvites > 0) {
    warnings.push(`${pendingInvites} member invite(s) still pending.`);
  }

  const keyTasks = tasks.filter((t) => KEY_TASKS.includes(t.taskKey));
  const completedTasks = keyTasks.filter((t) => t.status === "completed");
  const totalCount = keyTasks.length || KEY_TASKS.length;
  const completedCount = completedTasks.length;

  for (const key of KEY_TASKS) {
    const task = tasks.find((t) => t.taskKey === key);
    if (task && task.status !== "completed" && task.status !== "skipped") {
      if (
        key === "organization_profile_complete" &&
        org.name &&
        (org.email || org.phone)
      ) {
        continue;
      }
      if (key === "add_owner_or_manager" && ownersManagers.length > 0) continue;
      if (key === "add_first_teacher" && teachers.length > 0) continue;
      if (key === "create_first_classroom" && classrooms.length > 0) continue;
      if (key === "add_demo_students" && studentRows > 0) continue;
      if (key === "create_first_assignment" && assignments.length > 0) continue;
      if (task) {
        warnings.push(`Task not completed: ${task.title}`);
      }
    }
  }

  const structuralScore =
    (org.name ? 10 : 0) +
    (ownersManagers.length > 0 ? 15 : 0) +
    (teachers.length > 0 ? 15 : 0) +
    (classrooms.length > 0 ? 20 : 0) +
    (studentRows > 0 ? 15 : 0) +
    (assignments.length > 0 ? 15 : 0) +
    (onboarding?.onboardingStatus === "ready_for_pilot" ? 10 : 0);

  const taskScore =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 10) : 0;
  const score = Math.min(100, structuralScore + taskScore);

  const ready =
    blockers.length === 0 &&
    ownersManagers.length > 0 &&
    teachers.length > 0 &&
    classrooms.length > 0 &&
    studentRows > 0 &&
    assignments.length > 0 &&
    (onboarding?.onboardingStatus === "ready_for_pilot" ||
      completedCount >= Math.ceil(totalCount * 0.7));

  return {
    data: {
      ready,
      score,
      completedCount,
      totalCount,
      blockers,
      warnings,
    },
    error: null,
  };
}

export async function getOrganizationPilotSummary(
  organizationId: string
): Promise<OnboardingResult<OrganizationPilotSummary>> {
  const [orgRes, onboardingRes, tasksRes, readinessRes] = await Promise.all([
    getOrganizationById(organizationId),
    getOrganizationOnboarding(organizationId),
    getOrganizationOnboardingTasks(organizationId),
    calculatePilotReadiness(organizationId),
  ]);

  if (orgRes.error || !orgRes.data) {
    return { data: null, error: orgRes.error ?? "Organization not found." };
  }
  if (readinessRes.error || !readinessRes.data) {
    return { data: null, error: readinessRes.error ?? "Could not calculate readiness." };
  }

  return {
    data: {
      organizationId,
      organizationName: orgRes.data.name,
      onboarding: onboardingRes.data,
      readiness: readinessRes.data,
      tasks: tasksRes.data ?? [],
    },
    error: null,
  };
}

export async function markOrganizationReadyForPilot(
  organizationId: string
): Promise<OnboardingResult<OrganizationOnboarding>> {
  const readiness = await calculatePilotReadiness(organizationId);
  if (readiness.error || !readiness.data) {
    return { data: null, error: readiness.error ?? "Readiness check failed." };
  }
  if (!readiness.data.ready && readiness.data.blockers.length > 0) {
    return {
      data: null,
      error: `Not ready: ${readiness.data.blockers.join(" ")}`,
    };
  }

  await updateOnboardingTaskStatusByKey(
    organizationId,
    "mark_ready_for_pilot",
    "completed"
  );

  return upsertOrganizationOnboarding(organizationId, {
    onboardingStatus: "ready_for_pilot",
    pilotStage: "pilot_ready",
  });
}

export async function markOnboardingTaskCompleteByKey(
  organizationId: string,
  taskKey: string
): Promise<void> {
  await updateOnboardingTaskStatusByKey(organizationId, taskKey, "completed");
}

async function updateOnboardingTaskStatusByKey(
  organizationId: string,
  taskKey: string,
  status: OnboardingTaskStatus
): Promise<void> {
  const tasksRes = await getOrganizationOnboardingTasks(organizationId);
  const task = (tasksRes.data ?? []).find((t) => t.taskKey === taskKey);
  if (task) await updateOnboardingTaskStatus(task.id, status);
}

export async function getOnboardingStatusCounts(): Promise<
  OnboardingResult<{
    notStarted: number;
    inProgress: number;
    readyForPilot: number;
    pilotRunning: number;
    paused: number;
  }>
> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("organization_onboarding")
    .select("onboarding_status");

  if (error) {
    if (error.message.includes("organization_onboarding")) {
      return {
        data: {
          notStarted: 0,
          inProgress: 0,
          readyForPilot: 0,
          pilotRunning: 0,
          paused: 0,
        },
        error: null,
      };
    }
    return { data: null, error: error.message };
  }

  const rows = data ?? [];
  const count = (status: string) =>
    rows.filter((r) => String(r.onboarding_status) === status).length;

  return {
    data: {
      notStarted: count("not_started"),
      inProgress: count("in_progress"),
      readyForPilot: count("ready_for_pilot"),
      pilotRunning: count("pilot_running"),
      paused: count("paused"),
    },
    error: null,
  };
}
