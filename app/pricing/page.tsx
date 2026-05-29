import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";
import { PAYMENT_INACTIVE_NOTE, PRICING_PLANS } from "@/lib/content/b2b-copy";

export const metadata = {
  title: "Pricing — Бөөндөө Сурцгаая",
  description:
    "Free learner, teacher starter, school package, training center — B2B package танилцуулга. Төлбөр идэвхгүй.",
};

export default function PricingPage() {
  return (
    <PublicPageShell active="help">
      <section>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Pricing</h1>
        <p className="mt-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {PAYMENT_INACTIVE_NOTE}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <article
            key={plan.name}
            className={`rounded-2xl p-6 ring-1 ${
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

      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">B2B value points</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>Lesson package access — HSK5 public + future custom content</li>
          <li>Student progress — account-level tracking (class view planned)</li>
          <li>Teacher dashboard — дараагийн шатанд</li>
          <li>Custom lesson content — admin CMS + B2B partnership</li>
          <li>School onboarding support — demo, inquiry, setup guidance</li>
        </ul>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href="/courses/hsk5"
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Start free
        </Link>
        <Link
          href="/schools"
          className="rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800"
        >
          School package
        </Link>
        <Link
          href="/school-inquiry"
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Request school package
        </Link>
        <Link
          href="/schools"
          className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          School package info
        </Link>
      </section>
    </PublicPageShell>
  );
}
