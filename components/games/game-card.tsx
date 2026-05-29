import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function GameCard({ children, className = "" }: Props) {
  return (
    <div className={`app-card p-4 ${className}`}>{children}</div>
  );
}
