"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AddStudentForm } from "@/components/teacher/add-student-form";
import { StudentInviteForm } from "@/components/teacher/student-invite-form";
import { AssignmentProgressTable } from "@/components/teacher/assignment-progress-table";
import { ClassProgressTable } from "@/components/teacher/class-progress-table";
import { ClassAssignmentComposer } from "@/components/teacher/class-assignment-composer";
import { StudentWeakSpotsSection } from "@/components/teacher/student-weak-spots-section";
import { NeedsAttentionCard } from "@/components/teacher/needs-attention-card";
import { ReportExportCard } from "@/components/teacher/report-export-card";
import { TeacherMetricCard } from "@/components/teacher/teacher-metric-card";
import { ClassJoinCodeCard } from "@/components/teacher/class-join-code-card";
import { ClassKidsSection } from "@/components/teacher/class-kids-section";
import { PublicPageShell } from "@/components/public-page-shell";
import { isCustomAssignment } from "@/lib/classroom/types";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type {
  ClassroomProgressAnalytics,
  StudentProgressRow,
} from "@/lib/teacher/analytics-types";
import { buildClassReportMarkdown } from "@/lib/teacher/report-builder";
import {
  getClassroomProgressAnalytics,
  getClassroomStudentProgress,
} from "@/lib/supabase/teacher-analytics";

type Props = {
  classroomId: string;
};

export function ClassroomDetailView({ classroomId }: Props) {
  const locale = useUiLocale();
  const [analytics, setAnalytics] = useState<ClassroomProgressAnalytics | null>(
    null
  );
  const [students, setStudents] = useState<StudentProgressRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [analyticsRes, studentsRes] = await Promise.all([
      getClassroomProgressAnalytics(classroomId),
      getClassroomStudentProgress(classroomId),
    ]);
    setLoading(false);
    if (analyticsRes.error) setError(analyticsRes.error);
    else setAnalytics(analyticsRes.data);
    if (studentsRes.error) setError(studentsRes.error);
    else setStudents(studentsRes.data ?? []);
    setWarnings([...analyticsRes.warnings, ...studentsRes.warnings]);
  }, [classroomId]);

  useEffect(() => {
    void load();
  }, [load]);

  const reportMarkdown = useMemo(() => {
    if (!analytics) return "";
    return buildClassReportMarkdown(analytics, students);
  }, [analytics, students]);

  if (loading) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      </PublicPageShell>
    );
  }

  if (!analytics) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">{error ?? "Анги олдсонгүй."}</p>
        <Link href="/teacher/classes" className="mt-2 text-sm text-emerald-600">
          ← Миний ангиуд
        </Link>
      </PublicPageShell>
    );
  }

  const { classroom } = analytics;

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href="/teacher/classes"
          className="text-sm font-medium text-slate-600 hover:text-emerald-600"
        >
          ← Миний ангиуд
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight" translate="no">{classroom.name}</h1>
        {classroom.level ? (
          <p className="mt-1 text-sm text-emerald-700">{classroom.level}</p>
        ) : null}
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

      <section>
        <ClassJoinCodeCard classroomId={classroomId} code={classroom.joinCode ?? null} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TeacherMetricCard
          label="Сурагчид"
          value={String(analytics.totalStudents)}
          sub={`${analytics.activeStudents} идэвхтэй`}
        />
        <TeacherMetricCard
          label="Даалгавар"
          value={String(analytics.assignmentsCount)}
        />
        <TeacherMetricCard
          label="Гүйцэтгэлийн хувь"
          value={`${analytics.completionRate}%`}
        />
        <TeacherMetricCard
          label="Дасгалын дундаж"
          value={
            analytics.averageQuizPercentage != null
              ? `${analytics.averageQuizPercentage}%`
              : "—"
          }
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Анхаарах зүйл</h2>
        <div className="mt-3">
          <NeedsAttentionCard items={analytics.needsAttention} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Сурагчдын ахиц</h2>
        <div className="mt-3">
          <ClassProgressTable rows={students} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Сурагч бүрийн сул тал
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Сурагч хаана, ямар хичээл дээр алдаж байгаа нь хамгийн их алдсанаас
          эхэлж жагсана. Хажуугийн товчоор тэр хичээлийг тухайн сурагчид онилж
          давтуулна.
        </p>
        <div className="mt-3">
          <StudentWeakSpotsSection
            classroomId={classroomId}
            onAssigned={() => void load()}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Ангид даалгавар өгөх
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Бэлэн хичээлийг сонгож өгөх, эсвэл ангид хийх ажлаа өөрөө бичиж өгнө.
        </p>
        <div className="mt-3">
          <ClassAssignmentComposer
            classroomId={classroomId}
            onCreated={() => void load()}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Даалгаврууд</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {analytics.assignmentSummaries.map((a) => (
            <li
              key={a.assignmentId}
              className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200"
            >
              <Link
                href={`/teacher/assignments/${a.assignmentId}`}
                className="font-medium text-emerald-700 hover:text-emerald-800"
              >
                <span translate="no">{a.title}</span>
              </Link>
              <p className="text-xs text-slate-500">
                {isCustomAssignment(a.lessonId)
                  ? "Хичээл хавсаргаагүй"
                  : `Хичээл ${a.lessonId}`}
                {a.dueDate ? ` · Дуусах ${a.dueDate}` : ""} · {a.completedCount}/
                {a.totalCount} ({a.completionRate}%)
                {a.averageQuizPercentage != null
                  ? ` · дундаж ${a.averageQuizPercentage}%`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Ангийн хэрэгсэл</h2>
        <p className="mt-1 text-sm text-slate-600">
          Ирц, шалгалт, хэвлэх тайлан — тус тусдаа хуудсанд.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/teacher/classes/${classroomId}/attendance`}
            className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-800"
          >
            🗓 Ирцийн бүртгэл →
          </Link>
          <Link
            href={`/teacher/classes/${classroomId}/exams`}
            className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-800"
          >
            📝 Ангийн шалгалт →
          </Link>
          <Link
            href={`/teacher/classes/${classroomId}/report`}
            className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-800"
          >
            🖨 Хэвлэх тайлан →
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Ангийн тайлан</h2>
        <div className="mt-3">
          <ReportExportCard
            markdown={reportMarkdown}
            filename={`class-report-${classroomId.slice(0, 8)}.md`}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Сурагч урих</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/teacher/classes/${classroomId}/students/import`}
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
          >
            Сурагчдыг бөөнөөр оруулах →
          </Link>
          <Link
            href={`/teacher/classes/${classroomId}/invitations`}
            className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Урилгууд →
          </Link>
        </div>
        <div className="mt-3">
          <StudentInviteForm
            classroomId={classroomId}
            organizationId={classroom.organizationId}
            classroomName={classroom.name}
            onCreated={() => void load()}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Сурагч гараар нэмэх</h2>
        <AddStudentForm classroomId={classroomId} onAdded={() => void load()} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          {tr(locale, "Хүүхдийн бүртгэл (имэйлгүй сурагч)")}
        </h2>
        <div className="mt-3">
          <ClassKidsSection classroomId={classroomId} onChanged={() => void load()} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/teacher/assignments/new?classroom=${classroomId}`}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Даалгаврын дэлгэрэнгүй маягт
        </Link>
        <Link
          href="/teacher/reports"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Бүх тайлан
        </Link>
      </div>
    </PublicPageShell>
  );
}
