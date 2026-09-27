"use client";

import Link from "next/link";
import { useMemo } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { DAILY_TONE_STORAGE_KEY, DAILY_TOTAL, EMPTY_DAILY, dayKey, normalizeDaily, type DailyToneStore } from "@/lib/pronunciation/daily-tone";
import { useStoredJson } from "@/lib/pronunciation/use-stored-json";

function useDaily() {
  const stored = useStoredJson<Partial<DailyToneStore>>(DAILY_TONE_STORAGE_KEY, EMPTY_DAILY);
  return useMemo(() => normalizeDaily(stored), [stored]);
}

/** /pronunciation дээрх дээд карт */
export function DailyToneCard() {
  const locale = useUiLocale();
  const store = useDaily();
  const today = store.history[dayKey()];
  return (
    <Link href="/pronunciation/daily" className="mb-3 flex items-center gap-3 rounded-[20px] bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-white shadow-[0_6px_16px_rgba(249,115,22,0.3)] active:opacity-90">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl" aria-hidden>
        🔥
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-extrabold leading-5">{tr(locale, "Өдрийн аялгуу")}</span>
        <span className="block text-xs font-semibold text-orange-50">
          3 {tr(locale, "минут")} · {tr(locale, "Streak")} {store.streak}
          {today != null ? ` · ✅ ${today}/${DAILY_TOTAL}` : ""}
        </span>
      </span>
      <span className="text-lg" aria-hidden>
        ›
      </span>
    </Link>
  );
}

/** Нүүрний жижиг карт — зөвхөн ядаж нэг удаа тоглосон бол */
export function DailyToneHomeCard() {
  const locale = useUiLocale();
  const store = useDaily();
  const keys = Object.keys(store.history);
  if (keys.length === 0) return null;
  const todayKey = dayKey();
  const last = store.history[todayKey] ?? store.history[keys.sort()[keys.length - 1]] ?? 0;
  return (
    <Link href="/pronunciation/daily" className="bs-tm-continue" style={{ padding: "10px 16px", marginBottom: 10 }}>
      <span className="bs-tm-continue-ic" style={{ background: "linear-gradient(135deg, #f97316, #f59e0b)", flexBasis: 36, width: 36, height: 36, fontSize: 16 }} aria-hidden>
        🔥
      </span>
      <span className="min-w-0 flex-1">
        <p className="bs-tm-continue-title" style={{ margin: 0 }}>
          {tr(locale, "Өдрийн аялгуу")} {last}/{DAILY_TOTAL} · {tr(locale, "streak")} {store.streak}
          {store.history[todayKey] == null ? <span className="ml-1 text-xs font-bold text-orange-600">· {tr(locale, "өнөөдөр хийгээгүй")}</span> : null}
        </p>
      </span>
      <span className="bs-tm-card-chev" aria-hidden>
        ›
      </span>
    </Link>
  );
}
