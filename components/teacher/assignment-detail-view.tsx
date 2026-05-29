"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AssignmentProgressTable } from "@/components/teacher/assignment-progress-table";
import { NeedsAttentionCard } from "@/components/teacher/needs-attention-card";
import { ReportExportCard } from "@/components/teacher/report-export-card";
import { TeacherMetricCard } from "@/components/teacher/teacher-metric-card";
import { PublicPageShell } from "@/components/public-page-shell";
import type { AssignmentAnalytics } from "@/lib/teacher/analytics-types";
import { buildAssignmentReportMarkdown } from "@/lib/teacher/report-builder";
import { getAssignmentAnalytics } from "@/lib/supabase/teacher-analytics";

type Props = {
  assignmentId: string;
};

export function AssignmentDetailView({ assignmentId }: Props) {
  const [analytics, setAnalytics] = useState<AssignmentAnalytics | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await getAssignmentAnalytics(assignmentId);
      setLoading(false);
      if (res.error) setError(res.error);
      else setAnalytics(res.data);
      setWarnings(res.warnings);
    }
    void load();
  }, [assignmentId]);

  const reportMarkdown = useMemo(() => {
    if (!analytics) return "";
    return buildAssignmentReportMarkdown(analytics);
  }, [analytics]);

  const needsAttention = useMemo(() => {
    if (!analytics) return [];
    return analytics.missingStudents.map((m) => ({
      kind: "student_no_completions" as const,
      label: m.displayName,
      detail: m.reason,
    }));
  }, [analytics]);

  if (loading) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Loading…</p>
      </PublicPageShell>
    );
  }

  if (!analytics) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">{error ?? "Assignment not found."}</p>
        <Link href="/teacher/assignments" className="mt-2 text-sm text-emerald-600">
          ← Assignments
        </Link>
      </PublicPageShell>
    );
  }

  const { assignment } = analytics;

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href="/teacher/assignments"
          className="text-sm font-medium text-slate-600 hover:text-emerald-600"
        >
          ← Даалгаврууд
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{assignment.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {assignment.classroomName} · Lesson {assignment.lessonId} ·{" "}
          {assignment.assignmentType}
        </p>
        {assignment.dueDate ? (
          <p className="text-sm text-slate-500">Due: {assignment.dueDate}</p>
        ) : null}
        {assignment.instructions ? (
          <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            {assignment.instructions}
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
          label="Students"
          value={String(analytics.totalStudents)}
        />
        <TeacherMetricCard label="Started" value={String(analytics.startedCount)} />
        <TeacherMetricCard
          label="Completed"
          value={String(analytics.completedCount)}
        />
        <TeacherMetricCard
          label="Completion rate"
          value={`${analytics.completionRate}%`}
          sub={
            analytics.averageQuizPercentage != null
              ? `Avg quiz ${analytics.averageQuizPercentage}%`
              : undefined
          }
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Not started</h2>
        <div className="mt-3">
          <NeedsAttentionCard items={needsAttention} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Student results</h2>
        <div className="mt-3">
          <AssignmentProgressTable rows={analytics.studentResults} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Assignment report</h2>
        <div className="mt-3">
          <ReportExportCard
            markdown={reportMarkdown}
            filename={`assignment-report-${assignmentId.slice(0, 8)}.md`}
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/lessons/${assignment.lessonId}`}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
        >
          Lesson preview
        </Link>
        <Link
          href={`/teacher/classes/${assignment.classroomId}`}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Class page
        </Link>
      </div>
    </PublicPageShell>
  );
}
