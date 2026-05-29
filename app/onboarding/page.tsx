import Link from "next/link";
import { PwaInstallCard } from "@/components/pwa-install-card";
import { PublicPageShell } from "@/components/public-page-shell";
import { ctaOutlineClass, ctaPrimaryClass } from "@/components/ui/cta-button-row";

export const metadata = {
  title: "Заавар — Бөөндөө Сурцгаая",
  description: "App хэрхэн ажилладаг вэ — курс, хичээл үзэх, үгийн сан, quiz, давталт.",
};

const steps = [
  {
    title: "Курс сонго",
    body: "HSK5 эсвэл бусад чиглэлээ сонгоно. Одоогоор HSK5 бэлэн.",
  },
  {
    title: "Хичээл үзэх",
    body: "Богино бичлэг, хадмал, pinyin, Монгол орчуулгатай үзнэ.",
  },
  {
    title: "Үгийн сан сур",
    body: "Хичээлийн үгсийг HSK түвшин, жишээ өгүүлбэртэй сурна.",
  },
  {
    title: "Quiz өг",
    body: "Сурсан зүйлээ quiz-ээр шалгаж, оноо хадгална.",
  },
  {
    title: "Давталт хий",
    body: "Давталт хэсэгт сурсан үгээ давтан бататгана.",
  },
  {
    title: "Ахиц account дээр хадгал",
    body: "Нэвтэрсэн хэрэглэгчийн ахиц account дээр хадгалагдана. Guest — төхөөрөмж дээр.",
  },
  {
    title: "Сануулагч & долоо хоногийн тайлан",
    body: "Сануулагч тохируулж, долоо хоногийн тайлангаа шалга.",
  },
];

export default function OnboardingPage() {
  return (
    <PublicPageShell active="help">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
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
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-6"
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
        <Link href="/courses/hsk5" className={ctaPrimaryClass}>
          HSK5 эхлэх
        </Link>
        <Link href="/login" className={ctaOutlineClass}>
          Нэвтрэх
        </Link>
        <Link href="/help" className={ctaOutlineClass}>
          Тусламж
        </Link>
      </section>
    </PublicPageShell>
  );
}
