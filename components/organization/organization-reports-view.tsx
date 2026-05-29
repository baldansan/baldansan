"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OrganizationRoleBadge } from "@/components/organization/organization-role-badge";
import { PublicPageShell } from "@/components/public-page-shell";
import { NeedsAttentionCard } from "@/components/teacher/needs-attention-card";
import { ReportExportCard } from "@/components/teacher/report-export-card";
import { TeacherMetricCard } from "@/components/teacher/teacher-metric-card";
import { useTeacherAuth } from "@/components/teacher/teacher-auth-gate";
import type { OrganizationMemberRole } from "@/lib/b2b/types";
import type { OrganizationReportsData } from "@/lib/organization/analytics-types";
import { buildOrganizationReportMarkdown } from "@/lib/organization/report-builder";
import { canViewReports } from "@/lib/supabase/organization-permissions";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import { getOrganizationReportsData } from "@/lib/supabase/organization-analytics";
import { getMyMembershipForOrganization } from "@/lib/supabase/organizations";

type Props = {
  organizationId: string;
};

export function OrganizationReportsView({ organizationId }: Props) {
  const { loggedIn } = useTeacherAuth();
  const [data, setData] = useState<OrganizationReportsData | null>(null);
  const [memberRole, setMemberRole] = useState<OrganizationMemberRole | null>(
    null
  );
  const [canAccess, setCanAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const load = useCallback(async () => {
    const [membershipRes, isAdmin] = await Promise.all([
      getMyMembershipForOrganization(organizationId),
      isCurrentUserAdmin(),
    ]);
    const role = membershipRes.data?.memberRole ?? null;
    setMemberRole(role);
    const allowed =
      isAdmin || (role ? canViewReports({ role }) : false);
    setCanAccess(allowed);

    if (!allowed) {
      setLoading(false);
      if (membershipRes.error) setError(membershipRes.error);
      return;
    }

    const res = await getOrganizationReportsData(organizationId);
    setLoading(false);
    if (res.error) setError(res.error);
    else setData(res.data);
    setWarnings(res.warnings);
  }, [organizationId]);

  useEffect(() => {
    if (!loggedIn) {
      setLoading(false);
      return;
    }
    void load();
  }, [loggedIn, load]);

  const reportMarkdown = useMemo(() => {
    if (!data) return "";
    return buildOrganizationReportMarkdown(data);
  }, [data]);

  if (loggedIn === null || loading) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Loading organization reports…</p>
      </PublicPageShell>
    );
  }

  if (!loggedIn) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold">Organization reports</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to view school reports.</p>
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

  if (!canAccess) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="mt-2 text-sm text-slate-600">
            Organization reports are available to owner, manager, and teacher roles.
          </p>
          <Link
            href={`/organization/${organizationId}`}
            className="mt-4 text-sm text-emerald-600"
          >
            ← Organization dashboard
          </Link>
        </section>
      </PublicPageShell>
    );
  }

  if (!data) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">{error ?? "Reports unavailable."}</p>
        <Link
          href={`/organization/${organizationId}`}
          className="mt-2 text-sm text-emerald-600"
        >
          ← Organization dashboard
        </Link>
      </PublicPageShell>
    );
  }

  const { metrics } = data;
  const needsAttentionItems = metrics.classesNeedingAttention.map((c) => ({
    kind: "low_assignment_completion" as const,
    label: c.name,
    detail: c.reason,
  }));

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href={`/organization/${organizationId}`}
          className="text-sm text-slate-600 hover:text-emerald-600"
        >
          ← Organization dashboard
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">School admin reports</h1>
          {memberRole ? <OrganizationRoleBadge role={memberRole} /> : null}
        </div>
        <p className="mt-1 text-sm text-slate-600">{metrics.organizationName}</p>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TeacherMetricCard
          label="Classrooms"
          value={String(metrics.classroomCount)}
          sub={`${metrics.activeClassroomCount} active`}
        />
        <TeacherMetricCard
          label="Students"
          value={String(metrics.studentCount)}
          sub={`${metrics.linkedStudentCount} linked`}
        />
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
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Export organization report</h2>
        <p className="mt-1 text-sm text-slate-600">
          Markdown summary for pilot review, school reporting, and admin handoff.
        </p>
        <div className="mt-3">
          <ReportExportCard
            markdown={reportMarkdown}
            filename={`organization-${organizationId.slice(0, 8)}-report.md`}
            label="Copy organization report"
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Classes needing attention</h2>
        <div className="mt-3">
          <NeedsAttentionCard items={needsAttentionItems} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Teacher performance</h2>
        {data.teacherSummaries.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No teachers with classes yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl ring-1 ring-slate-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Classes</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Assignments</th>
                  <th className="px-4 py-3">Completion</th>
                  <th className="px-4 py-3">Avg quiz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.teacherSummaries.map((t) => (
                  <tr key={t.teacherUserId}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {t.displayName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.memberRole ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{t.classroomCount}</td>
                    <td className="px-4 py-3 text-slate-600">{t.studentCount}</td>
                    <td className="px-4 py-3 text-slate-600">{t.assignmentCount}</td>
                    <td className="px-4 py-3 text-slate-600">{t.completionRate}%</td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.averageQuizPercentage ?? "—"}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Organization class metrics</h2>
        {data.classMetrics.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No organization classrooms yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {data.classMetrics.map((c) => (
              <li
                key={c.classroomId}
                className="rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-900">{c.name}</span>
                  <Link
                    href={`/teacher/classes/${c.classroomId}`}
                    className="text-emerald-600 hover:text-emerald-800"
                  >
                    View class →
                  </Link>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {c.teacherLabel} · {c.studentCount} students · {c.assignmentCount}{" "}
                  assignments · {c.completionRate}% completion · avg quiz{" "}
                  {c.averageQuizPercentage ?? "—"}% · {c.visibility}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Student progress summary</h2>
        {data.studentSummaries.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No students enrolled yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl ring-1 ring-slate-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Classes</th>
                  <th className="px-4 py-3">Completed</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">Latest quiz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.studentSummaries.slice(0, 40).map((s) => (
                  <tr key={s.key}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{s.displayName}</div>
                      {s.email ? (
                        <div className="text-xs text-slate-500">{s.email}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {s.classroomNames.join(", ")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.progressUnavailable
                        ? "—"
                        : `${s.assignmentsCompleted}/${s.assignmentsAssigned}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.completionRate}%</td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.latestQuizPercentage ?? "—"}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Assignment completion</h2>
        {data.assignmentAnalytics.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No assignments yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {data.assignmentAnalytics.map((a) => (
              <li
                key={a.assignmentId}
                className="rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200"
              >
                <Link
                  href={`/teacher/assignments/${a.assignmentId}`}
                  className="font-medium text-emerald-700 hover:text-emerald-800"
                >
                  {a.title}
                </Link>
                <p className="text-xs text-slate-500">
                  {a.classroomName} · Lesson {a.lessonId}
                  {a.dueDate ? ` · Due ${a.dueDate}` : ""} · {a.completedCount}/
                  {a.totalCount} ({a.completionRate}%) · avg{" "}
                  {a.averageQuizPercentage ?? "—"}%
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PublicPageShell>
  );
}
