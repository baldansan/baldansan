"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  getSelectedLanguage,
  isLearningRoute,
  isNeverRedirectRoute,
  normalizePathname,
} from "@/lib/learner-onboarding";

/** Redirect learning routes to onboarding when no language track is selected. */
export function LearnerLanguageGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const path = normalizePathname(pathname);
    if (isNeverRedirectRoute(path)) return;
    if (!isLearningRoute(path)) return;
    if (getSelectedLanguage()) return;
    router.replace("/onboarding");
  }, [pathname, router]);

  return null;
}
