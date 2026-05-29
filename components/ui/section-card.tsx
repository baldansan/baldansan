import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "section" | "article" | "div";
};

export function SectionCard({
  children,
  className = "",
  as: Tag = "section",
}: Props) {
  return (
    <Tag
      className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-6 ${className}`}
    >
      {children}
    </Tag>
  );
}
