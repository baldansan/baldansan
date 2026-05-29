import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata = {
  title: "Pricing — Бөөндөө Сурцгаая",
  description: "Ирээдүйн төлбөрийн төлөвлөгөө — одоогоор бүх сургалт үнэгүй.",
};

const plans = [
  {
    name: "Free",
    price: "₮0",
    desc: "HSK5 public lessons, guest progress, basic quiz.",
    highlight: true,
  },
  {
    name: "Learning",
    price: "Удахгүй",
    desc: "Бүх course, account sync, review tools.",
    highlight: false,
  },
  {
    name: "School",
    price: "Удахгүй",
    desc: "Training center, class management, B2B.",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <PublicPageShell active="help">
      <section>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Pricing</h1>
        <p className="mt-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Төлбөрийн систем хараахан идэвхгүй. Одоогоор үнэгүй сурна.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
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
          </article>
        ))}
      </div>

      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Ирээдүйд</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>Self-study subscription</li>
          <li>Training center package</li>
          <li>School / classroom license</li>
          <li>B2B content licensing</li>
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
          href="/feedback"
          className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Contact / feedback
        </Link>
      </section>
    </PublicPageShell>
  );
}
