import Link from "next/link";
import { B2BCard, B2BCtaLink, B2BSection, B2BSteps } from "@/components/b2b/b2b-section";
import { PublicPageShell } from "@/components/public-page-shell";
import {
  B2B_PACKAGES,
  PAYMENT_INACTIVE_NOTE,
  SCHOOL_AUDIENCE,
  SCHOOL_HERO,
  SCHOOL_PROBLEMS,
  SCHOOL_SOLUTIONS,
  SCHOOL_WORKFLOW,
} from "@/lib/content/b2b-copy";
import { SCHOOL_ROLLOUT_STEPS } from "@/lib/content/classroom-copy";

export const metadata = {
  title: "Сургалтын төвд зориулсан Хятад хэлний platform — Бөөндөө Сурцгаая",
  description:
    "Сургалтын төв, сургууль, багш нарт зориулсан Хятад хэлний digital lesson platform — subtitle, vocabulary, quiz, progress tracking.",
};

export default function SchoolsPage() {
  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
          {SCHOOL_HERO.label}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Сургалтын төв, сургуульд зориулсан Хятад хэлний digital lesson platform
        </h1>
        <p className="mt-4 text-lg font-medium text-slate-800">{SCHOOL_HERO.title}</p>
        <p className="mt-2 text-sm leading-7 text-slate-600">{SCHOOL_HERO.subtitle}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <B2BCtaLink href="/demo" label="Demo үзэх" />
          <B2BCtaLink href="/teachers" label="Багшийн багц харах" variant="secondary" />
          <B2BCtaLink href="/school-inquiry" label="Inquiry илгээх (admin CRM)" />
        </div>
      </section>

      <B2BSection title="Асуудал" subtitle="Сургалтын төв, сургуулийн түгээмэл сорилт">
        <ul className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          {SCHOOL_PROBLEMS.map((item) => (
            <li key={item} className="border-b border-slate-100 py-3 text-sm text-slate-700 last:border-0">
              {item}
            </li>
          ))}
        </ul>
      </B2BSection>

      <B2BSection title="Шийдэл" subtitle="Бөөндөө Сурцгаая-ийн бүрэлдэхүүн">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCHOOL_SOLUTIONS.map((item) => (
            <B2BCard key={item.title} title={item.title} desc={item.desc} />
          ))}
        </div>
      </B2BSection>

      <B2BSection title="Хэнд зориулагдсан бэ?">
        <div className="flex flex-wrap gap-2">
          {SCHOOL_AUDIENCE.map((item) => (
            <span
              key={item}
              className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200"
            >
              {item}
            </span>
          ))}
        </div>
      </B2BSection>

      <B2BSection title="Сургуулийн workflow">
        <B2BSteps steps={SCHOOL_WORKFLOW} />
      </B2BSection>

      <B2BSection title="Pilot onboarding workflow">
        <B2BSteps
          steps={[
            "Inquiry илгээнэ",
            "Organization setup",
            "Teacher profile",
            "Classroom",
            "First assignment",
            "Pilot report",
          ]}
        />
        <Link
          href="/school-inquiry"
          className="mt-4 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
        >
          Start school pilot →
        </Link>
      </B2BSection>

      <B2BSection title="School reporting">
        <p className="-mt-2 text-sm text-slate-600">
          Pilot class reports, assignment progress, learner outcomes from quiz results,
          and a teacher review workflow via exportable markdown reports. Submit setup
          requests via{" "}
          <Link href="/school-inquiry" className="font-semibold text-emerald-600">
            /school-inquiry
          </Link>{" "}
          — saved to admin CRM.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <B2BCard
            title="Pilot class report"
            desc="Summary metrics per classroom — students, completion rate, average quiz."
          />
          <B2BCard
            title="Assignment progress"
            desc="Track which lessons were assigned, due dates, and completion across the class."
          />
          <B2BCard
            title="Learner outcomes"
            desc="Quiz percentages and completion timestamps synced to assignment_results."
          />
          <B2BCard
            title="Teacher review workflow"
            desc="Needs-attention alerts, copy/download reports, and class detail review pages."
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/teacher/reports"
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Class reports
          </Link>
          <Link
            href="/teacher-dashboard"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800"
          >
            Teacher dashboard
          </Link>
        </div>
      </B2BSection>

      <B2BSection title="Сургалтын төвийн rollout">
        <p className="-mt-2 text-sm text-slate-600">
          Classrooms болон assignments одоо foundation түвшинд идэвхтэй — teacher
          setup → create class → add students → assign lesson → track via assignment
          results.
        </p>
        <B2BSteps steps={SCHOOL_ROLLOUT_STEPS} />
        <div className="flex flex-wrap gap-3">
          <Link
            href="/teacher/setup"
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Teacher setup
          </Link>
          <Link
            href="/teacher-dashboard"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800"
          >
            Teacher dashboard
          </Link>
        </div>
      </B2BSection>

      <B2BSection title="Package сонголтууд">
        <p className="-mt-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {PAYMENT_INACTIVE_NOTE}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {B2B_PACKAGES.map((pkg) => (
            <B2BCard
              key={pkg.key}
              title={pkg.name}
              desc={pkg.desc}
              badge="Placeholder"
            />
          ))}
        </div>
      </B2BSection>

      <section className="rounded-3xl bg-emerald-600 p-8 text-white">
        <h2 className="text-xl font-semibold sm:text-2xl">
          Сургалтын төвийн demo авах
        </h2>
        <p className="mt-2 text-sm leading-6 text-emerald-50">
          Demo хичээл үзэж, package-ийн талаар асууж, onboarding-ийн төлөвлөгөө аваарай.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/school-inquiry"
            className="rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Сургалтын төвийн demo авах
          </Link>
          <Link
            href="/demo"
            className="rounded-full border border-emerald-400 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Demo үзэх
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
