"use client";

import type { ReactNode } from "react";
import { ReportIssueLink } from "@/components/feedback/report-issue-link";
import { ActiveHskLevelProvider } from "@/components/providers/active-hsk-level-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ActiveHskLevelProvider>
      {children}
      <ReportIssueLink />
    </ActiveHskLevelProvider>
  );
}
