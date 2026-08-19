"use client";

import { useMemo, useState } from "react";
import {
  countByRating,
  PRACTICE_CARDS,
  type SessionWordRow,
  type WordPracticeMode,
} from "@/lib/review/word-practice-types";
import type { WordSrsRating } from "@/lib/srs/word-srs-types";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

type Props = {
  title: string;
  subtitle?: string;
  words: SessionWordRow[];
  selectedIds: Set<number>;
  onSelectedIdsChange: (ids: Set<number>) => void;
  onStartPractice: (mode: WordPracticeMode) => void;
  enabledModes?: WordPracticeMode[];
  onNextBatch?: () => void;
  nextBatchLabel?: string;
};

const GROUP_ORDER: { rating: WordSrsRating; label: string; chipClass: string }[] =
  [
    { rating: "forgot", label: "Мартсан", chipClass: "bs-wpl-dot--forgot" },
    { rating: "hard", label: "Эргэлзсэн", chipClass: "bs-wpl-dot--hard" },
    { rating: "known", label: "Мэдсэн", chipClass: "bs-wpl-dot--known" },
  ];

function toggleId(set: Set<number>, id: number, on: boolean): Set<number> {
  const next = new Set(set);
  if (on) next.add(id);
  else next.delete(id);
  return next;
}

export function WordPracticeLauncher({
  title,
  subtitle,
  words,
  selectedIds,
  onSelectedIdsChange,
  onStartPractice,
  enabledModes = ["srs-retry"],
  onNextBatch,
  nextBatchLabel = "Дараагийн багц руу →",
}: Props) {
  const locale = useUiLocale();
  const [knownOpen, setKnownOpen] = useState(false);
  const counts = useMemo(() => countByRating(words), [words]);
  const selectedCount = selectedIds.size;

  const groups = useMemo(() => {
    return GROUP_ORDER.map((g) => ({
      ...g,
      items: words.filter((w) => w.rating === g.rating),
    })).filter((g) => g.items.length > 0);
  }, [words]);

  const unrated = words.filter((w) => !w.rating);

  function selectAll() {
    onSelectedIdsChange(new Set(words.map((w) => w.id)));
  }

  function clearAll() {
    onSelectedIdsChange(new Set());
  }

  function toggleGroup(groupWords: SessionWordRow[], select: boolean) {
    let next = new Set(selectedIds);
    for (const w of groupWords) {
      next = toggleId(next, w.id, select);
    }
    onSelectedIdsChange(next);
  }

  return (
    <div className="bs-wpl">
      <header className="bs-wpl-head">
        <h2 className="bs-wpl-title">{title}</h2>
        {subtitle ? <p className="bs-wpl-sub">{subtitle}</p> : null}
      </header>

      <div className="bs-wpl-chips" aria-label={tr(locale, "Дүгнэлт")}>
        <span className="bs-wpl-chip bs-wpl-chip--known">
          {tr(locale, "Мэдсэн")} {counts.known}
        </span>
        <span className="bs-wpl-chip bs-wpl-chip--hard">
          {tr(locale, "Эргэлзсэн")} {counts.hard}
        </span>
        <span className="bs-wpl-chip bs-wpl-chip--forgot">
          {tr(locale, "Мартсан")} {counts.forgot}
        </span>
      </div>

      <section className="bs-wpl-section">
        <div className="bs-wpl-section-head">
          <h3 className="bs-wpl-section-title">{tr(locale, "Үг сонгох")}</h3>
          <div className="bs-wpl-bulk">
            <button type="button" className="bs-wpl-bulk-btn" onClick={selectAll}>
              {tr(locale, "Бүгдийг сонгох")}
            </button>
            <span className="bs-wpl-bulk-sep">·</span>
            <button type="button" className="bs-wpl-bulk-btn" onClick={clearAll}>
              {tr(locale, "Арилгах")}
            </button>
          </div>
        </div>

        <div className="bs-wpl-word-groups">
          {groups.map((group) => {
            const isKnown = group.rating === "known";
            const collapsed = isKnown && !knownOpen;
            const groupAllSelected = group.items.every((w) =>
              selectedIds.has(w.id)
            );

            return (
              <div key={group.rating} className="bs-wpl-group">
                <div className="bs-wpl-group-head">
                  {isKnown ? (
                    <button
                      type="button"
                      className="bs-wpl-group-head-main"
                      onClick={() => setKnownOpen((o) => !o)}
                      aria-expanded={knownOpen}
                    >
                      <span
                        className={`bs-wpl-dot ${group.chipClass}`}
                        aria-hidden
                      />
                      <span className="bs-wpl-group-label">
                        {tr(locale, group.label)} ({group.items.length})
                      </span>
                      <span className="bs-wpl-group-chevron">
                        {knownOpen ? "▾" : "▸"}
                      </span>
                    </button>
                  ) : (
                    <>
                      <span
                        className={`bs-wpl-dot ${group.chipClass}`}
                        aria-hidden
                      />
                      <span className="bs-wpl-group-label">
                        {tr(locale, group.label)} ({group.items.length})
                      </span>
                      <button
                        type="button"
                        className="bs-wpl-group-toggle"
                        onClick={() =>
                          toggleGroup(group.items, !groupAllSelected)
                        }
                      >
                        {groupAllSelected
                          ? tr(locale, "Бүгдийг хас")
                          : tr(locale, "Бүгдийг сонго")}
                      </button>
                    </>
                  )}
                </div>

                {!collapsed ? (
                  <ul className="bs-wpl-word-list">
                    {group.items.map((word) => (
                      <li key={word.id}>
                        <label className="bs-wpl-word-row">
                          <input
                            type="checkbox"
                            className="bs-wpl-check"
                            checked={selectedIds.has(word.id)}
                            onChange={(e) =>
                              onSelectedIdsChange(
                                toggleId(
                                  selectedIds,
                                  word.id,
                                  e.target.checked
                                )
                              )
                            }
                          />
                          <span className="bs-wpl-word-hanzi hanzi">
                            {word.simplified}
                          </span>
                          <span className="bs-wpl-word-meta">
                            {word.pinyin ?? "—"} · {word.meaning_mn ?? "—"}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}

          {unrated.length > 0 ? (
            <div className="bs-wpl-group">
              <p className="bs-wpl-group-label px-1">
                {tr(locale, "Үнэлээгүй")} ({unrated.length})
              </p>
              <ul className="bs-wpl-word-list">
                {unrated.map((word) => (
                  <li key={word.id}>
                    <label className="bs-wpl-word-row">
                      <input
                        type="checkbox"
                        className="bs-wpl-check"
                        checked={selectedIds.has(word.id)}
                        onChange={(e) =>
                          onSelectedIdsChange(
                            toggleId(selectedIds, word.id, e.target.checked)
                          )
                        }
                      />
                      <span className="bs-wpl-word-hanzi hanzi">
                        {word.simplified}
                      </span>
                      <span className="bs-wpl-word-meta">
                        {word.pinyin ?? "—"} · {word.meaning_mn ?? "—"}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="bs-wpl-section">
        <h3 className="bs-wpl-section-title">{tr(locale, "Дасгал сонгох")}</h3>
        <p className="bs-wpl-section-hint">
          {selectedCount > 0
            ? `${selectedCount} ${tr(locale, "үг сонгогдсон")}`
            : tr(locale, "Эхлээд дор хаяж нэг үг сонгоно уу")}
        </p>
        <div className="bs-wpl-practice-grid">
          {PRACTICE_CARDS.map((card) => {
            const enabled = enabledModes.includes(card.mode);
            const canStart = enabled && selectedCount > 0;
            return (
              <button
                key={card.mode}
                type="button"
                className={`bs-wpl-practice-card${enabled ? "" : " bs-wpl-practice-card--soon"}`}
                disabled={!canStart}
                onClick={() => onStartPractice(card.mode)}
              >
                <span className="bs-wpl-practice-emoji">{card.emoji}</span>
                <span className="bs-wpl-practice-title">{tr(locale, card.title)}</span>
                <span className="bs-wpl-practice-desc">{tr(locale, card.description)}</span>
                <span className="bs-wpl-practice-count">
                  {enabled
                    ? `${selectedCount} ${tr(locale, "үгээр")}`
                    : tr(locale, "Удахгүй")}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {onNextBatch ? (
        <button type="button" className="bs-wpl-next-batch" onClick={onNextBatch}>
          {tr(locale, nextBatchLabel)}
        </button>
      ) : null}
    </div>
  );
}
