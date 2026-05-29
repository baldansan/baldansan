import Link from "next/link";
import { B2BCtaLink, B2BSection } from "@/components/b2b/b2b-section";
import { PublicPageShell } from "@/components/public-page-shell";
import { DEMO_STEPS } from "@/lib/content/b2b-copy";

export const metadata = {
  title: "Demo — Бөөндөө Сурцгаая",
  description:
    "Хятад хэлний demo learning flow — watch, vocabulary, quiz, review, progress. Сургалтын төв, багш нарт зориулсан.",
};

export default function DemoPage() {
  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
          Demo
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Demo — суралцах flow
        </h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          B2B demo — сургалтын төв, багш, сурагчид platform-ийн learning flow-г
          туршиж үзэх. Доорх алхмуудыг дараалан нээж болно.
        </p>
      </section>

      <B2BSection title="Demo overview">
        <article className="rounded-2xl bg-emerald-50/60 p-5 ring-1 ring-emerald-100">
          <p className="text-sm leading-6 text-slate-700">
            Lesson 1 (HSK5) ашиглан бүрэн flow: watch → vocabulary → quiz → review →
            progress. Энэ нь сургалтын төвийн demo presentation-д ашиглах боломжтой.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/lessons/1"
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Lesson 1 overview
            </Link>
            <Link
              href="/courses/hsk5"
              className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800"
            >
              HSK5 course
            </Link>
          </div>
        </article>
      </B2BSection>

      <B2BSection title="Learning flow алхмууд">
        <ol className="flex flex-col gap-4">
          {DEMO_STEPS.map((step) => (
            <li
              key={step.step}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                  {step.step}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">
                    Step {step.step}: {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{step.desc}</p>
                  <Link
                    href={step.href}
                    className="mt-3 inline-flex text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Нээх →
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </B2BSection>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <p className="text-sm leading-6 text-slate-600">
          <strong className="text-slate-800">Note:</strong> Demo content can be adapted
          for HSK, school curriculum, Taobao Chinese, or short drama Chinese.
        </p>
      </section>

      <B2BSection title="Teacher mode — lesson assignment">
        <article className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <p className="text-sm leading-6 text-slate-600">
            Багш Lesson 1-ийг ангидаа assignment болгон өгөх flow: class сонгох → lesson
            сонгох → due date → watch/vocab/quiz заавар. Одоогоор UI preview.
          </p>
          <ol className="mt-4 list-inside list-decimal space-y-1 text-sm text-slate-700">
            <li>Demo class (HSK5 Demo Group) сонгоно</li>
            <li>Lesson 1 — Full lesson assignment</li>
            <li>Сурагч watch → vocabulary → quiz дуусгана</li>
            <li>Багш demo class progress харна</li>
          </ol>
        <Link
          href="/teacher/assignments/new?lesson=1"
          className="mt-4 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Assignment үүсгэх →
        </Link>
        <Link
          href="/my-assignments"
          className="mt-3 inline-flex text-sm font-semibold text-emerald-600"
        >
          Student view: /my-assignments →
        </Link>
        </article>
      </B2BSection>

      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <B2BCtaLink href="/schools" label="School package харах" variant="secondary" />
        <B2BCtaLink href="/school-inquiry" label="Demo + inquiry" />
      </section>
    </PublicPageShell>
  );
}
