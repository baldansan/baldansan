"use client";

import { useState } from "react";
import type {
  OrganizationMember,
  OrganizationMemberRole,
} from "@/lib/b2b/types";
import { OrganizationRoleBadge } from "@/components/organization/organization-role-badge";
import { InviteLinkActions } from "@/components/invitations/invite-link-actions";
import type { OrganizationInvitation } from "@/lib/b2b/types";
import {
  createOrganizationMemberInvitation,
} from "@/lib/supabase/invitations";
import {
  removeOrganizationMember,
  updateOrganizationMemberRole,
} from "@/lib/supabase/organizations";

const ROLE_OPTIONS: OrganizationMemberRole[] = [
  "owner",
  "manager",
  "teacher",
  "assistant",
  "student",
];

type Props = {
  organizationId: string;
  members: OrganizationMember[];
  canManage: boolean;
  onChanged: () => void;
};

export function MemberManagement({
  organizationId,
  members,
  canManage,
  onChanged,
}: Props) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<OrganizationMemberRole>("teacher");
  const [userId, setUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInvite, setLastInvite] = useState<OrganizationInvitation | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setSaving(true);
    setError(null);
    const res = await createOrganizationMemberInvitation({
      organizationId,
      email: email || undefined,
      displayName: displayName || undefined,
      role,
    });
    setSaving(false);
    if (res.error) setError(res.error);
    else {
      setEmail("");
      setDisplayName("");
      setUserId("");
      if (res.data) setLastInvite(res.data);
      onChanged();
    }
  }

  async function handleRoleChange(memberId: string, newRole: OrganizationMemberRole) {
    if (!canManage) return;
    setSaving(true);
    const res = await updateOrganizationMemberRole(memberId, newRole);
    setSaving(false);
    if (res.error) setError(res.error);
    else onChanged();
  }

  async function handleRemove(memberId: string) {
    if (!canManage) return;
    setSaving(true);
    const res = await removeOrganizationMember(memberId);
    setSaving(false);
    if (res.error) setError(res.error);
    else onChanged();
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200"
          >
            <div>
              <div className="font-medium text-slate-900">
                {m.displayName ?? m.email ?? "Member"}
              </div>
              <div className="text-xs text-slate-500">
                {m.email ?? "—"} · {m.status}
                {m.joinedAt
                  ? ` · joined ${new Date(m.joinedAt).toLocaleDateString()}`
                  : ""}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <OrganizationRoleBadge role={m.role} />
              {canManage ? (
                <>
                  <select
                    value={m.role}
                    onChange={(e) =>
                      void handleRoleChange(
                        m.id,
                        e.target.value as OrganizationMemberRole
                      )
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void handleRemove(m.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {canManage ? (
        <form
          onSubmit={(e) => void handleAdd(e)}
          className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"
        >
          <h3 className="text-sm font-semibold text-slate-800">Create invite link</h3>
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
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as OrganizationMemberRole)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID (optional UUID)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Create invite link
          </button>
          {lastInvite ? <InviteLinkActions invitation={lastInvite} /> : null}
        </form>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
    </div>
  );
}
