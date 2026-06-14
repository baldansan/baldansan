import type { ReactNode } from "react";
import { LESSON_MODULE } from "./module-theme";

type Props = {
  children: ReactNode;
  className?: string;
};

export function ModuleCard({ children, className = "" }: Props) {
  return (
    <article
      className={`overflow-hidden p-5 sm:p-6 ${className}`}
      style={{
        backgroundColor: LESSON_MODULE.surface,
        borderRadius: LESSON_MODULE.radiusLg,
        border: `1px solid ${LESSON_MODULE.border}`,
        boxShadow: LESSON_MODULE.shadow,
      }}
    >
      {children}
    </article>
  );
}
