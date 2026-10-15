"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CourseCover } from "@/components/courses/course-cover";
import { readHomeFavorites, toggleHomeFavorite } from "@/lib/home-favorites";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

export type BookPickerEntry = {
  /** Unique key across both series, e.g. "standard:hsk3" or "fazhan:fazhanZhongji1". */
  key: string;
  chipId: string;
  series: "standard" | "fazhan";
  chipLabel: string;
  title: string;
  subtitle: string;
  coverUrl?: string | null;
  available: boolean;
  /** Published lessons in this book — shown on the card so "free" is concrete. */
  lessonCount: number;
  /** Lessons the learner has finished in this book. */
  completedCount: number;
  /** Equivalent numeric HSK level for the "Давтах" deep-link, when known. */
  reviewLevel: number | null;
};

type Props = {
  entries: BookPickerEntry[];
  activeKey: string;
  onSelect: (entry: BookPickerEntry) => void;
};

/**
 * 发展汉语 books have no cover art yet. The generic CourseCover fallback
 * drew a grey spine with the whole Chinese title in 9px, which read as
 * "broken" next to the HSK covers. Draw a proper spine instead: tier
 * colour + big tier name + volume numeral.
 */
const FAZHAN_TIERS: Record<
  string,
  { bg: string; tier: string; tierMn: string }
> = {
  "初级": {
    bg: "linear-gradient(160deg, #34d399 0%, #059669 60%, #065f46 100%)",
    tier: "初级",
    tierMn: "Анхан",
  },
  "中级": {
    bg: "linear-gradient(160deg, #60a5fa 0%, #2563eb 60%, #1e3a8a 100%)",
    tier: "中级",
    tierMn: "Дунд",
  },
  "高级": {
    bg: "linear-gradient(160deg, #f472b6 0%, #db2777 60%, #831843 100%)",
    tier: "高级",
    tierMn: "Ахисан",
  },
};

function FazhanCover({ label, alt }: { label: string; alt: string }) {
  const tierKey = Object.keys(FAZHAN_TIERS).find((k) => label.startsWith(k));
  const tier = tierKey ? FAZHAN_TIERS[tierKey] : null;
  const volume = label.match(/\b(I{1,3})\b/)?.[1] ?? "";
  return (
    <div
      role="img"
      aria-label={alt}
      className="flex h-full w-full flex-col items-center justify-center gap-1 text-white"
      style={{
        background:
          tier?.bg ?? "linear-gradient(160deg, #94a3b8, #334155)",
      }}
    >
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-85">
        发展汉语
      </span>
      <span className="text-[22px] font-black leading-none" translate="no">
        {tier?.tier ?? "综合"}
      </span>
      <span className="text-[10px] font-semibold opacity-90">
        {tier?.tierMn ?? ""} {volume}
      </span>
      <span className="mt-1 h-[2px] w-8 rounded-full bg-white/70" aria-hidden />
    </div>
  );
}

export function BookPickerGrid({ entries, activeKey, onSelect }: Props) {
  const locale = useUiLocale();
  const router = useRouter();
  const { setLevel } = useActiveHskLevel();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(readHomeFavorites());
  }, []);

  const ordered = [...entries].sort((a, b) => {
    const aFav = favorites.includes(a.key) ? 0 : 1;
    const bFav = favorites.includes(b.key) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    const aAvail = a.available ? 0 : 1;
    const bAvail = b.available ? 0 : 1;
    return aAvail - bAvail;
  });

  const handleFavorite = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    e.preventDefault();
    setFavorites(toggleHomeFavorite(key));
  };

  const handleReview = (e: React.MouseEvent, entry: BookPickerEntry) => {
    e.stopPropagation();
    e.preventDefault();
    if (entry.reviewLevel != null) setLevel(entry.reviewLevel as 1 | 2 | 3 | 4 | 5 | 6);
    router.push("/review");
  };

  const openCount = entries.filter((e) => e.available).length;
  const favEntries = ordered.filter((e) => favorites.includes(e.key));
  const restEntries = ordered.filter((e) => !favorites.includes(e.key));

  const renderCard = (entry: BookPickerEntry) => {
    const isActive = entry.key === activeKey;
    const isFav = favorites.includes(entry.key);
    const pct =
      entry.lessonCount > 0
        ? Math.round((entry.completedCount / entry.lessonCount) * 100)
        : 0;
    const done = entry.available && entry.lessonCount > 0 && pct >= 100;
    const started = entry.available && entry.completedCount > 0 && !done;
    return (
      <button
        key={entry.key}
        type="button"
        disabled={!entry.available}
        onClick={() => entry.available && onSelect(entry)}
        className={`group relative flex flex-col items-stretch overflow-hidden rounded-[16px] bg-white text-left shadow-sm ring-1 transition-all ${
          isActive
            ? "ring-2 ring-emerald-500 shadow-[0_6px_18px_rgba(16,185,129,0.25)]"
            : "ring-slate-100 active:ring-emerald-200"
        } ${entry.available ? "" : "opacity-60 grayscale-[35%]"}`}
      >
        <span className="relative block w-full" style={{ aspectRatio: "3 / 4" }}>
          {entry.series === "fazhan" && !entry.coverUrl ? (
            <FazhanCover label={entry.chipLabel} alt={entry.title} />
          ) : (
            <CourseCover
              src={entry.coverUrl ?? ""}
              alt={entry.title}
              label={entry.chipLabel}
              className="h-full w-full object-cover"
            />
          )}
          {entry.available ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => handleFavorite(e, entry.key)}
              className={`absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-[13px] shadow-sm ring-1 ${
                isFav
                  ? "bg-amber-400 text-white ring-amber-500"
                  : "bg-white/85 text-slate-400 ring-slate-200"
              }`}
              aria-label={tr(locale, "Таалагдсан болгох")}
            >
              {isFav ? "★" : "☆"}
            </span>
          ) : null}
          {isActive ? (
            <span className="absolute left-1 top-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
              ✓ {tr(locale, "Сонгосон")}
            </span>
          ) : done ? (
            <span className="absolute left-1 top-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
              🏆 {tr(locale, "Дууссан")}
            </span>
          ) : null}
          {/* Явцын зураас — хавтасны доод ирмэг дээр */}
          {entry.available && entry.lessonCount > 0 ? (
            <span
              className="absolute inset-x-0 bottom-0 h-1.5 bg-black/25"
              aria-hidden
            >
              <span
                className={`block h-full ${done ? "bg-amber-400" : "bg-emerald-400"}`}
                style={{ width: `${pct}%` }}
              />
            </span>
          ) : null}
        </span>
        <span className="flex flex-1 flex-col gap-1 px-1.5 pb-1.5 pt-1.5">
          <span className="flex items-baseline justify-between gap-1">
            <span
              className="truncate text-[11px] font-bold leading-tight text-[var(--app-text)]"
              translate="no"
            >
              {entry.chipLabel}
            </span>
            {entry.available && entry.lessonCount > 0 ? (
              <span
                className={`shrink-0 text-[10px] font-extrabold tabular-nums ${
                  done
                    ? "text-amber-600"
                    : started
                      ? "text-emerald-600"
                      : "text-slate-400"
                }`}
              >
                {pct}%
              </span>
            ) : null}
          </span>
          {entry.available ? (
            <span className="text-[10px] leading-tight text-[var(--app-muted)]">
              {started || done ? (
                <>
                  <span className="font-bold text-[var(--app-text)]">
                    {entry.completedCount}
                  </span>
                  /{entry.lessonCount} {tr(locale, "хичээл дууссан")}
                </>
              ) : (
                <span className="font-extrabold text-emerald-700">
                  {tr(locale, "Үнэгүй")} · {entry.lessonCount} {tr(locale, "хичээл")}
                </span>
              )}
            </span>
          ) : (
            <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
              {tr(locale, "Удахгүй")}
            </span>
          )}
          {entry.available && entry.reviewLevel != null ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => handleReview(e, entry)}
              className="inline-flex w-fit items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 active:bg-slate-200"
            >
              🔁 {tr(locale, "Давтах")}
            </span>
          ) : null}
        </span>
      </button>
    );
  };

  const gridClass = "grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6";

  return (
    <div className="mb-4">
      {favEntries.length > 0 ? (
        <div className="mb-4">
          <div className="mb-2 px-0.5">
            <p className="bs-tm-sec !mb-0 !mt-0">⭐ {tr(locale, "Таны номууд")}</p>
            <p className="text-[11px] text-[var(--app-muted)]">
              {tr(locale, "Од дарж тэмдэглэсэн ном энд эхэнд гарна")}
            </p>
          </div>
          <div className={gridClass}>{favEntries.map(renderCard)}</div>
        </div>
      ) : null}

      <div className="mb-2 flex items-end justify-between px-0.5">
        <div>
          <p className="bs-tm-sec !mb-0 !mt-0">{tr(locale, "Бүх ном")}</p>
          <p className="text-[11px] text-[var(--app-muted)]">
            {openCount} {tr(locale, "ном нээлттэй")} · {tr(locale, "дарж эхэлнэ")}
            {favEntries.length === 0
              ? ` · ☆ ${tr(locale, "од дарвал дээр гарна")}`
              : ""}
          </p>
        </div>
      </div>
      <div className={gridClass}>{restEntries.map(renderCard)}</div>
    </div>
  );
}
