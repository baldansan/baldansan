"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OrganizationClassroomList } from "@/components/organization/organization-classroom-list";
import { PublicPageShell } from "@/components/public-page-shell";
import type { Classroom } from "@/lib/classroom/types";
import { canManageClassrooms } from "@/lib/supabase/organization-permissions";
import {
  getMyMembershipForOrganization,
  getOrganizationClassrooms,
} from "@/lib/supabase/organizations";

type Props = {
  organizationId: string;
};

export function OrganizationClassroomsPageView({ organizationId }: Props) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [classRes, membershipRes] = await Promise.all([
        getOrganizationClassrooms(organizationId),
        getMyMembershipForOrganization(organizationId),
      ]);
      setLoading(false);
      if (classRes.error) setError(classRes.error);
      else setClassrooms(classRes.data ?? []);
      const role = membershipRes.data?.memberRole ?? "assistant";
      setCanCreate(canManageClassrooms({ role }));
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
        <h1 className="mt-2 text-2xl font-bold">Organization classrooms</h1>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {canCreate ? (
          <Link
            href={`/teacher/classes/new?organizationId=${organizationId}`}
            className="mt-3 inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Create organization classroom
          </Link>
        ) : null}
      </section>
      <OrganizationClassroomList
        classrooms={classrooms}
        organizationId={organizationId}
        canManage={canCreate}
      />
    </PublicPageShell>
  );
}
