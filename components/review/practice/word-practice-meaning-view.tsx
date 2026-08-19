"use client";

import { useCallback, useMemo, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { shuffleArray } from "@/lib/games/game-data-core";
import {
  buildPracticeMatchPairs,
  buildPracticeMeaningDeck,
  rowsToHskWords,
} from "@/lib/review/practice-decks";
import type { HskWordRow } from "@/lib/supabase/hsk-words";

type Props = {
  words: HskWordRow[];
  gameKey: number;
  onComplete: () => void;
  onBackToSummary: () => void;
};

export function WordPracticeMeaningView({
  words,
  gameKey,
  onComplete,
  onBackToSummary,
}: Props) {
  const hskWords = useMemo(() => rowsToHskWords(words), [words]);

  const pairs = useMemo(
    () => buildPracticeMatchPairs(hskWords),
    [hskWords, gameKey]
  );
  const useMatch = pairs.length >= 2;

  if (!useMatch) {
    return (
      <WordPracticeMeaningQuiz
        hskWords={hskWords}
        gameKey={gameKey}
        onComplete={onComplete}
        onBackToSummary={onBackToSummary}
      />
    );
  }

  return (
    <WordPracticeMatchBoard
      pairs={pairs}
      gameKey={gameKey}
      onComplete={onComplete}
      onBackToSummary={onBackToSummary}
    />
  );
}

function WordPracticeMatchBoard({
  pairs,
  gameKey,
  onComplete,
  onBackToSummary,
}: {
  pairs: ReturnType<typeof buildPracticeMatchPairs>;
  gameKey: number;
  onComplete: () => void;
  onBackToSummary: () => void;
}) {
  const locale = useUiLocale();
  const leftItems = useMemo(
    () => shuffleArray(pairs.map((p) => ({ id: p.id, label: p.mongolian }))),
    [pairs, gameKey]
  );
  const rightItems = useMemo(
    () =>
      shuffleArray(
        pairs.map((p) => ({
          id: p.id,
          label: p.chinese,
          sub: p.pinyin,
        }))
      ),
    [pairs, gameKey]
  );

  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);

  const total = pairs.length;
  const matchedCount = matched.size;

  const tryMatch = useCallback(
    (leftId: string, rightId: string) => {
      if (leftId === rightId) {
        setMatched((prev) => {
          const next = new Set(prev).add(leftId);
          if (next.size >= total) {
            setTimeout(() => onComplete(), 400);
          }
          return next;
        });
      } else {
        setWrongFlash(`${leftId}-${rightId}`);
        setTimeout(() => setWrongFlash(null), 600);
      }
      setSelectedLeft(null);
      setSelectedRight(null);
    },
    [onComplete, total]
  );

  return (
    <div className="bs-wpl-meaning">
      <button type="button" onClick={onBackToSummary} className="bs-mem-back">
        ← {tr(locale, "Дүгнэлт рүү")}
      </button>
      <header className="bs-wpl-stroke-head">
        <h2 className="bs-wpl-stroke-title">🔀 {tr(locale, "Утга тааруулах")}</h2>
        <p className="bs-wpl-stroke-meta">
          {matchedCount} / {total} {tr(locale, "хос")}
        </p>
      </header>
      <div className="bs-wpl-match-grid">
        <div className="bs-wpl-match-col">
          {leftItems.map((item) => {
            const isMatched = matched.has(item.id);
            const isSelected = selectedLeft === item.id;
            const isWrong = wrongFlash?.startsWith(item.id);
            return (
              <button
                key={`l-${item.id}`}
                type="button"
                disabled={isMatched}
                onClick={() => {
                  if (selectedRight) tryMatch(item.id, selectedRight);
                  else setSelectedLeft(selectedLeft === item.id ? null : item.id);
                }}
                className={`bs-wpl-match-btn${isMatched ? " bs-wpl-match-btn--ok" : ""}${isSelected ? " bs-wpl-match-btn--sel" : ""}${isWrong ? " bs-wpl-match-btn--bad" : ""}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="bs-wpl-match-col">
          {rightItems.map((item) => {
            const isMatched = matched.has(item.id);
            const isSelected = selectedRight === item.id;
            const isWrong = wrongFlash?.endsWith(item.id);
            return (
              <button
                key={`r-${item.id}`}
                type="button"
                disabled={isMatched}
                onClick={() => {
                  if (selectedLeft) tryMatch(selectedLeft, item.id);
                  else
                    setSelectedRight(selectedRight === item.id ? null : item.id);
                }}
                className={`bs-wpl-match-btn bs-wpl-match-btn--hanzi${isMatched ? " bs-wpl-match-btn--ok" : ""}${isSelected ? " bs-wpl-match-btn--sel" : ""}${isWrong ? " bs-wpl-match-btn--bad" : ""}`}
              >
                <span className="hanzi">{item.label}</span>
                {item.sub ? (
                  <span className="bs-wpl-match-py">{item.sub}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      <p className="bs-wpl-match-hint">{tr(locale, "Монгол утга ба ханзыг хослуулна уу")}</p>
    </div>
  );
}

function WordPracticeMeaningQuiz({
  hskWords,
  gameKey,
  onComplete,
  onBackToSummary,
}: {
  hskWords: ReturnType<typeof rowsToHskWords>;
  gameKey: number;
  onComplete: () => void;
  onBackToSummary: () => void;
}) {
  const locale = useUiLocale();
  const deck = useMemo(
    () => buildPracticeMeaningDeck(hskWords),
    [hskWords, gameKey]
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const current = deck[index];
  const total = deck.length;

  if (deck.length === 0) {
    return (
      <div className="bs-srs-done">
        <p className="text-sm text-[var(--app-muted)]">
          {tr(locale, "Утга асуулт бүрдэж чадсангүй.")}
        </p>
        <button
          type="button"
          onClick={onBackToSummary}
          className="mt-4 min-h-[44px] w-full rounded-[14px] bg-[#eaf0ed] text-sm font-extrabold text-[#3b473f]"
        >
          {tr(locale, "Дүгнэлт рүү буцах")}
        </button>
      </div>
    );
  }

  function pickOption(option: string) {
    if (locked || !current) return;
    setLocked(true);
    setPicked(option);
    const ok = option === current.correct;
    const nextCorrect = ok ? correctCount + 1 : correctCount;
    if (ok) setCorrectCount(nextCorrect);

    setTimeout(() => {
      if (index >= total - 1) {
        onComplete();
        return;
      }
      setIndex((i) => i + 1);
      setPicked(null);
      setLocked(false);
    }, 650);
  }

  return (
    <div className="bs-wpl-meaning">
      <button type="button" onClick={onBackToSummary} className="bs-mem-back">
        ← {tr(locale, "Дүгнэлт рүү")}
      </button>
      <header className="bs-wpl-stroke-head">
        <h2 className="bs-wpl-stroke-title">🔀 {tr(locale, "Утга тааруулах")}</h2>
        <p className="bs-wpl-stroke-meta">
          {index + 1} / {total} · {tr(locale, "зөв")} {correctCount}
        </p>
      </header>
      <div className="bs-meaning-card">
        <p className="text-center text-sm font-bold text-[var(--bs-muted)]">
          {tr(locale, "Энэ үгийн утга?")}
        </p>
        <p className="bs-meaning-hanzi">{current.hanzi}</p>
        {current.pinyin ? (
          <p className="text-center text-sm font-extrabold text-[var(--bs-green)]">
            {current.pinyin}
          </p>
        ) : null}
        <div className="mt-4 grid gap-2">
          {current.options.map((option) => {
            let cls = "bs-meaning-option";
            if (locked && option === current.correct) cls += " bs-meaning-option--correct";
            else if (locked && picked === option && option !== current.correct) {
              cls += " bs-meaning-option--wrong";
            }
            return (
              <button
                key={`${current.id}-${option}`}
                type="button"
                disabled={locked}
                onClick={() => pickOption(option)}
                className={cls}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
