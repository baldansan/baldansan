"use client";

import { useState } from "react";
import type { InvitationLookup, OrganizationInvitation } from "@/lib/b2b/types";
import { InvitationDeliveryLog } from "@/components/invitations/invitation-delivery-log";
import { SendInviteEmailButton } from "@/components/invitations/send-invite-email-button";
import { buildInviteMessage } from "@/lib/invitations/invite-message-templates";
import { buildInviteUrl } from "@/lib/organization/invite-url";

type Props = {
  invitation: OrganizationInvitation;
  context?: {
    organizationName?: string;
    classroomName?: string;
  };
  lookup?: InvitationLookup;
};

export function InviteLinkActions({ invitation, context, lookup }: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [deliveryRefresh, setDeliveryRefresh] = useState(0);

  const inviteUrl = buildInviteUrl(invitation.inviteToken);
  const messageLookup: InvitationLookup =
    lookup ??
    ({
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
    } satisfies InvitationLookup);

  const message = buildInviteMessage(messageLookup, inviteUrl);

  async function copyLink() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2000);
  }

  async function copyEmailMessage() {
    const text = `Subject: ${message.subject}\n\n${message.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    window.setTimeout(() => setCopiedMessage(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-emerald-50 px-3 py-3 text-sm">
      <p className="break-all text-xs text-emerald-900">{inviteUrl}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-800"
        >
          {copiedLink ? "Copied!" : "Copy invite link"}
        </button>
        <button
          type="button"
          onClick={() => void copyEmailMessage()}
          className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-800"
        >
          {copiedMessage ? "Copied!" : "Copy email message"}
        </button>
      </div>
      <SendInviteEmailButton
        invitationId={invitation.id}
        recipientEmail={invitation.email}
        inviteUrl={inviteUrl}
        onSent={() => setDeliveryRefresh((k) => k + 1)}
      />
      <InvitationDeliveryLog invitationId={invitation.id} refreshKey={deliveryRefresh} />
    </div>
  );
}
