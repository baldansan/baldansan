"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicPageShell } from "@/components/public-page-shell";
import { ReportExportCard } from "@/components/teacher/report-export-card";
import { TeacherMetricCard } from "@/components/teacher/teacher-metric-card";
import { useTeacherAuth } from "@/components/teacher/teacher-auth-gate";
import type {
  ClassroomProgressAnalytics,
  TeacherAssignmentSummaryItem,
  TeacherOverviewMetrics,
} from "@/lib/teacher/analytics-types";
import {
  buildClassReportMarkdown,
  buildTeacherOverviewReportMarkdown,
} from "@/lib/teacher/report-builder";
import {
  getClassroomProgressAnalytics,
  getClassroomStudentProgress,
  getTeacherAssignmentSummary,
  getTeacherOverviewMetrics,
} from "@/lib/supabase/teacher-analytics";
import { getTeacherClassrooms } from "@/lib/supabase/classrooms";

type ClassReportRow = {
  classroomId: string;
  name: string;
  analytics: ClassroomProgressAnalytics;
  reportMarkdown: string;
};

export function TeacherReportsView() {
  const { loggedIn } = useTeacherAuth();
  const [metrics, setMetrics] = useState<TeacherOverviewMetrics | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignmentSummaryItem[]>(
    []
  );
  const [classReports, setClassReports] = useState<ClassReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [metricsRes, assignRes, classroomsRes] = await Promise.all([
      getTeacherOverviewMetrics(),
      getTeacherAssignmentSummary(),
      getTeacherClassrooms(),
    ]);

    const allWarnings = [...metricsRes.warnings, ...assignRes.warnings];
    if (metricsRes.error) setError(metricsRes.error);
    else setMetrics(metricsRes.data);
    if (assignRes.error) setError(assignRes.error);
    else setAssignments(assignRes.data ?? []);

    const classrooms = classroomsRes.data ?? [];
    const reportRows: ClassReportRow[] = [];

    for (const c of classrooms) {
      const [analyticsRes, studentsRes] = await Promise.all([
        getClassroomProgressAnalytics(c.id),
        getClassroomStudentProgress(c.id),
      ]);
      allWarnings.push(...analyticsRes.warnings, ...studentsRes.warnings);
      if (analyticsRes.data) {
        reportRows.push({
          classroomId: c.id,
          name: c.name,
          analytics: analyticsRes.data,
          reportMarkdown: buildClassReportMarkdown(
            analyticsRes.data,
            studentsRes.data ?? []
          ),
        });
      }
    }

    setClassReports(reportRows);
    setWarnings(allWarnings);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      setLoading(false);
      return;
    }
    void load();
  }, [loggedIn, load]);

  const overviewMarkdown = useMemo(() => {
    if (!metrics) return "";
    return buildTeacherOverviewReportMarkdown(metrics, assignments);
  }, [metrics, assignments]);

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
          <h1 className="text-2xl font-bold">Class reports</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to view reports.</p>
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
        <Link
          href="/teacher-dashboard"
          className="text-sm font-medium text-slate-600 hover:text-emerald-600"
        >
          ← Teacher dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Class reports</h1>
        <p className="mt-2 text-sm text-slate-600">
          Overview metrics, per-class progress, and assignment summaries.
        </p>
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

      {metrics ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TeacherMetricCard
              label="Classes"
              value={String(metrics.classroomCount)}
            />
            <TeacherMetricCard
              label="Students"
              value={String(metrics.studentCount)}
            />
            <TeacherMetricCard
              label="Completed results"
              value={String(metrics.completedResultCount)}
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
            <h2 className="text-lg font-semibold text-slate-900">
              Teacher overview report
            </h2>
            <div className="mt-3">
              <ReportExportCard
                markdown={overviewMarkdown}
                filename="teacher-overview-report.md"
                label="Copy overview report"
              />
            </div>
          </section>
        </>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Class reports</h2>
        {classReports.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No classes yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {classReports.map((row) => (
              <li
                key={row.classroomId}
                className="rounded-2xl bg-white p-5 ring-1 ring-slate-200"
              >
                <h3 className="font-semibold text-slate-900">{row.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {row.analytics.totalStudents} students ·{" "}
                  {row.analytics.assignmentsCount} assignments ·{" "}
                  {row.analytics.completionRate}% completion · avg quiz{" "}
                  {row.analytics.averageQuizPercentage ?? "—"}%
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/teacher/classes/${row.classroomId}`}
                    className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    View class
                  </Link>
                  <ReportExportCard
                    markdown={row.reportMarkdown}
                    filename={`class-${row.classroomId.slice(0, 8)}.md`}
                    label="Copy report"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Assignment reports</h2>
        {assignments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No assignments yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {assignments.map((a) => (
              <li
                key={a.assignmentId}
                className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200"
              >
                <Link
                  href={`/teacher/assignments/${a.assignmentId}`}
                  className="font-medium text-emerald-700 hover:text-emerald-800"
                >
                  {a.title}
                </Link>
                <p className="text-xs text-slate-500">
                  {a.classroomName} · Lesson {a.lessonId}
                  {a.dueDate ? ` · Due ${a.dueDate}` : ""} · {a.completionRate}%
                  completion · avg {a.averageQuizPercentage ?? "—"}%
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PublicPageShell>
  );
}
