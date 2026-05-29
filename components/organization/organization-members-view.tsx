"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MemberManagement } from "@/components/organization/member-management";
import { PublicPageShell } from "@/components/public-page-shell";
import type { OrganizationMember } from "@/lib/b2b/types";
import { canManageOrganization } from "@/lib/supabase/organization-permissions";
import {
  getMyMembershipForOrganization,
  getOrganizationMembers,
} from "@/lib/supabase/organizations";

type Props = {
  organizationId: string;
};

export function OrganizationMembersView({ organizationId }: Props) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [membersRes, membershipRes] = await Promise.all([
      getOrganizationMembers(organizationId),
      getMyMembershipForOrganization(organizationId),
    ]);
    setLoading(false);
    if (membersRes.error) setError(membersRes.error);
    else setMembers(membersRes.data ?? []);
    const role = membershipRes.data?.memberRole ?? "assistant";
    setCanManage(canManageOrganization({ role }));
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Loading members…</p>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href={`/organization/${organizationId}`}
          className="text-sm text-slate-600 hover:text-emerald-600"
        >
          ← Organization dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Members</h1>
        {canManage ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={`/organization/${organizationId}/members/import`}
              className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
            >
              Bulk import members →
            </Link>
            <Link
              href={`/organization/${organizationId}/invitations`}
              className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Invitations →
            </Link>
          </div>
        ) : null}
        {!canManage ? (
          <p className="mt-2 text-sm text-amber-800">
            View-only — only owner/manager can edit members.
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </section>

      <MemberManagement
        organizationId={organizationId}
        members={members}
        canManage={canManage}
        onChanged={() => void load()}
      />
    </PublicPageShell>
  );
}
