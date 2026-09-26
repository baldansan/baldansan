"use client";

import type { ReactNode } from "react";
import { ReportIssueLink } from "@/components/feedback/report-issue-link";
import { ActiveHskLevelProvider } from "@/components/providers/active-hsk-level-provider";
import { FloatingLocaleToggle } from "@/components/i18n/locale-toggle";
import { UiTranslator } from "@/components/i18n/ui-translator";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ActiveHskLevelProvider>
      {children}
      <ReportIssueLink />
      <UiTranslator />
      <FloatingLocaleToggle />
    </ActiveHskLevelProvider>
  );
}
