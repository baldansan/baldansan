"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddStudentForm } from "@/components/teacher/add-student-form";
import { StudentInviteForm } from "@/components/teacher/student-invite-form";
import { AssignmentProgressTable } from "@/components/teacher/assignment-progress-table";
import { ClassProgressTable } from "@/components/teacher/class-progress-table";
import { StudentWeakSpotsSection } from "@/components/teacher/student-weak-spots-section";
import { NeedsAttentionCard } from "@/components/teacher/needs-attention-card";
import { ReportExportCard } from "@/components/teacher/report-export-card";
import { ClassJoinCodeCard } from "@/components/teacher/class-join-code-card";
import { ClassCurriculumEditor } from "@/components/teacher/class-curriculum-editor";
import { ClassKidsSection } from "@/components/teacher/class-kids-section";
import { ClassWritingHomework } from "@/components/teacher/class-writing-homework";
import { PublicPageShell } from "@/components/public-page-shell";
import { StatTile, fmtNum, fmtPct } from "@/components/charts";
import {
  ClassAssignmentComposer,
  type ComposerPrefill,
} from "@/components/teacher/class-assignment-composer";
import { MissedQuestionsTab } from "@/components/teacher/class-dashboard/missed-questions-tab";
import { QuickQuizTab } from "@/components/teacher/class-dashboard/quick-quiz-tab";
import { StudentsTab } from "@/components/teacher/class-dashboard/students-tab";
import {
  WeakSpotsTab,
  type AssignRequest,
} from "@/components/teacher/class-dashboard/weak-spots-tab";
import { fetchClassInsights, type ClassInsights } from "@/lib/teacher/class-insights";
import { isCustomAssignment } from "@/lib/classroom/types";
import { writingListIdFromLessonId } from "@/lib/writing/types";
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

type TabKey = "students" | "weak" | "missed" | "quiz" | "assign" | "tools";

const TABS: { key: TabKey; label: string }[] = [
  { key: "students", label: "Сурагчид" },
  { key: "weak", label: "Сул тал" },
  { key: "missed", label: "Алдсан асуултууд" },
  { key: "quiz", label: "Хурдан сорил" },
  { key: "assign", label: "Даалгавар" },
  { key: "tools", label: "Бүртгэл" },
];

const TOOL_CARDS = [
  { suffix: "attendance", icon: "🗓", label: "Ирцийн бүртгэл", hint: "Өдөр бүрийн ирц" },
  { suffix: "exams", icon: "📝", label: "Ангийн шалгалт", hint: "HSK загвар шалгалт" },
  { suffix: "report", icon: "🖨", label: "Хэвлэх тайлан", hint: "Багшийн тайлан" },
] as const;

export function ClassroomDetailView({ classroomId }: Props) {
  const locale = useUiLocale();
  const [analytics, setAnalytics] = useState<ClassroomProgressAnalytics | null>(
    null
  );
  const [students, setStudents] = useState<StudentProgressRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<ClassInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("students");
  const [prefill, setPrefill] = useState<ComposerPrefill | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);

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

    // Сурагчийн ангилал, сул тал — үндсэн хуудсыг хүлээлгэхгүйгээр тусад нь.
    if (!studentsRes.error) {
      setInsightsLoading(true);
      const ins = await fetchClassInsights(classroomId, studentsRes.data ?? []);
      setInsights(ins.data);
      setInsightsError(ins.error);
      setInsightsLoading(false);
    }
  }, [classroomId]);

  const handleAssign = useCallback((req: AssignRequest) => {
    setPrefill({ ...req, key: Date.now() });
    setTab("assign");
    window.setTimeout(
      () => composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      80
    );
  }, []);

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

  const k = insights?.kpis;
  const unlinked = Math.max(
    0,
    students.length - (insights?.students.length ?? students.filter((x) => x.studentUserId).length)
  );

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
        {insightsError ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Оролдлогын мэдээллийг бүрэн уншиж чадсангүй: {insightsError}
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

      <section
        aria-label="Ангийн үзүүлэлтүүд"
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
      >
        <StatTile
          label="Сурагчид"
          value={String(analytics.totalStudents)}
          hint={`${k?.linkedStudents ?? students.filter((x) => x.studentUserId).length} апп-д холбогдсон`}
        />
        <StatTile
          label="Идэвхтэй (7 хоног)"
          value={insightsLoading ? "…" : fmtPct(k?.active7dPct)}
          hint="сүүлийн 7 хоногт орсон"
        />
        <StatTile
          label="Ирц (30 хоног)"
          value={insightsLoading ? "…" : fmtPct(k?.attendancePct)}
          hint="ирцийн дундаж"
        />
        <StatTile
          label="Дундаж оноо"
          value={insightsLoading ? "…" : fmtNum(k?.avgPoints)}
          hint="сурагч тутамд"
        />
        <StatTile
          label="Сүүлийн шалгалт"
          value={insightsLoading ? "…" : fmtPct(k?.lastExamPassPct)}
          hint={k?.lastExamTitle ? `тэнцсэн · ${k.lastExamTitle}` : "тэнцсэн хувь"}
        />
        <StatTile
          label="Даалгавар"
          value={insightsLoading ? "…" : fmtPct(k?.assignmentsDonePct)}
          hint={`гүйцэтгэсэн · нийт ${analytics.assignmentsCount}`}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TOOL_CARDS.map((c) => (
          <Link
            key={c.suffix}
            href={`/teacher/classes/${classroomId}/${c.suffix}`}
            className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition-colors hover:ring-emerald-300"
          >
            <p className="text-sm font-semibold text-slate-900">
              <span aria-hidden="true">{c.icon} </span>
              {c.label} →
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{c.hint}</p>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setTab("assign")}
          className="rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200 transition-colors hover:ring-emerald-300"
        >
          <p className="text-sm font-semibold text-slate-900">
            <span aria-hidden="true">📚 </span>
            {tr(locale, "Заавал хөтөлбөр")} →
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Ангийн заавал дуусгах хичээл</p>
        </button>
      </section>

      <nav
        role="tablist"
        aria-label="Ангийн хэсгүүд"
        className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 px-1"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "border-emerald-500 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "students" ? (
        <section role="tabpanel" id="panel-students" aria-labelledby="tab-students" className="flex flex-col gap-6">
          {insightsLoading ? (
            <p className="text-sm text-slate-600">Сурагчдын мэдээллийг тооцоолж байна…</p>
          ) : insights ? (
            <StudentsTab classroomId={classroomId} students={insights.students} unlinkedCount={unlinked} />
          ) : (
            <p className="text-sm text-slate-600">Мэдээлэл ачаалж чадсангүй.</p>
          )}
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Анхаарах зүйл</h2>
            <div className="mt-3">
              <NeedsAttentionCard items={analytics.needsAttention} />
            </div>
          </div>
        </section>
      ) : null}

      {tab === "weak" ? (
        <section role="tabpanel" id="panel-weak" aria-labelledby="tab-weak" className="flex flex-col gap-6">
          {insightsLoading ? (
            <p className="text-sm text-slate-600">Тооцоолж байна…</p>
          ) : insights ? (
            <WeakSpotsTab insights={insights} onAssign={handleAssign} />
          ) : null}
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Сурагч бүрийн сул тал</h2>
            <p className="mt-1 text-sm text-slate-600">
              Сурагч хаана, ямар хичээл дээр алдаж байгаа нь хамгийн их алдсанаас эхэлж жагсана.
              Хажуугийн товчоор тэр хичээлийг тухайн сурагчид онилж давтуулна.
            </p>
            <div className="mt-3">
              <StudentWeakSpotsSection classroomId={classroomId} onAssigned={() => void load()} />
            </div>
          </div>
        </section>
      ) : null}

      {tab === "missed" ? (
        <section role="tabpanel" id="panel-missed" aria-labelledby="tab-missed" className="flex flex-col gap-3">
          <p className="text-sm text-slate-600">
            Ангид хамгийн олон сурагч алдсан 15 асуулт. «Давтуулах» дарахад алдсан сурагчдад
            зориулсан давталтын даалгавар бэлдэнэ.
          </p>
          {insightsLoading ? (
            <p className="text-sm text-slate-600">Тооцоолж байна…</p>
          ) : insights ? (
            <MissedQuestionsTab insights={insights} onAssign={handleAssign} />
          ) : null}
        </section>
      ) : null}

      {tab === "quiz" ? (
        <section role="tabpanel" id="panel-quiz" aria-labelledby="tab-quiz">
          <QuickQuizTab classroomId={classroomId} />
        </section>
      ) : null}

      {tab === "assign" ? (
        <section role="tabpanel" id="panel-assign" aria-labelledby="tab-assign" className="flex flex-col gap-8">
          <div ref={composerRef}>
            <h2 className="text-lg font-semibold text-slate-900">Даалгавар өгөх</h2>
            <p className="mt-1 text-sm text-slate-600">
              Бэлэн хичээлийг сонгож өгөх, эсвэл ангид хийх ажлаа өөрөө бичиж өгнө. Сурагч сонговол
              тус бүрт тусдаа даалгавар үүснэ.
            </p>
            <div className="mt-3">
              <ClassAssignmentComposer
                classroomId={classroomId}
                prefill={prefill}
                onCreated={() => void load()}
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">Даалгаврууд</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {analytics.assignmentSummaries
                .filter((a) => !a.isCurriculum)
                .map((a) => (
                  <li key={a.assignmentId} className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
                    <Link
                      href={`/teacher/assignments/${a.assignmentId}`}
                      className="font-medium text-emerald-700 hover:text-emerald-800"
                    >
                      <span translate="no">{a.title}</span>
                    </Link>
                    <p className="text-xs text-slate-500">
                      {writingListIdFromLessonId(a.lessonId)
                        ? `✍️ ${tr(locale, "Бичих дэвтэр")}`
                        : isCustomAssignment(a.lessonId)
                          ? "Хичээл хавсаргаагүй"
                          : `Хичээл ${a.lessonId}`}
                      {a.dueDate ? ` · Дуусах ${a.dueDate}` : ""} · {a.completedCount}/{a.totalCount} (
                      {a.completionRate}%)
                      {a.averageQuizPercentage != null ? ` · дундаж ${a.averageQuizPercentage}%` : ""}
                    </p>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">{tr(locale, "Заавал хөтөлбөр")}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {tr(locale, "Ангийн бүх сурагч заавал дуусгах хичээлүүд. Бусад хичээл сонголтоор хэвээр үлдэнэ.")}
            </p>
            <div className="mt-3">
              <ClassCurriculumEditor classroomId={classroomId} />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">✍️ {tr(locale, "Бичих даалгавар өгөх")}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {tr(locale, "Ханз, үгээ оруулаад хэдэн удаа дагаж, санаж бичихийг заана — сурагч апп дээрээ дэвтэртээ бичнэ.")}
            </p>
            <div className="mt-3">
              <ClassWritingHomework classroomId={classroomId} onCreated={() => void load()} />
            </div>
          </div>

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
        </section>
      ) : null}

      {tab === "tools" ? (
        <section role="tabpanel" id="panel-tools" aria-labelledby="tab-tools" className="flex flex-col gap-8">
          <ClassJoinCodeCard classroomId={classroomId} code={classroom.joinCode ?? null} />

          <div>
            <h2 className="text-lg font-semibold text-slate-900">Сурагчдын ахиц (даалгавраар)</h2>
            <div className="mt-3">
              <ClassProgressTable rows={students} />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ангийн тайлан</h2>
            <div className="mt-3">
              <ReportExportCard
                markdown={reportMarkdown}
                filename={`class-report-${classroomId.slice(0, 8)}.md`}
              />
            </div>
          </div>

          <div>
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
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">Сурагч гараар нэмэх</h2>
            <AddStudentForm classroomId={classroomId} onAdded={() => void load()} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {tr(locale, "Хүүхдийн бүртгэл (имэйлгүй сурагч)")}
            </h2>
            <div className="mt-3">
              <ClassKidsSection classroomId={classroomId} onChanged={() => void load()} />
            </div>
          </div>
        </section>
      ) : null}
    </PublicPageShell>
  );
}
