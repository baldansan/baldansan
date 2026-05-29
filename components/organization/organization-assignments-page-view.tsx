"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OrganizationAssignmentList } from "@/components/organization/organization-assignment-list";
import { PublicPageShell } from "@/components/public-page-shell";
import type { Assignment } from "@/lib/classroom/types";
import { canCreateAssignments } from "@/lib/supabase/organization-permissions";
import {
  getMyMembershipForOrganization,
  getOrganizationAssignments,
} from "@/lib/supabase/organizations";

type Props = {
  organizationId: string;
};

export function OrganizationAssignmentsPageView({ organizationId }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [assignRes, membershipRes] = await Promise.all([
        getOrganizationAssignments(organizationId),
        getMyMembershipForOrganization(organizationId),
      ]);
      setLoading(false);
      if (assignRes.error) setError(assignRes.error);
      else setAssignments(assignRes.data ?? []);
      const role = membershipRes.data?.memberRole ?? "assistant";
      setCanCreate(canCreateAssignments({ role }));
    }
    void load();
  }, [organizationId]);

  if (loading) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Loading…</p>
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
        <h1 className="mt-2 text-2xl font-bold">Organization assignments</h1>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {canCreate ? (
          <Link
            href={`/teacher/assignments/new?organizationId=${organizationId}`}
            className="mt-3 inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Create assignment
          </Link>
        ) : null}
      </section>
      <OrganizationAssignmentList assignments={assignments} />
    </PublicPageShell>
  );
}
