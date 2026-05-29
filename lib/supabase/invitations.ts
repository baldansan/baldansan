/**
 * Unified invitation API (backed by `organization_invitations` table + `invitations` view).
 * No service_role — anon authenticated client + RLS only.
 */
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import type {
  InvitationLookup,
  OrganizationInvitation,
  OrganizationMemberRole,
} from "@/lib/b2b/types";
import { buildInviteMessage } from "@/lib/invitations/invite-message-templates";
import { buildInviteUrl } from "@/lib/organization/invite-url";
import { addOrganizationMember } from "@/lib/supabase/organizations";
import { addStudentToClassroom } from "@/lib/supabase/classrooms";
import { createUserNotification } from "@/lib/supabase/engagement";

export type InviteResult<T> = { data: T | null; error: string | null };

function notConfigured<T>(): InviteResult<T> {
  return { data: null, error: "Supabase is not configured." };
}

function mapInvitation(row: Record<string, unknown>): OrganizationInvitation {
  return {
    id: String(row.id),
    organizationId: row.organization_id ? String(row.organization_id) : "",
    organizationMemberId: row.organization_member_id
      ? String(row.organization_member_id)
      : null,
    classroomId: row.classroom_id ? String(row.classroom_id) : null,
    inviteToken: String(row.invite_token),
    email: row.email ? String(row.email) : null,
    displayName: row.display_name ? String(row.display_name) : null,
    role: String(row.role ?? "teacher") as OrganizationMemberRole,
    inviteKind: String(row.invite_kind ?? "organization_member") as
      | "organization_member"
      | "classroom_student",
    status: String(row.status ?? "pending") as OrganizationInvitation["status"],
    expiresAt: String(row.expires_at),
    acceptedAt: row.accepted_at ? String(row.accepted_at) : null,
    acceptedBy: row.accepted_by ? String(row.accepted_by) : null,
    createdBy: row.created_by ? String(row.created_by) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function generateInviteToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function buildInviteUrlFromToken(token: string): string {
  return buildInviteUrl(token);
}

export function buildInviteMessageForInvitation(
  invitation: OrganizationInvitation,
  context?: { organizationName?: string; classroomName?: string }
): { subject: string; body: string; sms: string } {
  const inviteUrl = buildInviteUrl(invitation.inviteToken);
  const lookup: InvitationLookup = {
    invitationId: invitation.id,
    organizationId: invitation.organizationId,
    organizationName: context?.organizationName ?? "",
    classroomId: invitation.classroomId,
    classroomName: context?.classroomName ?? null,
    email: invitation.email,
    displayName: invitation.displayName,
    role: invitation.role,
    inviteKind: invitation.inviteKind,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
  };
  return buildInviteMessage(lookup, inviteUrl);
}

export async function createOrganizationMemberInvitation(input: {
  organizationId: string;
  email?: string;
  displayName?: string;
  role?: OrganizationMemberRole;
  organizationMemberId?: string;
}): Promise<InviteResult<OrganizationInvitation>> {
  if (!supabase) return notConfigured();
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  let memberId = input.organizationMemberId ?? null;
  if (!memberId) {
    const memberRes = await addOrganizationMember(input.organizationId, {
      email: input.email,
      displayName: input.displayName,
      role: input.role ?? "teacher",
      status: "invited",
    });
    if (memberRes.error || !memberRes.data) {
      return { data: null, error: memberRes.error ?? "Could not create member." };
    }
    memberId = memberRes.data.id;
  }

  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: input.organizationId,
      organization_member_id: memberId,
      invite_token: token,
      email: input.email?.trim().toLowerCase() || null,
      display_name: input.displayName?.trim() || null,
      role: input.role ?? "teacher",
      invite_kind: "organization_member",
      status: "pending",
      expires_at: expiresAt,
      created_by: userId,
    })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapInvitation(data as Record<string, unknown>), error: null };
}

export async function createClassroomStudentInvitation(input: {
  classroomId: string;
  organizationId?: string | null;
  email?: string;
  displayName?: string;
  classroomStudentId?: string;
}): Promise<InviteResult<OrganizationInvitation>> {
  if (!supabase) return notConfigured();
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  let studentRowId = input.classroomStudentId ?? null;
  if (!studentRowId && input.displayName) {
    const studentRes = await addStudentToClassroom(input.classroomId, {
      displayName: input.displayName,
      email: input.email,
    });
    if (studentRes.error || !studentRes.data) {
      return { data: null, error: studentRes.error ?? "Could not create student row." };
    }
    studentRowId = studentRes.data.id;
  }

  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: input.organizationId ?? null,
      classroom_id: input.classroomId,
      invite_token: token,
      email: input.email?.trim().toLowerCase() || null,
      display_name: input.displayName?.trim() || null,
      role: "student",
      invite_kind: "classroom_student",
      status: "pending",
      expires_at: expiresAt,
      created_by: userId,
      metadata: studentRowId ? { classroom_student_id: studentRowId } : {},
    })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapInvitation(data as Record<string, unknown>), error: null };
}

export async function getInvitationByToken(
  token: string
): Promise<InviteResult<InvitationLookup | null>> {
  if (!supabase) return notConfigured();

  const { data, error } = await supabase.rpc("lookup_organization_invitation", {
    p_token: token,
  });

  if (error) return { data: null, error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { data: null, error: null };

  return {
    data: {
      invitationId: String(row.invitation_id),
      organizationId: row.organization_id ? String(row.organization_id) : "",
      organizationName: row.organization_name ? String(row.organization_name) : "",
      classroomId: row.classroom_id ? String(row.classroom_id) : null,
      classroomName: row.classroom_name ? String(row.classroom_name) : null,
      email: row.email ? String(row.email) : null,
      displayName: row.display_name ? String(row.display_name) : null,
      role: String(row.role),
      inviteKind: String(row.invite_kind),
      status: String(row.status),
      expiresAt: String(row.expires_at),
    },
    error: null,
  };
}

export type AcceptInvitationResult = {
  inviteKind: "organization_member" | "classroom_student";
  organizationId?: string;
  memberId?: string;
  role?: string;
  classroomId?: string;
  studentId?: string;
};

export async function acceptInvitation(
  token: string
): Promise<InviteResult<AcceptInvitationResult>> {
  if (!supabase) return notConfigured();

  const { data, error } = await supabase.rpc("accept_organization_invitation", {
    p_token: token,
  });

  if (error) return { data: null, error: error.message };
  const payload = data as {
    ok?: boolean;
    error?: string;
    invite_kind?: string;
    organization_id?: string;
    member_id?: string;
    role?: string;
    classroom_id?: string;
    student_id?: string;
  };

  if (!payload?.ok) {
    return { data: null, error: payload?.error ?? "Accept failed." };
  }

  const result: AcceptInvitationResult = {
    inviteKind:
      payload.invite_kind === "classroom_student"
        ? "classroom_student"
        : "organization_member",
    organizationId: payload.organization_id
      ? String(payload.organization_id)
      : undefined,
    memberId: payload.member_id ? String(payload.member_id) : undefined,
    role: payload.role ? String(payload.role) : undefined,
    classroomId: payload.classroom_id ? String(payload.classroom_id) : undefined,
    studentId: payload.student_id ? String(payload.student_id) : undefined,
  };

  void createUserNotification({
    notificationType: "invitation_accepted",
    title: "Invitation accepted",
    message:
      result.inviteKind === "classroom_student"
        ? "You joined the classroom successfully."
        : "You joined the organization successfully.",
    actionHref:
      result.inviteKind === "classroom_student"
        ? "/my-assignments"
        : result.organizationId
          ? `/organization/${result.organizationId}`
          : "/organization",
  }).catch(() => undefined);

  return { data: result, error: null };
}

export async function revokeInvitation(
  invitationId: string
): Promise<InviteResult<null>> {
  if (!supabase) return notConfigured();

  const { error } = await supabase
    .from("organization_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId);

  return { data: null, error: error?.message ?? null };
}

export async function markInvitationExpired(
  invitationId: string
): Promise<InviteResult<null>> {
  if (!supabase) return notConfigured();

  const { error } = await supabase
    .from("organization_invitations")
    .update({ status: "expired" })
    .eq("id", invitationId);

  return { data: null, error: error?.message ?? null };
}

export async function getOrganizationInvitations(
  organizationId: string
): Promise<InviteResult<OrganizationInvitation[]>> {
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("organization_invitations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return {
    data: (data ?? []).map((row) => mapInvitation(row as Record<string, unknown>)),
    error: null,
  };
}

export async function getClassroomInvitations(
  classroomId: string
): Promise<InviteResult<OrganizationInvitation[]>> {
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("organization_invitations")
    .select("*")
    .eq("classroom_id", classroomId)
    .eq("invite_kind", "classroom_student")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return {
    data: (data ?? []).map((row) => mapInvitation(row as Record<string, unknown>)),
    error: null,
  };
}

// Back-compat aliases
export {
  createOrganizationMemberInvitation as createOrganizationInvitation,
  getInvitationByToken as lookupInvitationByToken,
  acceptInvitation as acceptOrganizationInvitation,
  revokeInvitation as revokeOrganizationInvitation,
};

export function getInvitationPublicUrl(invitation: OrganizationInvitation): string {
  return buildInviteUrl(invitation.inviteToken);
}

export async function requestInvitationEmailSend(
  invitationId: string
): Promise<InviteResult<{ deliveryId: string; status: string; inviteUrl: string }>> {
  const { requestInvitationEmailSend: send } = await import(
    "@/lib/supabase/invitation-email-deliveries"
  );
  const res = await send(invitationId);
  if (res.error || !res.data) return { data: null, error: res.error ?? "Send failed." };
  return {
    data: {
      deliveryId: res.data.deliveryId,
      status: res.data.status,
      inviteUrl: res.data.inviteUrl,
    },
    error: null,
  };
}
