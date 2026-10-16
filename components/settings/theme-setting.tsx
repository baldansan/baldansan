"use client";

import { useSyncExternalStore } from "react";
import { MobileCard } from "@/components/mobile/mobile-card";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import {
  DEFAULT_THEME_PREF,
  THEME_CHANGED_EVENT,
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
  getThemePref,
  setThemePref,
  type ThemePref,
} from "@/lib/theme/theme-pref";

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) cb();
  };
  window.addEventListener(THEME_CHANGED_EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_CHANGED_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Тохиргоо → «Харагдах байдал»: Гэрэлтэй / Харанхуй / Системийн. */
export function ThemeSetting() {
  const locale = useUiLocale();
  // SSR-д "system", клиент дээр localStorage-оос — hydration алдаагүй.
  const selected = useSyncExternalStore(subscribe, getThemePref, () => DEFAULT_THEME_PREF);

  function handleSelect(id: ThemePref) {
    setThemePref(id);
  }

  return (
    <MobileCard padding="lg" className="mb-4">
      <h2 className="text-sm font-bold text-[var(--app-text)]">{tr(locale, "Харагдах байдал")}</h2>
      <p className="mt-1 text-xs text-[var(--app-muted)]">
        {tr(locale, "Харанхуй горим нь шөнө орой нүд чилээхгүй. Системийн гэвэл утасны тохиргоог дагана.")}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Харагдах байдал">
        {THEME_OPTIONS.map((opt) => {
          const on = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => handleSelect(opt.id)}
              className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-[14px] border px-2 py-2.5 text-center text-xs transition-colors ${
                on
                  ? "border-emerald-300 bg-emerald-50 font-semibold text-emerald-900"
                  : "border-[var(--app-border)] bg-white text-[var(--app-text)]"
              }`}
            >
              <span className="text-xl" aria-hidden>
                {opt.icon}
              </span>
              {tr(locale, opt.labelMn)}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-[var(--app-muted)]">
        {tr(locale, THEME_OPTIONS.find((o) => o.id === selected)?.descMn ?? "")}
      </p>
    </MobileCard>
  );
}
