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
  /** Equivalent numeric HSK level for the "Давтах" deep-link, when known. */
  reviewLevel: number | null;
};

type Props = {
  entries: BookPickerEntry[];
  activeKey: string;
  onSelect: (entry: BookPickerEntry) => void;
};

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

  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center justify-between px-0.5">
        <p className="bs-tm-sec">{tr(locale, "Ном сонгох")}</p>
        {favorites.length > 0 ? (
          <p className="text-[10px] font-semibold text-amber-600">
            ⭐ {tr(locale, "Таалагдсан эхэнд")}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {ordered.map((entry) => {
          const isActive = entry.key === activeKey;
          const isFav = favorites.includes(entry.key);
          return (
            <button
              key={entry.key}
              type="button"
              disabled={!entry.available}
              onClick={() => entry.available && onSelect(entry)}
              className={`group relative flex flex-col items-stretch overflow-hidden rounded-[16px] bg-white text-left shadow-sm ring-1 transition-all ${
                isActive
                  ? "ring-2 ring-emerald-500"
                  : "ring-slate-100 active:ring-emerald-200"
              } ${entry.available ? "" : "opacity-55"}`}
            >
              <span className="relative block w-full" style={{ aspectRatio: "3 / 4.2" }}>
                <CourseCover
                  src={entry.coverUrl ?? ""}
                  alt={entry.title}
                  label={entry.chipLabel}
                  className="h-full w-full object-cover"
                />
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
                ) : (
                  <span className="absolute right-1 top-1 rounded-full bg-slate-700/80 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    🔒
                  </span>
                )}
                {entry.series === "fazhan" ? (
                  <span className="absolute left-1 top-1 rounded-full bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    发展
                  </span>
                ) : null}
              </span>
              <span className="flex flex-1 flex-col gap-0.5 px-1.5 py-1.5">
                <span className="truncate text-[11px] font-bold leading-tight text-[var(--app-text)]">
                  {entry.chipLabel}
                </span>
                <span className="truncate text-[10px] leading-tight text-[var(--app-muted)]">
                  {entry.available ? entry.title : tr(locale, "Удахгүй")}
                </span>
                {entry.available && entry.reviewLevel != null ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleReview(e, entry)}
                    className="mt-0.5 inline-flex w-fit items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 active:bg-slate-200"
                  >
                    🔁 {tr(locale, "Давтах")}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
