"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { HANZI_FONT_LOAD_EVENT } from "@/lib/hanzi-font/hanzi-font-pref";

const OptionalHanziFonts = dynamic(
  () => import("@/components/theme/optional-hanzi-fonts"),
  { ssr: false }
);

/** Нэг удаа ачаалсан бол буцааж буулгахгүй (дахин татахаас сэргийлнэ). */
let loaded = false;

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-hanzi-font"],
  });
  window.addEventListener(HANZI_FONT_LOAD_EVENT, onChange);
  return () => {
    observer.disconnect();
    window.removeEventListener(HANZI_FONT_LOAD_EVENT, onChange);
  };
}

function getSnapshot(): boolean {
  if (loaded) return true;
  const f = document.documentElement.getAttribute("data-hanzi-font");
  if (f === "serif" || f === "brush") loaded = true;
  return loaded;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Noto Serif SC / Ma Shan Zheng фонтыг зөвхөн <html data-hanzi-font> тавигдсан
 * (layout-ийн inline script эсвэл Тохиргоо) буюу HANZI_FONT_LOAD_EVENT ирсэн
 * үед л ачаална. Өгөгдмөл «Энгийн» фонттой сурагчид юу ч татахгүй.
 */
export function HanziFontLoader() {
  const needed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return needed ? <OptionalHanziFonts /> : null;
}

/** Event ирэхэд snapshot «true» болгох — subscribe-ийн onChange дуудагдахаас өмнө. */
if (typeof window !== "undefined") {
  window.addEventListener(HANZI_FONT_LOAD_EVENT, () => {
    loaded = true;
  });
}
