"use client";

import { useEffect } from "react";

/** Registers minimal offline SW on public learner pages only. */
export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    if (window.location.pathname.startsWith("/admin")) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW optional — install still works via manifest where supported
    });
  }, []);

  return null;
}
