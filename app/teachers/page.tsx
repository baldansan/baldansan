import Link from "next/link";
import { B2BCard, B2BCtaLink, B2BSection, B2BSteps } from "@/components/b2b/b2b-section";
import { PublicPageShell } from "@/components/public-page-shell";
import {
  TEACHER_BENEFITS,
  TEACHER_DASHBOARD_PREVIEW,
  TEACHER_HERO,
  TEACHER_USE_CASES,
  TEACHER_WORKFLOW,
} from "@/lib/content/b2b-copy";
import { CLASSROOM_WORKFLOW_CARDS } from "@/lib/content/classroom-copy";

export const metadata = {
  title: "Багш нарт зориулсан Хятад хэлний digital lesson package — Бөөндөө Сурцгаая",
  description:
    "Багш нарт зориулсан Хятад хэлний хичээл — subtitle, pinyin, vocabulary, quiz, student progress tracking.",
};

export default function TeachersPage() {
  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
          {TEACHER_HERO.label}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Багш нарт зориулсан lesson package
        </h1>
        <p className="mt-4 text-lg font-medium text-slate-800">{TEACHER_HERO.title}</p>
        <p className="mt-2 text-sm leading-7 text-slate-600">{TEACHER_HERO.subtitle}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <B2BCtaLink href="/demo" label="Demo lesson үзэх" />
          <B2BCtaLink href="/school-inquiry" label="Inquiry илгээх" variant="secondary" />
        </div>
      </section>

      <B2BSection title="Багш юу авах вэ?">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEACHER_BENEFITS.map((item) => (
            <B2BCard key={item.title} title={item.title} desc={item.desc} />
          ))}
        </div>
      </B2BSection>

      <B2BSection title="Багшийн use case">
        <div className="flex flex-wrap gap-2">
          {TEACHER_USE_CASES.map((item) => (
            <span
              key={item}
              className="rounded-full bg-slate-50 px-4 py-2 text-sm text-slate-700 ring-1 ring-slate-200"
            >
              {item}
            </span>
          ))}
        </div>
      </B2BSection>

      <B2BSection title="Багшийн workflow">
        <B2BSteps steps={TEACHER_WORKFLOW} />
      </B2BSection>

      <B2BSection title="Teacher pilot checklist">
        <B2BSteps
          steps={[
            "Teacher profile (/teacher/setup)",
            "Create class (personal or organization)",
            "Create assignment",
            "Review report (/teacher/reports)",
          ]}
        />
      </B2BSection>

      <B2BSection title="Classroom workflow">
        <p className="-mt-2 text-sm text-slate-600">
          Teacher profiles, classrooms, assignments, student{" "}
          <Link href="/my-assignments" className="font-semibold text-emerald-600">
            /my-assignments
          </Link>
          , and class progress analytics are live.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CLASSROOM_WORKFLOW_CARDS.map((item) => (
            <B2BCard key={item.title} title={item.title} desc={item.desc} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/teacher-dashboard"
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Teacher dashboard →
          </Link>
          <Link
            href="/teacher/reports"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800"
          >
            Class reports
          </Link>
          <Link
            href="/teacher/classes"
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700"
          >
            My classes
          </Link>
        </div>
      </B2BSection>

      <B2BSection title="Teacher reports and classroom analytics">
        <p className="-mt-2 text-sm text-slate-600">
          Track class progress, assignment completion, student performance, quiz averages,
          and export simple markdown reports for review or sharing.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <B2BCard
            title="Class progress"
            desc="Students, completion rates, learned vocabulary (where RLS allows), and needs-attention alerts."
          />
          <B2BCard
            title="Assignment completion"
            desc="Per-assignment started/completed counts, quiz scores, and missing students."
          />
          <B2BCard
            title="Student progress"
            desc="Per-student assignment completion, latest quiz, and last activity from assignment results."
          />
          <B2BCard
            title="Downloadable reports"
            desc="Copy or download markdown class and assignment reports from the dashboard or /teacher/reports."
          />
        </div>
        <Link
          href="/teacher/reports"
          className="mt-4 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          View class reports →
        </Link>
      </B2BSection>

      <B2BSection
        title="Teacher dashboard"
        subtitle="Real metrics from your classrooms"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {TEACHER_DASHBOARD_PREVIEW.map((item) => (
            <B2BCard key={item.title} title={item.title} desc={item.desc} />
          ))}
        </div>
        <Link
          href="/teacher-dashboard"
          className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Open teacher dashboard →
        </Link>
      </B2BSection>

      <section className="flex flex-wrap gap-3">
        <Link
          href="/courses/hsk5"
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Course харах
        </Link>
        <Link
          href="/school-inquiry"
          className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Training center setup request →
        </Link>
      </section>
    </PublicPageShell>
  );
}
