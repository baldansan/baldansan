"use client";

import { useState } from "react";
import { exitKidMode } from "@/lib/kids/client";
import { useKidMode } from "@/lib/kids/use-kid-mode";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

/** Хүүхдийн горимд аппын дээд талд: «🧒 нэр» тэмдэг + «Эцэг эх» товч. */
export function KidModeBar() {
  const locale = useUiLocale();
  const { kid } = useKidMode();
  const [leaving, setLeaving] = useState(false);

  if (!kid) return null;

  return (
    <div className="mb-3 flex items-center justify-between gap-2 rounded-full bg-amber-50 px-3 py-1.5 ring-1 ring-amber-200">
      <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-amber-900">
        <span aria-hidden>🧒</span>
        <span aria-hidden>{kid.avatar}</span>
        <span className="truncate" translate="no">
          {kid.displayName || tr(locale, "Хүүхэд")}
        </span>
      </span>
      <button
        type="button"
        disabled={leaving}
        onClick={() => {
          setLeaving(true);
          void exitKidMode("/family");
        }}
        className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200 active:bg-amber-100 disabled:opacity-50"
      >
        👨‍👩‍👧 {tr(locale, "Эцэг эх")}
      </button>
    </div>
  );
}
