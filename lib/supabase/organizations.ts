import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import type {
  MyOrganization,
  Organization,
  OrganizationDashboardData,
  OrganizationMember,
  OrganizationMemberRole,
  OrganizationMemberStatus,
  OrganizationStatus,
  OrganizationType,
} from "@/lib/b2b/types";
import type { Assignment, Classroom } from "@/lib/classroom/types";

export type OrgResult<T> = { data: T | null; error: string | null };

function notConfigured<T>(): OrgResult<T> {
  return { data: null, error: "Supabase is not configured." };
}

function toError(error: { message: string } | null): string | null {
  return error?.message ?? null;
}

function mapOrganization(
  row: Record<string, unknown>,
  memberCount?: number
): Organization {
  return {
    id: String(row.id),
    name: String(row.name),
    organizationType: String(
      row.organization_type ?? "training_center"
    ) as OrganizationType,
    website: row.website ? String(row.website) : null,
    phone: row.phone ? String(row.phone) : null,
    email: row.email ? String(row.email) : null,
    address: row.address ? String(row.address) : null,
    notes: row.notes ? String(row.notes) : null,
    status: String(row.status ?? "lead") as OrganizationStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    memberCount,
  };
}

function mapMember(row: Record<string, unknown>): OrganizationMember {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    userId: row.user_id ? String(row.user_id) : null,
    email: row.email ? String(row.email) : null,
    displayName: row.display_name ? String(row.display_name) : null,
    role: String(row.role ?? "teacher") as OrganizationMemberRole,
    status: String(row.status ?? "invited") as OrganizationMemberStatus,
    permissions: (row.permissions as Record<string, unknown>) ?? {},
    joinedAt: row.joined_at ? String(row.joined_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export type CreateOrganizationInput = {
  name: string;
  organizationType?: OrganizationType;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  status?: OrganizationStatus;
};

export type UpdateOrganizationInput = Partial<CreateOrganizationInput>;

export type AddOrganizationMemberInput = {
  email?: string;
  displayName?: string;
  role?: OrganizationMemberRole;
  userId?: string;
  status?: OrganizationMemberStatus;
};

export async function getOrganizations(): Promise<OrgResult<Organization[]>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };

  const orgs = data ?? [];
  const ids = orgs.map((o) => String(o.id));

  const memberCounts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: members } = await supabase
      .from("organization_members")
      .select("organization_id")
      .in("organization_id", ids);
    for (const m of members ?? []) {
      const oid = String(m.organization_id);
      memberCounts.set(oid, (memberCounts.get(oid) ?? 0) + 1);
    }
  }

  return {
    data: orgs.map((row) =>
      mapOrganization(row as Record<string, unknown>, memberCounts.get(String(row.id)))
    ),
    error: null,
  };
}

export async function getOrganizationById(
  id: string
): Promise<OrgResult<Organization>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Organization not found." };

  const { count } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", id);

  return {
    data: mapOrganization(data as Record<string, unknown>, count ?? 0),
    error: null,
  };
}

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<OrgResult<Organization>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const name = input.name.trim();
  if (!name) return { data: null, error: "Organization name is required." };

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name,
      organization_type: input.organizationType ?? "training_center",
      website: input.website?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      status: input.status ?? "lead",
    })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapOrganization(data as Record<string, unknown>, 0), error: null };
}

export async function updateOrganization(
  id: string,
  input: UpdateOrganizationInput
): Promise<OrgResult<Organization>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const patch: Record<string, unknown> = {};
  if (input.name != null) patch.name = input.name.trim();
  if (input.organizationType != null) patch.organization_type = input.organizationType;
  if (input.website !== undefined) patch.website = input.website?.trim() || null;
  if (input.phone !== undefined) patch.phone = input.phone?.trim() || null;
  if (input.email !== undefined) patch.email = input.email?.trim() || null;
  if (input.address !== undefined) patch.address = input.address?.trim() || null;
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;
  if (input.status != null) patch.status = input.status;

  const { data, error } = await supabase
    .from("organizations")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapOrganization(data as Record<string, unknown>), error: null };
}

export async function getOrganizationMembers(
  organizationId: string
): Promise<OrgResult<OrganizationMember[]>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  return {
    data: (data ?? []).map((row) => mapMember(row as Record<string, unknown>)),
    error: toError(error),
  };
}

export async function addOrganizationMember(
  organizationId: string,
  input: AddOrganizationMemberInput
): Promise<OrgResult<OrganizationMember>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("organization_members")
    .insert({
      organization_id: organizationId,
      user_id: input.userId ?? null,
      email: input.email?.trim() || null,
      display_name: input.displayName?.trim() || null,
      role: input.role ?? "teacher",
      status: input.status ?? "invited",
    })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapMember(data as Record<string, unknown>), error: null };
}

export async function updateOrganizationMember(
  memberId: string,
  input: Partial<AddOrganizationMemberInput>
): Promise<OrgResult<OrganizationMember>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const patch: Record<string, unknown> = {};
  if (input.email !== undefined) patch.email = input.email?.trim() || null;
  if (input.displayName !== undefined) {
    patch.display_name = input.displayName?.trim() || null;
  }
  if (input.role != null) patch.role = input.role;
  if (input.userId !== undefined) patch.user_id = input.userId || null;
  if (input.status != null) patch.status = input.status;

  const { data, error } = await supabase
    .from("organization_members")
    .update(patch)
    .eq("id", memberId)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapMember(data as Record<string, unknown>), error: null };
}

export async function removeOrganizationMember(
  memberId: string
): Promise<OrgResult<null>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId);

  return { data: null, error: toError(error) };
}

export async function getMyOrganizations(): Promise<OrgResult<MyOrganization[]>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { userId } = await getAuthenticatedUserId();
  if (!userId) return { data: [], error: null };

  const { data: memberships, error: memberError } = await supabase
    .from("organization_members")
    .select("*, organizations(*)")
    .eq("user_id", userId);

  if (memberError) return { data: null, error: memberError.message };

  const rows: MyOrganization[] = (memberships ?? [])
    .map((row) => {
      const org = row.organizations as Record<string, unknown> | null;
      if (!org) return null;
      const base = mapOrganization(org);
      return {
        ...base,
        memberId: String(row.id),
        memberRole: String(row.role ?? "teacher") as OrganizationMemberRole,
        memberStatus: String(row.status ?? "invited") as OrganizationMemberStatus,
        permissions: (row.permissions as Record<string, unknown>) ?? {},
        joinedAt: row.joined_at ? String(row.joined_at) : null,
      };
    })
    .filter(Boolean) as MyOrganization[];

  return { data: rows, error: null };
}

export async function createOrganizationFromInquiry(input: {
  organizationName: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  organizationType?: string | null;
  notes?: string | null;
}): Promise<OrgResult<Organization>> {
  const orgRes = await createOrganization({
    name: input.organizationName,
    organizationType: (input.organizationType as OrganizationType) ?? "training_center",
    email: input.email ?? undefined,
    phone: input.phone ?? undefined,
    notes: input.notes ?? undefined,
    status: "lead",
  });

  if (orgRes.error || !orgRes.data) return orgRes;

  if (input.contactPerson || input.email) {
    await addOrganizationMember(orgRes.data.id, {
      displayName: input.contactPerson ?? undefined,
      email: input.email ?? undefined,
      role: "manager",
      status: "invited",
    });
  }

  const { initializeOrganizationOnboarding } = await import(
    "@/lib/supabase/organization-onboarding"
  );
  await initializeOrganizationOnboarding(orgRes.data.id, {
    pilotStage: "organization_setup",
    onboardingStatus: "in_progress",
  });

  return orgRes;
}

export async function getMyOrganizationsWithRole(): Promise<
  OrgResult<MyOrganization[]>
> {
  return getMyOrganizations();
}

export async function getOrganizationTeachers(
  organizationId: string
): Promise<OrgResult<OrganizationMember[]>> {
  const res = await getOrganizationMembers(organizationId);
  if (res.error || !res.data) return res;
  return {
    data: res.data.filter((m) =>
      ["owner", "manager", "teacher", "assistant"].includes(m.role)
    ),
    error: null,
  };
}

export async function getOrganizationStudents(
  organizationId: string
): Promise<OrgResult<OrganizationMember[]>> {
  const res = await getOrganizationMembers(organizationId);
  if (res.error || !res.data) return res;
  return {
    data: res.data.filter((m) => m.role === "student"),
    error: null,
  };
}

export async function getOrganizationClassrooms(
  organizationId: string
): Promise<OrgResult<Classroom[]>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("classrooms")
    .select("*, organizations(name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };

  const { mapClassroomFromRow, attachClassroomCounts } = await import(
    "@/lib/supabase/classrooms"
  );
  const mapped = (data ?? []).map((row) =>
    mapClassroomFromRow(row as Record<string, unknown>)
  );
  const withCounts = await attachClassroomCounts(mapped);
  return { data: withCounts, error: null };
}

export async function getOrganizationAssignments(
  organizationId: string
): Promise<OrgResult<Assignment[]>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("assignments")
    .select("*, classrooms(name, organization_id)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };

  const { mapAssignmentFromRow } = await import("@/lib/supabase/classrooms");
  return {
    data: (data ?? []).map((row) =>
      mapAssignmentFromRow(row as Record<string, unknown>)
    ),
    error: null,
  };
}

export async function getOrganizationDashboardData(
  organizationId: string
): Promise<OrgResult<OrganizationDashboardData>> {
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const [orgRes, membersRes, classroomsRes, assignmentsRes, myOrgsRes] =
    await Promise.all([
      getOrganizationById(organizationId),
      getOrganizationMembers(organizationId),
      getOrganizationClassrooms(organizationId),
      getOrganizationAssignments(organizationId),
      getMyOrganizationsWithRole(),
    ]);

  if (orgRes.error || !orgRes.data) {
    return { data: null, error: orgRes.error ?? "Organization not found." };
  }

  const myMembership = (myOrgsRes.data ?? []).find((o) => o.id === organizationId);
  if (!myMembership) {
    const { data: adminCheck } = await supabase!
      .from("organizations")
      .select("id")
      .eq("id", organizationId)
      .maybeSingle();
    if (!adminCheck) {
      return { data: null, error: "You do not have access to this organization." };
    }
  }

  const members = membersRes.data ?? [];
  const classrooms = classroomsRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];

  let studentCount = 0;
  for (const c of classrooms) {
    studentCount += c.studentCount ?? 0;
  }

  return {
    data: {
      organization: orgRes.data,
      membership: myMembership
        ? {
            memberId: myMembership.memberId,
            memberRole: myMembership.memberRole,
            memberStatus: myMembership.memberStatus,
            permissions: myMembership.permissions ?? {},
            joinedAt: myMembership.joinedAt ?? null,
          }
        : {
            memberId: "admin",
            memberRole: "owner",
            memberStatus: "active",
            permissions: {},
            joinedAt: null,
          },
      teacherCount: members.filter((m) =>
        ["owner", "manager", "teacher"].includes(m.role)
      ).length,
      classroomCount: classrooms.length,
      studentCount,
      assignmentCount: assignments.length,
      members,
      classrooms,
      assignments,
    },
    error: null,
  };
}

export async function inviteOrganizationMember(
  organizationId: string,
  input: AddOrganizationMemberInput
): Promise<OrgResult<OrganizationMember>> {
  return addOrganizationMember(organizationId, {
    ...input,
    status: input.status ?? "invited",
  });
}

export type BulkMemberImportRow = {
  rowIndex?: number;
  email?: string | null;
  displayName?: string | null;
  role?: OrganizationMemberRole;
  status?: OrganizationMemberStatus;
  userId?: string | null;
};

export type BulkMemberImportResult = {
  inserted: number;
  skipped: number;
  errors: string[];
  rows: Array<{
    rowIndex?: number;
    email?: string | null;
    displayName?: string | null;
    status: "inserted" | "skipped" | "error";
    message?: string;
    memberId?: string;
  }>;
};

export async function bulkAddOrganizationMembers(
  organizationId: string,
  rows: BulkMemberImportRow[]
): Promise<OrgResult<BulkMemberImportResult>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const existingRes = await getOrganizationMembers(organizationId);
  if (existingRes.error) {
    return { data: null, error: existingRes.error };
  }

  const existingEmails = new Set(
    (existingRes.data ?? [])
      .map((m) => m.email?.trim().toLowerCase())
      .filter(Boolean) as string[]
  );
  const existingUserIds = new Set(
    (existingRes.data ?? [])
      .map((m) => m.userId)
      .filter(Boolean) as string[]
  );

  const result: BulkMemberImportResult = {
    inserted: 0,
    skipped: 0,
    errors: [],
    rows: [],
  };

  for (const row of rows) {
    const email = row.email?.trim().toLowerCase() || null;
    const displayName = row.displayName?.trim() || null;
    const userId = row.userId?.trim() || null;

    if (email && existingEmails.has(email)) {
      result.skipped += 1;
      result.rows.push({
        rowIndex: row.rowIndex,
        email,
        displayName,
        status: "skipped",
        message: "Member with this email already exists.",
      });
      continue;
    }

    if (userId && existingUserIds.has(userId)) {
      result.skipped += 1;
      result.rows.push({
        rowIndex: row.rowIndex,
        email,
        displayName,
        status: "skipped",
        message: "Member with this user_id already exists.",
      });
      continue;
    }

    const insertRes = await addOrganizationMember(organizationId, {
      email: email ?? undefined,
      displayName: displayName ?? undefined,
      role: row.role ?? "teacher",
      status: (row.status as OrganizationMemberStatus) ?? "invited",
      userId: userId ?? undefined,
    });

    if (insertRes.error) {
      result.errors.push(
        `Row ${row.rowIndex ?? "?"}: ${insertRes.error}`
      );
      result.rows.push({
        rowIndex: row.rowIndex,
        email,
        displayName,
        status: "error",
        message: insertRes.error,
      });
      continue;
    }

    result.inserted += 1;
    if (email) existingEmails.add(email);
    if (userId) existingUserIds.add(userId);
    result.rows.push({
      rowIndex: row.rowIndex,
      email,
      displayName,
      status: "inserted",
      memberId: insertRes.data?.id,
    });
  }

  if (result.inserted > 0) {
    const { markOnboardingTaskCompleteByKey } = await import(
      "@/lib/supabase/organization-onboarding"
    );
    await markOnboardingTaskCompleteByKey(organizationId, "add_first_teacher");
  }

  return { data: result, error: null };
}

export async function updateOrganizationMemberRole(
  memberId: string,
  role: OrganizationMemberRole
): Promise<OrgResult<OrganizationMember>> {
  return updateOrganizationMember(memberId, { role });
}

export async function getMyMembershipForOrganization(
  organizationId: string
): Promise<OrgResult<MyOrganization | null>> {
  const res = await getMyOrganizationsWithRole();
  if (res.error) return { data: null, error: res.error };
  const found = (res.data ?? []).find((o) => o.id === organizationId) ?? null;
  return { data: found, error: null };
}
