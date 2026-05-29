import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  onClick?: () => void;
};

const paddingClass = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export function MobileCard({
  children,
  className = "",
  padding = "md",
  onClick,
}: Props) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-[20px] border border-[var(--app-border)] bg-[var(--app-card)] shadow-sm ${paddingClass[padding]} ${onClick ? "w-full text-left transition-colors active:bg-slate-50" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
