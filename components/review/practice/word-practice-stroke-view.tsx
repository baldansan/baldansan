"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { extractHanziCharacters } from "@/lib/hanzi/writing-practice";
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

type StrokeTask = {
  char: string;
  word: string;
  pinyin: string;
  meaning: string;
  radical?: string | null;
};

type Props = {
  words: HskWordRow[];
  gameKey: number;
  onComplete: () => void;
  onBackToSummary: () => void;
};

function buildStrokeTasks(words: HskWordRow[], minTasks = 6): StrokeTask[] {
  const base: StrokeTask[] = [];
  const seen = new Set<string>();

  for (const word of words) {
    const zh = word.simplified?.trim();
    if (!zh) continue;
    const wordChars = extractHanziCharacters(zh);
    for (const ch of wordChars) {
      const key = `${word.id}:${ch}`;
      if (seen.has(key)) continue;
      seen.add(key);
      base.push({
        char: ch,
        word: zh,
        pinyin: word.pinyin?.trim() ?? "—",
        meaning: word.meaning_mn?.trim() ?? "—",
        // The catalog radical belongs to the whole word — attributing it to
        // every character of a multi-char word teaches wrong radicals.
        radical: wordChars.length === 1 ? word.radical : null,
      });
    }
  }

  if (base.length === 0) return [];

  const out: StrokeTask[] = [];
  let round = 0;
  while (out.length < Math.max(minTasks, base.length) && round < 12) {
    for (const task of base) {
      if (out.length >= Math.max(minTasks, base.length)) break;
      out.push(task);
    }
    round += 1;
  }
  return out.slice(0, Math.max(minTasks, Math.min(8, out.length)));
}

function toHskCharacter(task: StrokeTask): HskCharacter {
  return {
    hanzi: task.char,
    pinyin: task.pinyin !== "—" ? [task.pinyin] : [],
    radical: task.radical?.trim() || undefined,
    practice: "write",
  };
}

export function WordPracticeStrokeView({
  words,
  gameKey,
  onComplete,
  onBackToSummary,
}: Props) {
  const tasks = useMemo(() => buildStrokeTasks(words), [words, gameKey]);
  const [index, setIndex] = useState(0);

  const current = tasks[index];
  const total = tasks.length;

  if (tasks.length === 0) {
    return (
      <div className="bs-srs-done">
        <p className="text-sm text-[var(--app-muted)]">
          Сонгосон үгсэд бичих ханз олдсонгүй.
        </p>
        <button
          type="button"
          onClick={onBackToSummary}
          className="mt-4 min-h-[44px] w-full rounded-[14px] bg-[#eaf0ed] text-sm font-extrabold text-[#3b473f]"
        >
          Дүгнэлт рүү буцах
        </button>
      </div>
    );
  }

  function handleCharDone() {
    if (index >= total - 1) {
      onComplete();
      return;
    }
    setIndex((i) => i + 1);
  }

  return (
    <div className="bs-wpl-stroke">
      <button type="button" onClick={onBackToSummary} className="bs-mem-back">
        ← Дүгнэлт рүү
      </button>
      <header className="bs-wpl-stroke-head">
        <h2 className="bs-wpl-stroke-title">✏️ Зурлагын дасгал</h2>
        <p className="bs-wpl-stroke-meta">
          {index + 1} / {total} · {current.word} ({current.meaning})
        </p>
      </header>
      <p className="bs-wpl-stroke-hint">
        Ханзыг өөрөө зур. Буруу зураасанд шууд засна.
      </p>
      <CharacterWriter
        key={`${gameKey}-${current.char}-${index}`}
        character={toHskCharacter(current)}
        mode="write"
        onComplete={handleCharDone}
      />
    </div>
  );
}
