"use client";

import dynamic from "next/dynamic";
import "@/components/lesson/lesson-player.css";
import { useEffect, useMemo, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { extractHanziCharacters } from "@/lib/hanzi/writing-practice";
import { recordWritingResult } from "@/lib/srs/writing-srs-sync";
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

type Props = {
  simplified: string;
  wordRadical?: string | null;
  /** Collapse stroke UI when card flips back or advances. */
  active?: boolean;
  /** Бичих SRS бүртгэлд (сонголттой). */
  wordId?: number | null;
  pinyin?: string | null;
  meaning?: string | null;
};

function toHskCharacter(hanzi: string, radical?: string | null): HskCharacter {
  return {
    hanzi,
    pinyin: [],
    radical: radical?.trim() || undefined,
    practice: "recognize",
  };
}

export function WordSrsStrokePanel({
  simplified,
  wordRadical,
  active = true,
  wordId = null,
  pinyin = null,
  meaning = null,
}: Props) {
  const locale = useUiLocale();
  const chars = useMemo(
    () => extractHanziCharacters(simplified),
    [simplified]
  );
  const [open, setOpen] = useState(false);
  /** write = өөрөө бичих (үндсэн); recognize = зурлагын анимац харах */
  const [panelMode, setPanelMode] = useState<"write" | "recognize">("write");
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    setOpen(false);
    setCharIndex(0);
  }, [simplified]);

  useEffect(() => {
    if (!active) setOpen(false);
  }, [active]);

  if (chars.length === 0) return null;

  const activeChar = chars[charIndex] ?? chars[0]!;

  return (
    <div className="bs-srs-stroke">
      {!open ? (
        <div className="flex gap-2">
          <button
            type="button"
            className="bs-srs-stroke-toggle flex-1"
            onClick={() => {
              setPanelMode("write");
              setOpen(true);
            }}
          >
            ✍️ {tr(locale, "Бичиж үзэх")}
          </button>
          <button
            type="button"
            className="bs-srs-stroke-toggle flex-1"
            onClick={() => {
              setPanelMode("recognize");
              setOpen(true);
            }}
          >
            {tr(locale, "Зурлага үзэх")}
          </button>
        </div>
      ) : (
        <div className="bs-srs-stroke-body">
          {chars.length > 1 ? (
            <div className="bs-srs-stroke-tabs" role="tablist" aria-label={tr(locale, "Ханз сонгох")}>
              {chars.map((ch, i) => (
                <button
                  key={`${ch}-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === charIndex}
                  className={`bs-srs-stroke-tab ${i === charIndex ? "bs-srs-stroke-tab--on" : ""}`}
                  onClick={() => setCharIndex(i)}
                >
                  {ch}
                </button>
              ))}
            </div>
          ) : null}
          <CharacterWriter
            key={`${panelMode}-${charIndex}-${activeChar}`}
            character={toHskCharacter(
              activeChar,
              chars.length === 1 ? wordRadical : null
            )}
            mode={panelMode}
            onResult={
              panelMode === "write"
                ? (result) =>
                    recordWritingResult(
                      { key: simplified, wordId, pinyin, meaning },
                      result
                    )
                : undefined
            }
          />
          <button
            type="button"
            className="bs-srs-stroke-hide"
            onClick={() => setOpen(false)}
          >
            {tr(locale, "Хаах")}
          </button>
        </div>
      )}
    </div>
  );
}
