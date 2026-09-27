"use client";

import { useEffect, useState } from "react";

/**
 * «Утга задаргаа» (构词) — үгийн ханз бүрийн богино монгол утгыг
 * `电 цахилгаан + 话 яриа` хэлбэрээр харуулна.
 * Эх: public/data/hsk_char_gloss.json — { "<ханз>": { p, mn } }.
 * Зөвхөн 2–4 ханзтай үгэнд; ганц ханз, ханз бус текст эсвэл аль нэг
 * ханзны утга байхгүй бол юу ч харуулахгүй.
 */
type CharGloss = { p: string; mn: string };
type CharGlossMap = Record<string, CharGloss>;

let glossCache: Promise<CharGlossMap> | null = null;

function loadCharGloss(): Promise<CharGlossMap> {
  if (!glossCache) {
    glossCache = fetch("/data/hsk_char_gloss.json")
      .then((res) => (res.ok ? (res.json() as Promise<CharGlossMap>) : {}))
      .catch(() => ({}) as CharGlossMap);
  }
  return glossCache;
}

const HAN_ONLY = /^\p{Script=Han}+$/u;

/** 2–4 ханзтай үг бол ханзуудыг нь буцаана, үгүй бол null. */
function splitHanWord(text: string): string[] | null {
  const trimmed = text.trim();
  if (!HAN_ONLY.test(trimmed)) return null;
  const chars = Array.from(trimmed);
  if (chars.length < 2 || chars.length > 4) return null;
  return chars;
}

type Props = {
  text: string;
  className?: string;
};

export function WordPartsLine({ text, className }: Props) {
  const [parts, setParts] = useState<{ char: string; mn: string }[] | null>(
    null
  );

  useEffect(() => {
    const chars = splitHanWord(text);
    if (!chars) {
      setParts(null);
      return;
    }
    let cancelled = false;
    void loadCharGloss().then((map) => {
      if (cancelled) return;
      const next: { char: string; mn: string }[] = [];
      for (const char of chars) {
        const gloss = map[char];
        const mn = gloss?.mn?.trim();
        if (!mn) {
          setParts(null);
          return;
        }
        next.push({ char, mn });
      }
      setParts(next);
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!parts || parts.length === 0) return null;

  return (
    <div
      className={`bs-word-parts text-xs ${className ?? ""}`.trim()}
      translate="no"
    >
      {parts.map((part, i) => (
        <span key={`${part.char}-${i}`} className="bs-word-parts-chip">
          {i > 0 ? (
            <span className="bs-word-parts-plus" aria-hidden>
              +{" "}
            </span>
          ) : null}
          <b>{part.char}</b> <span>{part.mn}</span>
        </span>
      ))}
    </div>
  );
}
