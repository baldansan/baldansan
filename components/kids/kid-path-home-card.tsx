"use client";

import Link from "next/link";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { useKidPath } from "@/lib/kids/use-kid-path";

/** Нүүрний дээд карт: «🧒 7 хоног · Өдөр 3 · 2/4 ✓» — хүүхдийн горим асаалттай эсвэл зам эхэлсэн бол. */
export function KidPathHomeCard() {
  const locale = useUiLocale();
  const { kidId, kidMode, summary } = useKidPath();
  if (!kidId || (!kidMode && !summary.started)) return null;

  const dayText = locale === "zh" ? `第 ${summary.currentDay} 天` : `${tr(locale, "Өдөр")} ${summary.currentDay}`;
  return (
    <Link href="/kids/path" className="bs-tm-continue" style={{ background: "linear-gradient(135deg, #fff7e6, #ffedd5)" }}>
      <span className="bs-tm-continue-ic" style={{ background: "linear-gradient(135deg, #fbbf24, #f97316)" }} aria-hidden>
        🧒
      </span>
      <span className="min-w-0 flex-1">
        <p className="bs-tm-continue-kicker" style={{ color: "#c2410c" }}>
          {tr(locale, "Хүүхдийн 7 хоног")}
        </p>
        <p className="bs-tm-continue-title">
          {summary.allComplete
            ? `🏅 ${tr(locale, "Медаль")} · 7/7`
            : `${dayText} · ${summary.currentDone}/${summary.currentTotal} ✓`}
        </p>
      </span>
      <span className="bs-tm-card-chev" aria-hidden>
        ›
      </span>
    </Link>
  );
}
