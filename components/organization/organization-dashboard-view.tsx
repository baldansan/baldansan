"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { OrganizationAssignmentList } from "@/components/organization/organization-assignment-list";
import { OrganizationClassroomList } from "@/components/organization/organization-classroom-list";
import { OrganizationDashboardCard } from "@/components/organization/organization-dashboard-card";
import { OrganizationPermissionNote } from "@/components/organization/organization-permission-note";
import { OrganizationRoleBadge } from "@/components/organization/organization-role-badge";
import { PilotReadinessCard } from "@/components/organization/pilot-readiness-card";
import { PublicPageShell } from "@/components/public-page-shell";
import { NeedsAttentionCard } from "@/components/teacher/needs-attention-card";
import { TeacherMetricCard } from "@/components/teacher/teacher-metric-card";
import type { OrganizationDashboardData } from "@/lib/b2b/types";
import type { OrganizationOverviewMetrics } from "@/lib/organization/analytics-types";
import type { OrganizationPilotSummary } from "@/lib/b2b/types";
import {
  canCreateAssignments,
  canManageClassrooms,
  canManageOrganization,
  canViewReports,
} from "@/lib/supabase/organization-permissions";
import { getOrganizationOverviewMetrics } from "@/lib/supabase/organization-analytics";
import { getOrganizationPilotSummary } from "@/lib/supabase/organization-onboarding";
import { getOrganizationDashboardData } from "@/lib/supabase/organizations";

type Props = {
  organizationId: string;
};

export function OrganizationDashboardView({ organizationId }: Props) {
  const [data, setData] = useState<OrganizationDashboardData | null>(null);
  const [metrics, setMetrics] = useState<OrganizationOverviewMetrics | null>(null);
  const [pilot, setPilot] = useState<OrganizationPilotSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [dashRes, metricsRes, pilotRes] = await Promise.all([
      getOrganizationDashboardData(organizationId),
      getOrganizationOverviewMetrics(organizationId),
      getOrganizationPilotSummary(organizationId),
    ]);
    setLoading(false);
    if (dashRes.error) setError(dashRes.error);
    else setData(dashRes.data);
    if (metricsRes.data) setMetrics(metricsRes.data);
    if (pilotRes.data) setPilot(pilotRes.data);
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Loading organization…</p>
      </PublicPageShell>
    );
  }

  if (!data) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">{error ?? "Organization not found."}</p>
        <Link href="/organization" className="mt-2 text-sm text-emerald-600">
          ← Organizations
        </Link>
      </PublicPageShell>
    );
  }

  const { organization, membership } = data;
  const role = membership.memberRole;
  const manageOrg = canManageOrganization({ role });
  const manageClasses = canManageClassrooms({ role });
  const createAssign = canCreateAssignments({ role });
  const viewReports = canViewReports({ role });

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link href="/organization" className="text-sm text-slate-600 hover:text-emerald-600">
          ← Organizations
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
          <OrganizationRoleBadge role={role} />
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {organization.organizationType} · {organization.status}
        </p>
        {pilot?.onboarding ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {pilot.onboarding.onboardingStatus}
            </span>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {pilot.onboarding.pilotStage}
            </span>
          </div>
        ) : null}
        <OrganizationPermissionNote role={role} />
      </section>

      {pilot ? (
        <PilotReadinessCard
          organizationId={organizationId}
          readiness={pilot.readiness}
          onboardingStatus={pilot.onboarding?.onboardingStatus}
          pilotStage={pilot.onboarding?.pilotStage}
        />
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OrganizationDashboardCard
          label="Teachers"
          value={String(data.teacherCount)}
        />
        <OrganizationDashboardCard
          label="Classrooms"
          value={String(data.classroomCount)}
        />
        <OrganizationDashboardCard
          label="Students"
          value={String(data.studentCount)}
        />
        <OrganizationDashboardCard
          label="Assignments"
          value={String(data.assignmentCount)}
        />
      </section>

      {metrics ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TeacherMetricCard
            label="Completion"
            value={`${metrics.overallCompletionRate}%`}
            sub={`${metrics.completedResultCount} results`}
          />
          <TeacherMetricCard
            label="Avg quiz"
            value={
              metrics.averageQuizPercentage != null
                ? `${metrics.averageQuizPercentage}%`
                : "—"
            }
          />
          <TeacherMetricCard
            label="Linked students"
            value={String(metrics.linkedStudentCount)}
            sub={`of ${metrics.studentCount} enrolled`}
          />
          <TeacherMetricCard
            label="Needs attention"
            value={String(metrics.classesNeedingAttention.length)}
            sub="classes"
          />
        </section>
      ) : null}

      {metrics && metrics.classesNeedingAttention.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Classes needing attention</h2>
          <div className="mt-3">
            <NeedsAttentionCard
              items={metrics.classesNeedingAttention.map((c) => ({
                kind: "low_assignment_completion" as const,
                label: c.name,
                detail: c.reason,
              }))}
            />
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {manageOrg ? (
            <Link
              href={`/organization/${organizationId}/members`}
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Manage members
            </Link>
          ) : null}
          {manageClasses ? (
            <Link
              href={`/teacher/classes/new?organizationId=${organizationId}`}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
            >
              Create classroom
            </Link>
          ) : null}
          {createAssign ? (
            <Link
              href={`/teacher/assignments/new?organizationId=${organizationId}`}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Create assignment
            </Link>
          ) : null}
          {viewReports ? (
            <Link
              href={`/organization/${organizationId}/reports`}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
            >
              School admin reports
            </Link>
          ) : null}
          {manageOrg || viewReports ? (
            <Link
              href={`/organization/${organizationId}/setup`}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Setup wizard
            </Link>
          ) : null}
          <Link
            href={`/organization/${organizationId}/dashboard`}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Pilot dashboard
          </Link>
          <Link
            href={`/organization/${organizationId}/classrooms`}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            All classrooms
          </Link>
          <Link
            href={`/organization/${organizationId}/assignments`}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            All assignments
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Classrooms</h2>
        <div className="mt-3">
          <OrganizationClassroomList
            classrooms={data.classrooms}
            organizationId={organizationId}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Assignments</h2>
        <div className="mt-3">
          <OrganizationAssignmentList assignments={data.assignments} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Members preview</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {data.members.slice(0, 6).map((m) => (
            <li
              key={m.id}
              className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200"
            >
              {m.displayName ?? m.email ?? "Member"} · {m.role} · {m.status}
            </li>
          ))}
        </ul>
        {manageOrg ? (
          <Link
            href={`/organization/${organizationId}/members`}
            className="mt-2 inline-block text-sm text-emerald-600"
          >
            View all members →
          </Link>
        ) : null}
      </section>
    </PublicPageShell>
  );
}
