"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { InviteLinkActions } from "@/components/invitations/invite-link-actions";
import { PublicPageShell } from "@/components/public-page-shell";
import type { OrganizationInvitation } from "@/lib/b2b/types";
import { buildInviteUrl } from "@/lib/organization/invite-url";
import { getClassroomById } from "@/lib/supabase/classrooms";
import { getClassroomInvitations, revokeInvitation } from "@/lib/supabase/invitations";

type Props = {
  classroomId: string;
};

export function ClassroomInvitationsView({ classroomId }: Props) {
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [classroomName, setClassroomName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [invRes, classRes] = await Promise.all([
      getClassroomInvitations(classroomId),
      getClassroomById(classroomId),
    ]);
    setLoading(false);
    if (invRes.error) setError(invRes.error);
    else setInvitations(invRes.data ?? []);
    if (classRes.data) setClassroomName(classRes.data.name);
  }, [classroomId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRevoke(id: string) {
    const res = await revokeInvitation(id);
    if (res.error) setError(res.error);
    else void load();
  }

  async function handleCopyUrl(token: string, id: string) {
    await navigator.clipboard.writeText(buildInviteUrl(token));
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Loading invitations…</p>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href={`/teacher/classes/${classroomId}`}
          className="text-sm text-slate-600 hover:text-emerald-600"
        >
          ← Classroom
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Classroom invitations</h1>
        <p className="mt-1 text-sm text-slate-600">{classroomName}</p>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </section>

      <ul className="flex flex-col gap-2">
        {invitations.length === 0 ? (
          <li className="text-sm text-slate-600">No student invitations yet.</li>
        ) : (
          invitations.map((inv) => (
            <li
              key={inv.id}
              className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">
                    {inv.displayName ?? inv.email ?? "Student invite"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {inv.status} · expires{" "}
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                {inv.status === "pending" ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopyUrl(inv.inviteToken, inv.id)}
                      className="text-xs font-semibold text-emerald-600"
                    >
                      {copiedId === inv.id ? "Copied!" : "Copy URL"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRevoke(inv.id)}
                      className="text-xs text-red-600"
                    >
                      Revoke
                    </button>
                  </div>
                ) : null}
              </div>
              {inv.status === "pending" ? (
                <div className="mt-2">
                  <InviteLinkActions
                    invitation={inv}
                    context={{ classroomName }}
                  />
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </PublicPageShell>
  );
}
