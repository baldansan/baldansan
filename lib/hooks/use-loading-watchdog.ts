"use client";

import { useEffect } from "react";

type Options = {
  active: boolean;
  timeoutMs?: number;
  onTimeout: () => void;
};

/** Guarantees loading UI cannot hang forever even if an async call never settles. */
export function useLoadingWatchdog({
  active,
  timeoutMs = 8500,
  onTimeout,
}: Options): void {
  useEffect(() => {
    if (!active) return;

    const timer = window.setTimeout(() => {
      onTimeout();
    }, timeoutMs);

    return () => window.clearTimeout(timer);
  }, [active, timeoutMs, onTimeout]);
}
