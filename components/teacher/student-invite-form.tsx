"use client";

import { useState } from "react";
import type { OrganizationInvitation } from "@/lib/b2b/types";
import { InviteLinkActions } from "@/components/invitations/invite-link-actions";
import { createClassroomStudentInvitation } from "@/lib/supabase/invitations";

type Props = {
  classroomId: string;
  organizationId?: string | null;
  classroomName?: string;
  onCreated?: () => void;
};

export function StudentInviteForm({
  classroomId,
  organizationId,
  classroomName,
  onCreated,
}: Props) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<OrganizationInvitation | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() && !email.trim()) {
      setError("Display name or email is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await createClassroomStudentInvitation({
      classroomId,
      organizationId,
      email: email || undefined,
      displayName: displayName || undefined,
    });
    setSaving(false);
    if (res.error) setError(res.error);
    else if (res.data) {
      setInvitation(res.data);
      setEmail("");
      setDisplayName("");
      onCreated?.();
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"
    >
      <h3 className="text-sm font-semibold text-slate-800">Generate student invite link</h3>
      <input
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Display name"
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Creating…" : "Generate student invite link"}
      </button>
      {invitation ? (
        <InviteLinkActions
          invitation={invitation}
          context={{ classroomName }}
        />
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
    </form>
  );
}
