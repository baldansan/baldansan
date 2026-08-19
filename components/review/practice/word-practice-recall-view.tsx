"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { extractHanziCharacters } from "@/lib/hanzi/writing-practice";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type { HskWordRow } from "@/lib/supabase/hsk-words";
import type { HskCharacter } from "@/types/hsk-lesson-package";

const CharacterWriter = dynamic(
  () =>
    import("@/components/hanzi/CharacterWriter").then((m) => m.CharacterWriter),
  {
    ssr: false,
    loading: () => (
      <p className="bs-srs-stroke-loading">Ачааллаж байна…</p>
    ),
  }
);

type RecallTask = {
  word: string;
  pinyin: string | null;
  meaning: string;
  charCount: number;
};

type Props = {
  words: HskWordRow[];
  gameKey: number;
  onComplete: () => void;
  onBackToSummary: () => void;
};

function buildRecallTasks(words: HskWordRow[]): RecallTask[] {
  const out: RecallTask[] = [];
  const seen = new Set<string>();

  for (const word of words) {
    const zh = word.simplified?.trim();
    const meaning = word.meaning_mn?.trim();
    if (!zh || !meaning) continue;
    const chars = extractHanziCharacters(zh);
    if (chars.length === 0) continue;
    if (seen.has(zh)) continue;
    seen.add(zh);
    out.push({
      word: zh,
      pinyin: word.pinyin?.trim() || null,
      meaning,
      charCount: chars.length,
    });
  }
  return out;
}

function toHskCharacter(task: RecallTask): HskCharacter {
  return {
    hanzi: task.word,
    pinyin: [],
    practice: "write",
  };
}

export function WordPracticeRecallView({
  words,
  gameKey,
  onComplete,
  onBackToSummary,
}: Props) {
  const locale = useUiLocale();
  const tasks = useMemo(() => buildRecallTasks(words), [words, gameKey]);
  const [index, setIndex] = useState(0);

  const current = tasks[index];
  const total = tasks.length;

  if (tasks.length === 0 || !current) {
    return (
      <div className="bs-srs-done">
        <p className="text-sm text-[var(--app-muted)]">
          {tr(locale, "Сонгосон үгсэд бичих ханз олдсонгүй.")}
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

  function handleWordDone() {
    if (index >= total - 1) {
      onComplete();
      return;
    }
    setIndex((i) => i + 1);
  }

  return (
    <div className="bs-wpl-stroke">
      <button type="button" onClick={onBackToSummary} className="bs-mem-back">
        ← {tr(locale, "Дүгнэлт рүү")}
      </button>
      <header className="bs-wpl-stroke-head">
        <h2 className="bs-wpl-stroke-title">🧠 {tr(locale, "Санаж бичих")}</h2>
        <p className="bs-wpl-stroke-meta">
          {index + 1} / {total}
        </p>
      </header>

      {/* Асуулт: утга + пиньинь + дуудлага. Ханзыг ХАРУУЛАХГҮЙ. */}
      <div className="mb-3 rounded-2xl bg-white px-4 py-3 text-center ring-1 ring-slate-200">
        <p className="text-base font-bold text-[var(--app-text)]">
          {current.meaning}
        </p>
        <div className="mt-1 flex items-center justify-center gap-2">
          {current.pinyin ? (
            <p className="text-sm font-extrabold text-emerald-700">
              {current.pinyin}
            </p>
          ) : null}
          <SpeakerButton
            text={current.word}
            lang="zh"
            size="sm"
            label={tr(locale, "Дуудлага сонсох")}
            showInlineError={false}
          />
        </div>
        <p className="mt-1 text-xs text-[var(--app-muted)]">
          {current.charCount > 1
            ? `${current.charCount} ${tr(locale, "ханзтай үг — цээжээрээ бич")}`
            : tr(locale, "Энэ үгийг цээжээрээ бич")}
        </p>
      </div>

      <CharacterWriter
        key={`${gameKey}-${current.word}-${index}`}
        character={toHskCharacter(current)}
        mode="recall"
        onComplete={handleWordDone}
      />
    </div>
  );
}
