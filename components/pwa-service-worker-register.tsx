"use client";

import { useEffect } from "react";
import {
  isLocalDevHost,
  shouldDisableServiceWorker,
} from "@/lib/dev/local-dev-host";

async function clearServiceWorkerCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

/** Registers minimal offline SW on public learner pages only (production hosts). */
export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    const disable = shouldDisableServiceWorker({
      nodeEnv: process.env.NODE_ENV,
      hostname,
      pathname,
    });

    if (disable || isLocalDevHost(hostname)) {
      // Local dev / test hosts: fully remove SW + caches.
      // Admin/debug pages on production: do nothing — the SW already
      // bypasses those routes, and clearing caches here would wipe
      // lessons the user downloaded for offline study.
      const devHost =
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test" ||
        isLocalDevHost(hostname);
      if (devHost) {
        void (async () => {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
          await clearServiceWorkerCaches();
        })();
      }
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW optional — install still works via manifest where supported
    });
  }, []);

  return null;
}
