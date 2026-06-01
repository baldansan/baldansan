"use client";

import { useEffect } from "react";

function isLocalhostHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

/** Registers minimal offline SW on public learner pages only (production hosts). */
export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    if (window.location.pathname.startsWith("/admin")) {
      return;
    }

    const isDev = process.env.NODE_ENV === "development";
    const isLocalhost = isLocalhostHost();

    if (isDev || isLocalhost) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW optional — install still works via manifest where supported
    });
  }, []);

  return null;
}
