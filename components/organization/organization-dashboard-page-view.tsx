"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { OnboardingTaskList } from "@/components/organization/onboarding-task-list";
import { PilotReadinessCard } from "@/components/organization/pilot-readiness-card";
import { PublicPageShell } from "@/components/public-page-shell";
import type { OnboardingTaskStatus, OrganizationMemberRole, OrganizationPilotSummary } from "@/lib/b2b/types";
import { canManageOrganization } from "@/lib/supabase/organization-permissions";
import {
  getOrganizationPilotSummary,
  updateOnboardingTaskStatus,
} from "@/lib/supabase/organization-onboarding";
import { getMyMembershipForOrganization } from "@/lib/supabase/organizations";

type Props = {
  organizationId: string;
};

export function OrganizationDashboardPageView({ organizationId }: Props) {
  const [pilot, setPilot] = useState<OrganizationPilotSummary | null>(null);
  const [memberRole, setMemberRole] = useState<OrganizationMemberRole>("assistant");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [pilotRes, membershipRes] = await Promise.all([
      getOrganizationPilotSummary(organizationId),
      getMyMembershipForOrganization(organizationId),
    ]);
    setLoading(false);
    if (pilotRes.error) setError(pilotRes.error);
    else setPilot(pilotRes.data);
    if (membershipRes.data?.memberRole) {
      setMemberRole(membershipRes.data.memberRole);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleTaskStatus(taskId: string, status: OnboardingTaskStatus) {
    setSaving(true);
    const res = await updateOnboardingTaskStatus(taskId, status);
    setSaving(false);
    if (res.error) setError(res.error);
    else void load();
  }

  if (loading) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Loading pilot dashboard…</p>
      </PublicPageShell>
    );
  }

  if (!pilot) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">{error ?? "Not found."}</p>
      </PublicPageShell>
    );
  }

  const canManage = canManageOrganization({ role: memberRole });

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href={`/organization/${organizationId}`}
          className="text-sm text-slate-600 hover:text-emerald-600"
        >
          ← Organization overview
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {pilot.organizationName} — Pilot dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Onboarding progress and pilot readiness for school admins.
        </p>
      </section>

      <PilotReadinessCard
        organizationId={organizationId}
        readiness={pilot.readiness}
        onboardingStatus={pilot.onboarding?.onboardingStatus}
        pilotStage={pilot.onboarding?.pilotStage}
      />

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Setup tasks</h2>
        <div className="mt-3">
          <OnboardingTaskList
            organizationId={organizationId}
            tasks={pilot.tasks}
            canManage={canManage}
            saving={saving}
            onStatusChange={(id, status) => void handleTaskStatus(id, status)}
          />
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link
          href={`/organization/${organizationId}/setup`}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Full setup wizard →
        </Link>
        <Link
          href={`/organization/${organizationId}/reports`}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Organization reports
        </Link>
      </section>
    </PublicPageShell>
  );
}
