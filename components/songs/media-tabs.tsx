"use client";

import Link from "next/link";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

/** «Дуу ба бичлэг» хэсгийн таб: Бичлэг | Дуу */
export function MediaTabs({ active }: { active: "videos" | "songs" }) {
  const locale = useUiLocale();
  const cls = (on: boolean) =>
    `flex-1 rounded-full py-2 text-center text-sm font-bold transition ${
      on ? "bg-emerald-500 text-white shadow-sm" : "text-slate-600"
    }`;
  return (
    <div className="mb-3 flex rounded-full bg-white p-1 ring-1 ring-slate-200">
      <Link href="/bichleg" className={cls(active === "videos")}>
        📺 {tr(locale, "Бичлэг")}
      </Link>
      <Link href="/bichleg?tab=songs" className={cls(active === "songs")}>
        🎵 {tr(locale, "Дуу")}
      </Link>
    </div>
  );
}
