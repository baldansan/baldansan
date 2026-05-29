import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function GameCard({ children, className = "" }: Props) {
  return (
    <div
      className={`rounded-[20px] border border-[var(--app-border)] bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
