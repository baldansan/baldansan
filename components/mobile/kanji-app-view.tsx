"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import {
  lettersEmptyMessage,
  lettersLevelGroupLabel,
  lettersPageSubtitle,
  lettersPageTitle,
  lettersSearchPlaceholder,
} from "@/lib/learner-letters-ui";
import type { SelectedLanguage } from "@/lib/language-track";
import {
  getAllLearnedWordsSmart,
  vocabularyWordKey,
} from "@/lib/progress";
import {
  groupKanjiByHsk,
  kanjiMatchesSearch,
  type KanjiEntry,
} from "@/lib/mobile-app-vocab";
import type { VocabularyWord } from "@/types/lesson";

type FilterId = "all" | "new" | "learned" | "master";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Бүгд" },
  { id: "new", label: "Шинэ" },
  { id: "learned", label: "Сурсан" },
  { id: "master", label: "Мастер" },
];

const HSK_ORDER = ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "Other"];

type Props = {
  entries: KanjiEntry[];
  lessonVocab: { lessonId: string; vocabulary: VocabularyWord[] }[];
  lang?: SelectedLanguage | null;
};

export function KanjiAppView({ entries, lessonVocab, lang = null }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [learnedKeys, setLearnedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const all = await getAllLearnedWordsSmart(
        lessonVocab.map((snap) => ({
          id: snap.lessonId,
          vocabulary: snap.vocabulary,
        }))
      );
      const keys = new Set<string>();
      for (const entry of all) {
        keys.add(entry.wordKey);
        for (const snap of lessonVocab) {
          const word = snap.vocabulary.find(
            (w) =>
              vocabularyWordKey(w) === entry.wordKey ||
              w.id === entry.wordKey ||
              w.chinese === entry.wordKey
          );
          if (word) keys.add(word.chinese);
        }
      }
      setLearnedKeys(keys);
    }
    void load();
  }, [lessonVocab]);

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (!kanjiMatchesSearch(entry, search)) return false;
      const isLearned =
        learnedKeys.has(entry.chinese) || learnedKeys.has(entry.key);
      if (filter === "new") return !isLearned;
      if (filter === "learned") return isLearned;
      if (filter === "master") return isLearned;
      return true;
    });
  }, [entries, search, filter, learnedKeys]);

  const grouped = groupKanjiByHsk(filtered);
  const sortedLevels = [...grouped.keys()].sort(
    (a, b) => HSK_ORDER.indexOf(a) - HSK_ORDER.indexOf(b)
  );

  const lessonsHref = lang === "ko" ? "/home" : "/study";

  return (
    <MobileAppShell activeTab="kanji" >
      <MobilePageHeader
        title={lettersPageTitle(lang)}
        subtitle={lettersPageSubtitle(lang)}
        badge={`${entries.length}`}
      />

      {lang !== "ko" ? (
        <Link
          href="/kanji/handwriting"
          className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3.5 text-white shadow-sm"
        >
          <span className="text-2xl" aria-hidden>
            ✍️
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">
              Бичих сургалт · 写字练习
            </span>
            <span className="block text-xs text-emerald-50">
              HSK 3.0 — гараар бичиж сурах ёстой 1200 ханз
            </span>
          </span>
          <span aria-hidden>›</span>
        </Link>
      ) : null}

      <div className="mb-4">
        <input
          type="search"
          placeholder={lettersSearchPlaceholder(lang)}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 py-3 text-sm outline-none ring-emerald-500 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`app-chip ${filter === item.id ? "app-chip-active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <MobileCard className="text-center">
          <p className="text-sm text-[var(--app-muted)]">
            {lettersEmptyMessage(lang)}
          </p>
          <Link
            href={lessonsHref}
            className="mt-3 inline-block text-sm font-semibold text-emerald-600"
          >
            Хичээл үзэх →
          </Link>
        </MobileCard>
      ) : (
        sortedLevels.map((level) => {
          const items = grouped.get(level) ?? [];
          return (
            <section key={level} className="mb-5">
              <h2 className="mb-2 text-sm font-bold text-[var(--app-text)]">
                {lettersLevelGroupLabel(level, lang)}
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {items.map((entry) => {
                  const isLearned =
                    learnedKeys.has(entry.chinese) ||
                    learnedKeys.has(entry.key);
                  return (
                    <Link
                      key={entry.key}
                      href={`/kanji/${encodeURIComponent(entry.key)}?lessonId=${entry.lessonIds[0] ?? "1"}`}
                      className={`app-kanji-cell block ${
                        isLearned ? "app-kanji-cell-learned" : ""
                      }`}
                    >
                      <p className="text-2xl font-bold text-[var(--app-text)]">
                        {entry.chinese}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-emerald-700">
                        {entry.pinyin}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-[var(--app-muted)]">
                        {entry.mongolian}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </MobileAppShell>
  );
}
