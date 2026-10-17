"use client";

import type { ReactNode } from "react";
import { ReportIssueLink } from "@/components/feedback/report-issue-link";
import { ActiveHskLevelProvider } from "@/components/providers/active-hsk-level-provider";
import { GlobalAudioProvider } from "@/components/providers/global-audio-provider";
import { MiniAudioPlayer } from "@/components/audio/mini-audio-player";
import { FloatingLocaleToggle } from "@/components/i18n/locale-toggle";
import { UiTranslator } from "@/components/i18n/ui-translator";
import { PendingClassJoin } from "@/components/classroom/pending-class-join";
import { ThemeController } from "@/components/theme/theme-controller";
import { HanziFontLoader } from "@/components/theme/hanzi-font-loader";
import { CelebrationLayer } from "@/components/celebrate/celebration-layer";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ActiveHskLevelProvider>
      <ThemeController />
      <HanziFontLoader />
      <GlobalAudioProvider>
        {children}
        <MiniAudioPlayer />
        <CelebrationLayer />
        <ReportIssueLink />
        <UiTranslator />
        <PendingClassJoin />
        <FloatingLocaleToggle />
      </GlobalAudioProvider>
    </ActiveHskLevelProvider>
  );
}
