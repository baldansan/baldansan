"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
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
  { id: "learned", label: "Суралцсан" },
  { id: "master", label: "Мастер" },
];

const HSK_ORDER = ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "Other"];

type Props = {
  entries: KanjiEntry[];
  lessonVocab: { lessonId: string; vocabulary: VocabularyWord[] }[];
  trackLabel?: string;
};

export function KanjiAppView({ entries, lessonVocab, trackLabel }: Props) {
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
        learnedKeys.has(entry.chinese) ||
        learnedKeys.has(entry.key);
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

  return (
    <MobileAppShell activeTab="kanji" mainClassName="max-w-[390px] mx-auto w-full">
      <MobilePageHeader
        title={trackLabel?.includes("Солонгос") ? "Солонгос үг" : "Ханз"}
        subtitle={
          trackLabel?.includes("Солонгос") ? "Солонгос үг, үсэг" : "Бүх ханзнууд"
        }
        badge={`${entries.length}`}
      />

      <div className="mb-4">
        <input
          type="search"
          placeholder="Ханз, пиньинь, утгаар хайх..."
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
          <p className="text-sm text-[var(--app-muted)]">Ханз олдсонгүй.</p>
          <Link
            href="/courses/hsk5"
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
                {level}
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
