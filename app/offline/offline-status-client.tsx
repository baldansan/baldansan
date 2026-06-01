"use client";

import { useEffect, useState } from "react";
import { LocalDebugPanel } from "@/components/dev/local-debug-panel";
import { shouldShowLocalDebugDetails } from "@/lib/dev/local-debug";

export function OfflineStatusClient() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [swRegistered, setSwRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    setOnline(navigator.onLine);

    async function checkSw() {
      if (!("serviceWorker" in navigator)) {
        setSwRegistered(false);
        return;
      }
      const registrations = await navigator.serviceWorker.getRegistrations();
      setSwRegistered(registrations.length > 0);
    }

    void checkSw();

    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!shouldShowLocalDebugDetails()) {
    return null;
  }

  return (
    <div className="mt-4 text-left">
      <p className="text-xs text-slate-500">
        navigator.onLine: {online == null ? "…" : online ? "true" : "false"} ·
        service worker: {swRegistered == null ? "…" : swRegistered ? "yes" : "no"}
      </p>
      <LocalDebugPanel route="/offline" />
    </div>
  );
}
