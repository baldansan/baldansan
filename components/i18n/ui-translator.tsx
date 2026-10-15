"use client";

import { useEffect } from "react";
import { useUiLocale } from "@/lib/i18n/ui-locale";

function unhide() {
  document.documentElement.classList.remove("ui-zh-pending");
}

/**
 * zh горимд DOM-ыг орчуулж, `ui-zh-pending` (body нуусан) классыг арилгана.
 * Hydration дуусахаас ӨМНӨ DOM-ыг өөрчилбөл React #418 (text mismatch) гардаг тул
 * `load` үйл явдлыг (бүх stream/JS ирсэн) хүлээгээд эхэлнэ.
 */
export function UiTranslator() {
  const locale = useUiLocale();
  useEffect(() => {
    if (locale !== "zh") {
      unhide();
      return;
    }
    let stop: (() => void) | null = null;
    let started = false;
    let cancelled = false;
    // zh-ui-auto (405KB) + dom-translator-ыг зөвхөн zh үед л татна (mn хэрэглэгч ачаалахгүй).
    const modPromise = import("@/lib/i18n/dom-translator");
    const start = () => {
      if (started) return;
      started = true;
      // load-ын дараа сүүлийн hydration commit-ыг нэг tick хүлээнэ
      setTimeout(() => {
        modPromise
          .then((mod) => {
            if (cancelled) return;
            stop = mod.startDomTranslator();
          })
          .catch(() => {})
          .finally(unhide);
      }, 30);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    // Хамгаалалт: load удвал ч 2.5с-ийн дараа эхэлнэ
    const guard = setTimeout(start, 2500);
    return () => {
      cancelled = true;
      clearTimeout(guard);
      window.removeEventListener("load", start);
      stop?.();
    };
  }, [locale]);
  return null;
}
