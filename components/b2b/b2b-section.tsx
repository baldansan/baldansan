import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  id?: string;
};

export function B2BSection({ title, subtitle, children, id }: Props) {
  return (
    <section id={id} className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

type CardProps = {
  title: string;
  desc: string;
  badge?: string;
};

export function B2BCard({ title, desc, badge }: CardProps) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {badge ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
    </article>
  );
}

type StepsProps = {
  steps: string[];
};

export function B2BSteps({ steps }: StepsProps) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <li
          key={step}
          className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
            {i + 1}
          </span>
          <span className="pt-1 text-sm leading-6 text-slate-700">{step}</span>
        </li>
      ))}
    </ol>
  );
}

type CtaProps = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "tertiary";
};

export function B2BCtaLink({ href, label, variant = "primary" }: CtaProps) {
  const classes =
    variant === "primary"
      ? "rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
      : variant === "secondary"
        ? "rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        : "rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-200";

  return (
    <Link href={href} className={classes}>
      {label}
    </Link>
  );
}
