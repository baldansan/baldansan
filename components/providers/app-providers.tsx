"use client";

import type { ReactNode } from "react";
import { ActiveHskLevelProvider } from "@/components/providers/active-hsk-level-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <ActiveHskLevelProvider>{children}</ActiveHskLevelProvider>;
}
