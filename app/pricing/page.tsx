import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";
import { ctaOutlineClass, ctaPrimaryClass } from "@/components/ui/cta-button-row";
import { PAYMENT_INACTIVE_NOTE, PRICING_PLANS } from "@/lib/content/b2b-copy";

export const metadata = {
  title: "Үнийн санал — Бөөндөө Сурцгаая",
  description:
    "Үнэгүй суралцагч, багшийн, сургуулийн багц — танилцуулга. Төлбөр идэвхгүй.",
};

export default function PricingPage() {
  return (
    <PublicPageShell active="help">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
          Үнийн санал
        </h1>
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {PAYMENT_INACTIVE_NOTE}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <article
            key={plan.name}
            className={`rounded-2xl p-6 ring-1 sm:rounded-3xl ${
              plan.highlight
                ? "bg-emerald-50 ring-emerald-200"
                : "bg-white ring-slate-200 shadow-sm"
            }`}
          >
            <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{plan.price}</p>
            <p className="mt-3 text-sm text-slate-600">{plan.desc}</p>
            <ul className="mt-4 list-inside list-disc space-y-1 text-xs text-slate-600">
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 sm:rounded-3xl">
        <h2 className="font-semibold text-slate-900">B2B онцлог</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>Хичээлийн багц — HSK5 + ирээдүйн контент</li>
          <li>Сурагчийн ахиц — account түвшинд</li>
          <li>Багшийн самбар — дараагийн шатанд</li>
          <li>Custom контент — admin CMS</li>
          <li>Сургуулийн onboarding дэмжлэг</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href="/courses/hsk5" className={ctaPrimaryClass}>
          Үнэгүй эхлэх
        </Link>
        <Link href="/schools" className={ctaOutlineClass}>
          Сургуулийн багц
        </Link>
        <Link href="/school-inquiry" className={ctaPrimaryClass}>
          Сургуулийн лавлагаа
        </Link>
      </section>
    </PublicPageShell>
  );
}
