import Link from "next/link";
import { PwaInstallCard } from "@/components/pwa-install-card";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata = {
  title: "Onboarding — Бөөндөө Сурцгаая",
  description: "App хэрхэн ажилладаг вэ — course, watch, vocabulary, quiz, review.",
};

const steps = [
  {
    title: "Course сонго",
    body: "HSK5 эсвэл бусад чиглэлээ сонгоно. Одоогоор HSK5 бэлэн.",
  },
  {
    title: "Watch lesson",
    body: "Богино бичлэг, subtitle, pinyin, Монгол орчуулгатай үзнэ.",
  },
  {
    title: "Vocabulary сур",
    body: "Хичээлийн үгсийг HSK түвшин, жишээ өгүүлбэртэй сурна.",
  },
  {
    title: "Quiz өг",
    body: "Сурсан зүйлээ quiz-ээр шалгаж, оноо хадгална.",
  },
  {
    title: "Review хий",
    body: "Review хэсэгт сурсан үгээ давтан бататгана.",
  },
  {
    title: "Progress account дээр хадгал",
    body: "Нэвтэрсэн хэрэглэгчийн ахиц Supabase account дээр хадгалагдана. Guest — device дээр.",
  },
];

export default function OnboardingPage() {
  return (
    <PublicPageShell active="help">
      <section>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          App хэрхэн ажилладаг вэ?
        </h1>
        <p className="mt-2 text-slate-600">
          Шинэ хэрэглэгчид зориулсан богино заавар.
        </p>
      </section>

      <PwaInstallCard />

      <ol className="flex flex-col gap-4">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
          >
            <span className="text-sm font-semibold text-emerald-600">
              Алхам {index + 1}
            </span>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
          </li>
        ))}
      </ol>

      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/courses/hsk5"
          className="rounded-full bg-emerald-500 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Start HSK5
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-center text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Create account / Login
        </Link>
        <Link
          href="/courses/hsk5"
          className="rounded-full border border-slate-200 px-6 py-3 text-center text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Continue as guest
        </Link>
      </section>
    </PublicPageShell>
  );
}
