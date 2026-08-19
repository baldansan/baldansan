"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { extractHanziCharacters } from "@/lib/hanzi/writing-practice";
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
}: Props) {
  const locale = useUiLocale();
  const chars = useMemo(
    () => extractHanziCharacters(simplified),
    [simplified]
  );
  const [open, setOpen] = useState(false);
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
        <button
          type="button"
          className="bs-srs-stroke-toggle"
          onClick={() => setOpen(true)}
        >
          {tr(locale, "Зурлага үзэх")}
        </button>
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
            key={`${charIndex}-${activeChar}`}
            character={toHskCharacter(
              activeChar,
              chars.length === 1 ? wordRadical : null
            )}
            mode="recognize"
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
