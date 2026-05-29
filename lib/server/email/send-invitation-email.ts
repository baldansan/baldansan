import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrganizationInvitation } from "@/lib/b2b/types";
import {
  getEmailProviderStatus,
  isEmailProviderConfigured,
  sendEmail,
} from "@/lib/server/email/email-provider";
import {
  buildInvitationEmailContent,
  resolveInvitationEmailBaseUrl,
} from "@/lib/server/email/invitation-email";

export type SendInvitationEmailResult = {
  ok: boolean;
  status: "queued" | "sent" | "failed" | "skipped" | "manual_copy";
  message: string;
  deliveryId?: string;
  inviteUrl?: string;
  providerStatus?: ReturnType<typeof getEmailProviderStatus>;
};

type InvitationRow = {
  id: string;
  organization_id: string | null;
  classroom_id: string | null;
  invite_token: string;
  email: string | null;
  display_name: string | null;
  role: string;
  invite_kind: string;
  status: string;
  organizations?: { name?: string } | null;
  classrooms?: { name?: string } | null;
};

export async function sendInvitationEmailForId(
  client: SupabaseClient,
  invitationId: string,
  userId: string,
  request?: Request
): Promise<SendInvitationEmailResult> {
  const { data: invitation, error: invError } = await client
    .from("organization_invitations")
    .select("*, organizations(name), classrooms(name)")
    .eq("id", invitationId)
    .maybeSingle();

  if (invError || !invitation) {
    return { ok: false, status: "failed", message: invError?.message ?? "Invitation not found." };
  }

  const row = invitation as InvitationRow;

  if (String(row.status) !== "pending") {
    return { ok: false, status: "failed", message: "Invitation is not pending." };
  }

  const emailContent = buildInvitationEmailContent(
    {
      id: row.id,
      organizationId: row.organization_id ?? "",
      organizationMemberId: null,
      classroomId: row.classroom_id,
      inviteToken: String(row.invite_token),
      email: row.email,
      displayName: row.display_name,
      role: row.role as OrganizationInvitation["role"],
      inviteKind: row.invite_kind as OrganizationInvitation["inviteKind"],
      status: row.status as OrganizationInvitation["status"],
      expiresAt: "",
      acceptedAt: null,
      acceptedBy: null,
      createdBy: null,
      metadata: {},
      createdAt: "",
      updatedAt: "",
      organizationName: row.organizations?.name ?? "",
      classroomName: row.classrooms?.name ?? undefined,
    },
    resolveInvitationEmailBaseUrl(request)
  );

  if (!emailContent.recipientEmail) {
    return { ok: false, status: "failed", message: "Invitation has no recipient email." };
  }

  const providerStatus = getEmailProviderStatus();
  let status: SendInvitationEmailResult["status"] = "queued";
  let errorMessage: string | null = null;
  let sentAt: string | null = null;
  let provider = providerStatus.provider ?? "manual";

  if (!isEmailProviderConfigured()) {
    status = "skipped";
    errorMessage =
      "Email provider тохируулаагүй байна. Invite link copy fallback ашиглана уу.";
    provider = "manual";
  } else {
    const sendResult = await sendEmail({
      to: emailContent.recipientEmail,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    provider = sendResult.provider ?? provider;

    if (sendResult.skipped) {
      status = "skipped";
      errorMessage = sendResult.reason ?? "Email provider skipped.";
    } else if (sendResult.ok) {
      status = "sent";
      sentAt = new Date().toISOString();
    } else {
      status = "failed";
      errorMessage = sendResult.error ?? "Email send failed.";
    }
  }

  const { data: delivery, error: deliveryError } = await client
    .from("invitation_email_deliveries")
    .insert({
      invitation_id: invitationId,
      recipient_email: emailContent.recipientEmail,
      subject: emailContent.subject,
      body: emailContent.text,
      provider,
      status,
      error_message: errorMessage,
      sent_at: sentAt,
      created_by: userId,
    })
    .select("id")
    .single();

  if (deliveryError) {
    return { ok: false, status: "failed", message: deliveryError.message };
  }

  const message =
    status === "sent"
      ? "Invitation email sent."
      : status === "skipped"
        ? errorMessage ?? "Email provider not configured."
        : errorMessage ?? "Email send failed.";

  return {
    ok: status === "sent",
    status,
    message,
    deliveryId: delivery?.id ? String(delivery.id) : undefined,
    inviteUrl: emailContent.inviteUrl,
    providerStatus,
  };
}
