"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OrganizationCard } from "@/components/organization/organization-card";
import { PublicPageShell } from "@/components/public-page-shell";
import { useTeacherAuth } from "@/components/teacher/teacher-auth-gate";
import type { MyOrganization, OrganizationPilotSummary } from "@/lib/b2b/types";
import { getMyOrganizationsWithRole } from "@/lib/supabase/organizations";
import { getOrganizationPilotSummary } from "@/lib/supabase/organization-onboarding";

export function OrganizationHomeView() {
  const { loggedIn } = useTeacherAuth();
  const [orgs, setOrgs] = useState<MyOrganization[]>([]);
  const [pilotByOrg, setPilotByOrg] = useState<
    Record<string, OrganizationPilotSummary>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loggedIn) {
      setLoading(false);
      return;
    }
    async function load() {
      const res = await getMyOrganizationsWithRole();
      setLoading(false);
      if (res.error) setError(res.error);
      else {
        const list = res.data ?? [];
        setOrgs(list);
        const pilots = await Promise.all(
          list.map(async (org) => {
            const p = await getOrganizationPilotSummary(org.id);
            return p.data ? ([org.id, p.data] as const) : null;
          })
        );
        const map: Record<string, OrganizationPilotSummary> = {};
        for (const entry of pilots) {
          if (entry) map[entry[0]] = entry[1];
        }
        setPilotByOrg(map);
      }
    }
    void load();
  }, [loggedIn]);

  if (loggedIn === null || loading) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Loading…</p>
      </PublicPageShell>
    );
  }

  if (!loggedIn) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold">Organization</h1>
          <p className="mt-2 text-sm text-slate-600">Нэвтэрсний дараа байгууллага харагдана.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Login
          </Link>
        </section>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
        <p className="mt-2 text-sm text-slate-600">
          Сургалтын төв, сургуулийн multi-teacher team dashboard.
        </p>
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      {orgs.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-600">
            Та одоогоор байгууллагад холбогдоогүй байна.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/school-inquiry"
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
            >
              School inquiry
            </Link>
            <Link
              href="/teacher/setup"
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700"
            >
              Teacher setup
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {orgs.map((org) => (
            <OrganizationCard
              key={org.id}
              org={org}
              pilotSummary={pilotByOrg[org.id]}
            />
          ))}
        </div>
      )}
    </PublicPageShell>
  );
}
