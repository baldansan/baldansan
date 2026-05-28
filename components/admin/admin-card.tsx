import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  title: string;
  description: string;
  href?: string;
  children?: ReactNode;
};

export function AdminCard({ title, description, href, children }: Props) {
  const inner = (
    <>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </>
  );

  const className =
    "block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-shadow hover:ring-emerald-200 sm:p-6";

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
