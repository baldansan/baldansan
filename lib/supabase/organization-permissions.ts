import type {
  MyOrganization,
  OrganizationMember,
  OrganizationMemberRole,
} from "@/lib/b2b/types";

export type OrganizationMembership = OrganizationMember & {
  organizationName?: string;
};

const ROLE_LABELS: Record<OrganizationMemberRole, string> = {
  owner: "Эзэмшигч",
  manager: "Менежер",
  teacher: "Багш",
  assistant: "Туслах",
  student: "Сурагч",
};

export function getOrganizationRoleLabel(role: OrganizationMemberRole): string {
  return ROLE_LABELS[role] ?? role;
}

export function isOrgOwner(membership: Pick<OrganizationMembership, "role">): boolean {
  return membership.role === "owner";
}

export function isOrgManager(membership: Pick<OrganizationMembership, "role">): boolean {
  return membership.role === "manager";
}

export function canManageOrganization(
  membership: Pick<OrganizationMembership, "role">
): boolean {
  return membership.role === "owner" || membership.role === "manager";
}

export function canManageClassrooms(
  membership: Pick<OrganizationMembership, "role">
): boolean {
  return (
    membership.role === "owner" ||
    membership.role === "manager" ||
    membership.role === "teacher"
  );
}

export function canCreateAssignments(
  membership: Pick<OrganizationMembership, "role">
): boolean {
  return (
    membership.role === "owner" ||
    membership.role === "manager" ||
    membership.role === "teacher"
  );
}

export function canViewReports(
  membership: Pick<OrganizationMembership, "role">
): boolean {
  return (
    membership.role === "owner" ||
    membership.role === "manager" ||
    membership.role === "teacher"
  );
}

export function isOrgTeacher(membership: Pick<OrganizationMembership, "role">): boolean {
  return membership.role === "teacher";
}

export function isOrgAssistant(
  membership: Pick<OrganizationMembership, "role">
): boolean {
  return membership.role === "assistant";
}

export function isOrgStudent(membership: Pick<OrganizationMembership, "role">): boolean {
  return membership.role === "student";
}

export type OrganizationContext = {
  organizations: MyOrganization[];
  primary: MyOrganization | null;
};

export async function getMyOrganizationMemberships(): Promise<{
  data: OrganizationMembership[];
  error: string | null;
}> {
  const { getMyOrganizationsWithRole } = await import("@/lib/supabase/organizations");
  const res = await getMyOrganizationsWithRole();
  if (res.error) return { data: [], error: res.error };
  return {
    data: (res.data ?? []).map((o) => ({
      id: o.memberId,
      organizationId: o.id,
      userId: null,
      email: null,
      displayName: null,
      role: o.memberRole,
      status: o.memberStatus,
      permissions: o.permissions ?? {},
      joinedAt: o.joinedAt ?? null,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      organizationName: o.name,
    })),
    error: null,
  };
}

export async function getCurrentOrganizationContext(): Promise<{
  data: OrganizationContext | null;
  error: string | null;
}> {
  const { getMyOrganizationsWithRole } = await import("@/lib/supabase/organizations");
  const res = await getMyOrganizationsWithRole();
  if (res.error) return { data: null, error: res.error };
  const orgs = res.data ?? [];
  return {
    data: {
      organizations: orgs,
      primary: orgs[0] ?? null,
    },
    error: null,
  };
}
