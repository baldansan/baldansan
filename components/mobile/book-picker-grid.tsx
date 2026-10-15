"use client";

import { useEffect, useState } from "react";
import { CourseCover } from "@/components/courses/course-cover";
import { readHomeFavorites, toggleHomeFavorite } from "@/lib/home-favorites";
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
  /** Equivalent numeric HSK level, when known. */
  reviewLevel: number | null;
};

type Props = {
  entries: BookPickerEntry[];
  activeKey: string;
  onSelect: (entry: BookPickerEntry) => void;
};

const GRID = "grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6";

export function BookPickerGrid({ entries, activeKey, onSelect }: Props) {
  const locale = useUiLocale();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(readHomeFavorites());
  }, []);

  const handleFavorite = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    e.preventDefault();
    setFavorites(toggleHomeFavorite(key));
  };

  const favEntries = entries.filter((e) => favorites.includes(e.key));
  const byAvailable = (a: BookPickerEntry, b: BookPickerEntry) =>
    Number(b.available) - Number(a.available);
  const standard = entries
    .filter((e) => e.series === "standard" && !favorites.includes(e.key))
    .sort(byAvailable);
  const fazhan = entries
    .filter((e) => e.series === "fazhan" && !favorites.includes(e.key))
    .sort(byAvailable);

  const renderCard = (entry: BookPickerEntry) => {
    const isActive = entry.key === activeKey;
    const isFav = favorites.includes(entry.key);
    const pct =
      entry.lessonCount > 0
        ? Math.round((entry.completedCount / entry.lessonCount) * 100)
        : 0;
    const done = entry.available && entry.lessonCount > 0 && pct >= 100;
    const started = entry.available && entry.completedCount > 0 && !done;

    let status: string;
    if (!entry.available) status = tr(locale, "Удахгүй");
    else if (done) status = `🏆 ${tr(locale, "Бүгдийг дууссан")}`;
    else if (started)
      status = `${entry.completedCount}/${entry.lessonCount} ${tr(locale, "хичээл")}`;
    else status = `${entry.lessonCount} ${tr(locale, "хичээл")} · ${tr(locale, "үнэгүй")}`;

    return (
      <button
        key={entry.key}
        type="button"
        disabled={!entry.available}
        onClick={() => entry.available && onSelect(entry)}
        className={`group relative flex flex-col items-stretch text-left transition-transform ${
          entry.available ? "active:scale-[0.97]" : "opacity-45 saturate-50"
        }`}
      >
        <span
          className={`relative block w-full overflow-hidden rounded-[14px] shadow-[0_6px_16px_rgba(15,27,20,0.14)] ring-2 transition-shadow ${
            isActive
              ? "ring-emerald-500 shadow-[0_8px_22px_rgba(31,184,90,0.35)]"
              : "ring-transparent"
          }`}
          style={{ aspectRatio: "300 / 420" }}
        >
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
              className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-[14px] shadow-sm transition-colors ${
                isFav
                  ? "bg-amber-400 text-white"
                  : "bg-black/25 text-white/80 backdrop-blur-sm group-hover:bg-black/40"
              }`}
              aria-label={tr(locale, "Таалагдсан болгох")}
            >
              {isFav ? "★" : "☆"}
            </span>
          ) : null}
          {isActive ? (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 shadow-sm">
              ✓ {tr(locale, "Сонгосон")}
            </span>
          ) : null}
          {/* Явц — хавтасны доод ирмэг */}
          {entry.available && entry.lessonCount > 0 && (started || done) ? (
            <span className="absolute inset-x-0 bottom-0 h-[5px] bg-black/30" aria-hidden>
              <span
                className={`block h-full ${done ? "bg-amber-400" : "bg-white"}`}
                style={{ width: `${pct}%` }}
              />
            </span>
          ) : null}
        </span>
        <span className="flex items-baseline justify-between gap-1 px-0.5 pt-2">
          <span
            className="truncate text-[12px] font-extrabold leading-tight text-[var(--app-text)]"
            translate="no"
          >
            {entry.chipLabel}
          </span>
          {started || done ? (
            <span
              className={`shrink-0 text-[11px] font-black tabular-nums ${
                done ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {pct}%
            </span>
          ) : null}
        </span>
        <span
          className={`px-0.5 text-[10.5px] leading-tight ${
            done
              ? "font-bold text-amber-600"
              : started
                ? "font-semibold text-emerald-700"
                : "text-[var(--app-muted)]"
          }`}
        >
          {status}
        </span>
      </button>
    );
  };

  const Section = ({
    title,
    hint,
    items,
  }: {
    title: string;
    hint?: string;
    items: BookPickerEntry[];
  }) =>
    items.length === 0 ? null : (
      <div className="mb-5">
        <div className="mb-2 flex items-baseline justify-between px-0.5">
          <p className="bs-tm-sec !my-0">{title}</p>
          {hint ? (
            <p className="text-[10.5px] text-[var(--app-muted)]">{hint}</p>
          ) : null}
        </div>
        <div className={GRID}>{items.map(renderCard)}</div>
      </div>
    );

  return (
    <div className="mb-2">
      <Section
        title={`⭐ ${tr(locale, "Таны номууд")}`}
        hint={tr(locale, "Од дарсан ном энд")}
        items={favEntries}
      />
      <Section
        title={tr(locale, "HSK стандарт хичээл")}
        hint={
          favEntries.length === 0 ? `☆ ${tr(locale, "од дарвал дээр гарна")}` : undefined
        }
        items={standard}
      />
      <Section
        title={`发展汉语 · ${tr(locale, "Сургуулийн сурах бичиг")}`}
        items={fazhan}
      />
    </div>
  );
}
