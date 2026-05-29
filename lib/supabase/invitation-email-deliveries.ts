import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { InvitationEmailDelivery } from "@/lib/b2b/types";

export type DeliveryResult<T> = { data: T | null; error: string | null };

function notConfigured<T>(): DeliveryResult<T> {
  return { data: null, error: "Supabase is not configured." };
}

function mapDelivery(row: Record<string, unknown>): InvitationEmailDelivery {
  const inv = row.organization_invitations as Record<string, unknown> | null;
  const org = inv?.organizations as { name?: string } | null;
  const classroom = inv?.classrooms as { name?: string } | null;

  return {
    id: String(row.id),
    invitationId: String(row.invitation_id),
    recipientEmail: String(row.recipient_email),
    subject: String(row.subject),
    body: String(row.body),
    provider: String(row.provider ?? "manual"),
    status: String(row.status ?? "queued") as InvitationEmailDelivery["status"],
    errorMessage: row.error_message ? String(row.error_message) : null,
    sentAt: row.sent_at ? String(row.sent_at) : null,
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    inviteKind: inv?.invite_kind ? String(inv.invite_kind) : null,
    organizationName: org?.name ?? null,
    classroomName: classroom?.name ?? null,
  };
}

export async function getInvitationEmailDeliveries(
  invitationId: string
): Promise<DeliveryResult<InvitationEmailDelivery[]>> {
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("invitation_email_deliveries")
    .select(
      "*, organization_invitations(invite_kind, organization_id, classroom_id, organizations(name), classrooms(name))"
    )
    .eq("invitation_id", invitationId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return {
    data: (data ?? []).map((row) => mapDelivery(row as Record<string, unknown>)),
    error: null,
  };
}

export async function getRecentInvitationEmailDeliveries(
  limit = 50
): Promise<DeliveryResult<InvitationEmailDelivery[]>> {
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("invitation_email_deliveries")
    .select(
      "*, organization_invitations(invite_kind, organization_id, classroom_id, organizations(name), classrooms(name))"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { data: null, error: error.message };
  return {
    data: (data ?? []).map((row) => mapDelivery(row as Record<string, unknown>)),
    error: null,
  };
}

export async function getInvitationEmailDeliveryCounts(): Promise<
  DeliveryResult<{ sent: number; failed: number; skipped: number }>
> {
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("invitation_email_deliveries")
    .select("status");

  if (error) return { data: null, error: error.message };

  const rows = data ?? [];
  return {
    data: {
      sent: rows.filter((r) => r.status === "sent").length,
      failed: rows.filter((r) => r.status === "failed").length,
      skipped: rows.filter((r) =>
        ["skipped", "manual_copy"].includes(String(r.status))
      ).length,
    },
    error: null,
  };
}

export async function requestInvitationEmailSend(
  invitationId: string
): Promise<
  DeliveryResult<{
    deliveryId: string;
    status: string;
    inviteUrl: string;
    message: string;
  }>
> {
  const res = await fetch(`/api/invitations/${invitationId}/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const json = (await res.json()) as {
    deliveryId?: string;
    status?: string;
    inviteUrl?: string;
    message?: string;
    ok?: boolean;
  };
  if (!res.ok && !json.deliveryId) {
    return { data: null, error: json.message ?? "Send failed." };
  }
  return {
    data: {
      deliveryId: String(json.deliveryId ?? ""),
      status: String(json.status ?? "skipped"),
      inviteUrl: String(json.inviteUrl ?? ""),
      message: String(json.message ?? ""),
    },
    error: null,
  };
}
