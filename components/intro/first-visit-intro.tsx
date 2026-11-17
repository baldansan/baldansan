"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IntroContent } from "./intro-content";

const KEY = "buunduu-intro-seen-v1";
const SKIP = /^\/(tanilts|admin|teacher|organization|dashboard|login|signup|auth|forgot-password|reset-password|kids|privacy|terms|account|invite|join|debug|deployment-check|offline)(\/|$)/;

/** Анх удаа орж ирсэн хүнд аппын танилцуулгыг нэг удаа харуулна. */
export function FirstVisitIntro() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (SKIP.test(pathname)) return;
    let seen = true;
    try {
      seen = localStorage.getItem(KEY) === "1";
    } catch {
      seen = true;
    }
    if (seen) return;
    const t = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(t);
    // Зөвхөн анхны ачааллаар шалгана.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) return null;

  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div className="bs-intro-overlay" role="dialog" aria-modal="true" aria-label="Аппын танилцуулга">
      <div className="bs-intro-sheet">
        <button type="button" className="bs-intro-x" onClick={close} aria-label="Хаах">
          ✕
        </button>
        <div className="bs-intro-scroll">
          <IntroContent onNavigate={close} />
        </div>
        <div className="bs-intro-foot">
          <button type="button" className="bs-intro-start" onClick={close}>
            Ойлголоо, эхэлье!
          </button>
        </div>
      </div>
    </div>
  );
}
