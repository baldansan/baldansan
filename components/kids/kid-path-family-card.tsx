"use client";

import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { useKidPath } from "@/lib/kids/use-kid-path";

/**
 * /family — хүүхэд бүрийн «7 хоног: өдөр 3, 9/29 даалгавар» мөр.
 * Ахиц энэ төхөөрөмжийн localStorage-д л байгаа (хүүхэд өөр утсаар сурсан бол харагдахгүй).
 */
export function KidPathFamilyCard({ childUserId }: { childUserId: string }) {
  const locale = useUiLocale();
  const { kidId, summary } = useKidPath(childUserId);
  if (!kidId) return null;

  const dayText = locale === "zh" ? `第 ${summary.currentDay} 天` : `${tr(locale, "Өдөр").toLowerCase()} ${summary.currentDay}`;
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-[var(--app-text)]">
      <span aria-hidden>🧒</span>
      <span className="font-bold">{tr(locale, "Хүүхдийн 7 хоног")}:</span>
      {!summary.started ? (
        <span className="text-[var(--app-muted)]">{tr(locale, "эхлээгүй")}</span>
      ) : summary.allComplete ? (
        <span>
          🏅 {tr(locale, "Медаль")} · {summary.doneTasks}/{summary.totalTasks} {tr(locale, "даалгавар")}
        </span>
      ) : (
        <span>
          {dayText}, {summary.doneTasks}/{summary.totalTasks} {tr(locale, "даалгавар")}
        </span>
      )}
      <span className="w-full text-[10px] text-[var(--app-muted)]">{tr(locale, "Энэ төхөөрөмж дээрх ахиц")}</span>
    </p>
  );
}
