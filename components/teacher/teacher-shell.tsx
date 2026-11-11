"use client";

import type { ComponentProps } from "react";
import { PublicPageShell } from "@/components/public-page-shell";
import { useInWorkspace } from "@/components/workspace/workspace-context";

/**
 * Багшийн хуудсуудын хүрээ. Ажлын талбар (зүүн цэстэй) дотор бол зөвхөн
 * агуулгаа гаргана; гаднаас (сурагчийн апп) нээвэл нийтийн хүрээгээр.
 */
export function TeacherShell(props: ComponentProps<typeof PublicPageShell>) {
  const inWorkspace = useInWorkspace();
  if (inWorkspace) {
    return (
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
        {props.children}
      </div>
    );
  }
  return <PublicPageShell {...props} />;
}
