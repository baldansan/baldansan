"use client";

import { useState } from "react";
import { requestInvitationEmailSend } from "@/lib/supabase/invitation-email-deliveries";

type Props = {
  invitationId: string;
  recipientEmail?: string | null;
  inviteUrl: string;
  onSent?: () => void;
};

export function SendInviteEmailButton({
  invitationId,
  recipientEmail,
  inviteUrl,
  onSent,
}: Props) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  async function handleSend() {
    if (!recipientEmail) {
      setMessage("Invitation has no recipient email.");
      setStatus("failed");
      return;
    }
    setSending(true);
    setMessage(null);
    const res = await requestInvitationEmailSend(invitationId);
    setSending(false);
    if (res.error) {
      setMessage(res.error);
      setStatus("failed");
      return;
    }
    if (res.data) {
      setStatus(res.data.status);
      setMessage(res.data.message);
      if (res.data.status === "sent") onSent?.();
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2000);
  }

  const isSkipped = status === "skipped" || status === "manual_copy";
  const isSuccess = status === "sent";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={sending || !recipientEmail}
          onClick={() => void handleSend()}
          className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          {sending ? "Sending…" : status === "failed" ? "Retry send email" : "Send email invite"}
        </button>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-800"
        >
          {copiedLink ? "Copied!" : "Copy invite link"}
        </button>
      </div>
      {!recipientEmail ? (
        <p className="text-xs text-amber-800">No email on invitation — use copy link only.</p>
      ) : null}
      {message ? (
        <p
          className={`text-xs ${
            isSuccess
              ? "text-emerald-800"
              : isSkipped
                ? "text-amber-800"
                : "text-red-800"
          }`}
        >
          {message}
          {isSkipped ? " Email provider not configured. Copy link ашиглана уу." : null}
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          If email provider is not configured on the server, delivery is logged as skipped and
          copy-link fallback remains available.
        </p>
      )}
    </div>
  );
}
