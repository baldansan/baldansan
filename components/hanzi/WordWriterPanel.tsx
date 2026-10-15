"use client";

import dynamic from "next/dynamic";
import "@/components/lesson/lesson-player.css";
import { useEffect, useMemo, useState } from "react";
import { extractHanziCharacters } from "@/lib/hanzi/writing-practice";
import type { HskCharacter } from "@/types/hsk-lesson-package";

const CharacterWriter = dynamic(
  () => import("@/components/hanzi/CharacterWriter").then((m) => m.CharacterWriter),
  { ssr: false, loading: () => <p className="bs-srs-stroke-loading">Ачааллаж байна…</p> }
);

const OPEN_KEY = "buunduu-word-writer-open-v1";

function readOpen(): boolean {
  try {
    return localStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

type Props = {
  word: string;
  /** Нээлттэй/хаалттай сонголтыг хадгалах (default: true) */
  remember?: boolean;
  className?: string;
};

/** «✍️ Бичих» товч + дагаж бичих самбар (ханз тус бүр). Дэлгэх үед л ачаална. */
export function WordWriterPanel({ word, remember = true, className = "" }: Props) {
  const chars = useMemo(() => extractHanziCharacters(word), [word]);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (remember) setOpen(readOpen());
  }, [remember]);
  useEffect(() => {
    setIdx(0);
    setRound(0);
  }, [word]);

  if (chars.length === 0) return null;
  const ch = chars[idx] ?? chars[0]!;
  const hsk: HskCharacter = { hanzi: ch, pinyin: [], practice: "write" };

  function toggle() {
    const next = !open;
    setOpen(next);
    if (remember) {
      try {
        localStorage.setItem(OPEN_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div
      className={`bs-word-writer text-center ${className}`.trim()}
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" className="bs-word-writer-toggle" aria-expanded={open} onClick={toggle}>
        ✍️ Бичих
      </button>
      {open ? (
        <div className="mt-3">
          {chars.length > 1 ? (
            <div className="bs-srs-stroke-tabs" role="tablist" aria-label="Ханз сонгох">
              {chars.map((c, i) => (
                <button
                  key={`${c}-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === idx}
                  className={`bs-srs-stroke-tab ${i === idx ? "bs-srs-stroke-tab--on" : ""}`}
                  onClick={() => setIdx(i)}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : null}
          <CharacterWriter key={`${ch}-${idx}-${round}`} character={hsk} mode="write" />
          <button type="button" className="bs-srs-stroke-hide" onClick={() => setRound((r) => r + 1)}>
            Дахин
          </button>
        </div>
      ) : null}
    </div>
  );
}
