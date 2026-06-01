"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { B2BSteps } from "@/components/b2b/b2b-section";
import { OrganizationRoleBadge } from "@/components/organization/organization-role-badge";
import { PilotReadinessCard } from "@/components/organization/pilot-readiness-card";
import { PublicPageShell } from "@/components/public-page-shell";
import { NeedsAttentionCard } from "@/components/teacher/needs-attention-card";
import { TeacherMetricCard } from "@/components/teacher/teacher-metric-card";
import { useTeacherAuth } from "@/components/teacher/teacher-auth-gate";
import { CLASSROOM_WORKFLOW_STEPS } from "@/lib/content/classroom-copy";
import type { Classroom, TeacherProfile } from "@/lib/classroom/types";
import type {
  RecentClassActivity,
  TeacherOverviewMetrics,
} from "@/lib/teacher/analytics-types";
import type { MyOrganization, OrganizationPilotSummary } from "@/lib/b2b/types";
import {
  getPersonalClassrooms,
  getTeacherClassrooms,
  getCurrentTeacherProfile,
} from "@/lib/supabase/classrooms";
import { getOrganizationPilotSummary } from "@/lib/supabase/organization-onboarding";
import { getMyOrganizationsWithRole } from "@/lib/supabase/organizations";
import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import { canManageOrganization } from "@/lib/supabase/organization-permissions";
import {
  getTeacherOverviewMetrics,
  getTeacherRecentClassActivity,
} from "@/lib/supabase/teacher-analytics";

const QUICK_ACTIONS = [
  { href: "/teacher/reports", label: "View class reports" },
  { href: "/teacher/assignments", label: "View assignments" },
  { href: "/teacher/assignments/new", label: "Create assignment" },
  { href: "/teacher/classes/new", label: "Create class" },
  { href: "/teacher/classes", label: "My classes" },
  { href: "/courses/hsk5", label: "Courses", primary: true },
];

export function TeacherDashboardView() {
  const { loggedIn, email } = useTeacherAuth();
  const [profile, setProfile] = useState<TeacherProfile | null | undefined>(
    undefined
  );
  const [metrics, setMetrics] = useState<TeacherOverviewMetrics | null>(null);
  const [activity, setActivity] = useState<RecentClassActivity[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [myOrganizations, setMyOrganizations] = useState<MyOrganization[]>([]);
  const [personalClasses, setPersonalClasses] = useState<Classroom[]>([]);
  const [orgClasses, setOrgClasses] = useState<Classroom[]>([]);
  const [orgPilot, setOrgPilot] = useState<OrganizationPilotSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!loggedIn) return;
    async function load() {
      const [profileRes, metricsRes, activityRes, orgsRes, personalRes, allClassesRes] =
        await Promise.all([
        getCurrentTeacherProfile(),
        getTeacherOverviewMetrics(),
        getTeacherRecentClassActivity(8),
        getMyOrganizationsWithRole(),
        getPersonalClassrooms(),
        getTeacherClassrooms(),
      ]);
      setProfile(profileRes.data);
      if (metricsRes.error) setLoadError(metricsRes.error);
      else setMetrics(metricsRes.data);
      if (activityRes.error) setLoadError(activityRes.error);
      else setActivity(activityRes.data ?? []);
      setMyOrganizations(orgsRes.data ?? []);
      setPersonalClasses(personalRes.data ?? []);
      setOrgClasses(
        (allClassesRes.data ?? []).filter((c) => Boolean(c.organizationId))
      );
      if (orgsRes.data?.[0]) {
        const pilotRes = await getOrganizationPilotSummary(orgsRes.data[0].id);
        if (pilotRes.data) setOrgPilot(pilotRes.data);
      }
      setWarnings([...metricsRes.warnings, ...activityRes.warnings]);
    }
    void load();
  }, [loggedIn]);

  if (loggedIn === null) {
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
          <h1 className="text-2xl font-bold text-slate-900">Teacher dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">
            Багшийн dashboard-д нэвтрэх шаардлагатай.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Нэвтрэх
            </Link>
            <Link
              href="/demo"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800"
            >
              Demo үзэх
            </Link>
          </div>
        </section>
      </PublicPageShell>
    );
  }

  if (profile === undefined) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Loading dashboard…</p>
      </PublicPageShell>
    );
  }

  if (!profile) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold">Багшийн dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">
            Classroom ашиглахын өмнө багшийн profile үүсгэнэ.
          </p>
          <Link
            href="/teacher/setup"
            className="mt-4 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Багшийн profile үүсгэх
          </Link>
        </section>
      </PublicPageShell>
    );
  }

  const needsAttentionItems = (metrics?.classesNeedingAttention ?? []).map(
    (c) => ({
      kind: "low_assignment_completion" as const,
      label: c.name,
      detail: c.reason,
    })
  );

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
          Teacher
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          Багшийн dashboard
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Анги, даалгавар, сурагчийн ахицыг нэг дор хянах хэсэг.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {profile.displayName ?? email}
          {profile.organization ? ` · ${profile.organization}` : ""}
        </p>
        {loadError ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {loadError}
          </p>
        ) : null}
        {warnings.length > 0 ? (
          <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">My organizations</h2>
        {myOrganizations.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {myOrganizations.map((org) => (
              <li
                key={org.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200"
              >
                <div>
                  <span className="font-medium text-slate-900">{org.name}</span>
                  <span className="ml-2">
                    <OrganizationRoleBadge role={org.memberRole} />
                  </span>
                  <span className="ml-2 text-xs text-slate-500">{org.status}</span>
                </div>
                <Link
                  href={`/organization/${org.id}`}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-800"
                >
                  Open dashboard →
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">
              Organization account дараагийн шатанд холбогдоно.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/organization"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Organization hub
              </Link>
              <Link
                href="/school-inquiry"
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Сургалтын төв / байгууллага холбох хүсэлт илгээх
              </Link>
            </div>
          </div>
        )}
      </section>

      {orgPilot && myOrganizations[0] ? (
        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            Organization pilot — {myOrganizations[0].name}
          </h2>
          <div className="mt-3">
            <PilotReadinessCard
              organizationId={myOrganizations[0].id}
              readiness={orgPilot.readiness}
              onboardingStatus={orgPilot.onboarding?.onboardingStatus}
              pilotStage={orgPilot.onboarding?.pilotStage}
              showSetupLink={canManageOrganization({
                role: myOrganizations[0].memberRole,
              })}
            />
          </div>
          {orgPilot.tasks.filter((t) => t.status !== "completed").length > 0 ? (
            <ul className="mt-3 flex flex-col gap-1 text-sm text-slate-600">
              {orgPilot.tasks
                .filter((t) => t.status !== "completed" && t.status !== "skipped")
                .slice(0, 3)
                .map((t) => (
                  <li key={t.id}>· {t.title}</li>
                ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Personal classes</h2>
        {personalClasses.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No personal classes yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {personalClasses.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/teacher/classes/${c.id}`}
                  className="block rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200 hover:ring-emerald-200"
                >
                  {c.name} · {c.studentCount ?? 0} students
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/teacher/classes/new"
          className="mt-2 inline-block text-sm text-emerald-600"
        >
          Create personal class →
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Organization classes</h2>
        {orgClasses.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            No organization classes yet. Join an organization or create one from the org
            dashboard.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {orgClasses.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/teacher/classes/${c.id}`}
                  className="block rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200 hover:ring-emerald-200"
                >
                  {c.name}
                  {c.organizationName ? ` · ${c.organizationName}` : ""} ·{" "}
                  {c.studentCount ?? 0} students
                </Link>
              </li>
            ))}
          </ul>
        )}
        {myOrganizations[0] ? (
          <Link
            href={`/teacher/classes/new?organizationId=${myOrganizations[0].id}`}
            className="mt-2 inline-block text-sm text-emerald-600"
          >
            Create organization class →
          </Link>
        ) : null}
      </section>

      {metrics ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <TeacherMetricCard
            label="Classes"
            value={String(metrics.classroomCount)}
            sub={`${metrics.activeClassroomCount} active`}
          />
          <TeacherMetricCard
            label="Students"
            value={String(metrics.studentCount)}
          />
          <TeacherMetricCard
            label="Assignments"
            value={String(metrics.assignmentCount)}
          />
          <TeacherMetricCard
            label="Completed"
            value={String(metrics.completedResultCount)}
            sub="assignment results"
          />
          <TeacherMetricCard
            label="Avg quiz"
            value={
              metrics.averageQuizPercentage != null
                ? `${metrics.averageQuizPercentage}%`
                : "—"
            }
          />
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Recent class activity</h2>
        {activity.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No recent activity yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {activity.map((item) => (
              <li
                key={`${item.type}-${item.id}`}
                className="rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200"
              >
                <span className="font-medium text-slate-900">{item.label}</span>
                {item.classroomName ? (
                  <span className="text-slate-500"> · {item.classroomName}</span>
                ) : null}
                <span className="block text-xs text-slate-400">
                  {formatMongoliaDateTimeWithLabel(item.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Classes needing attention</h2>
        <div className="mt-3">
          <NeedsAttentionCard items={needsAttentionItems} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Quick reports</h2>
        <p className="mt-1 text-sm text-slate-600">
          Class progress, assignment completion, and exportable markdown reports.
        </p>
        <Link
          href="/teacher/reports"
          className="mt-3 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Open class reports →
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={
                action.primary
                  ? "rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                  : "rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Recommended classroom workflow
        </h2>
        <div className="mt-3">
          <B2BSteps steps={CLASSROOM_WORKFLOW_STEPS} />
        </div>
      </section>
    </PublicPageShell>
  );
}
