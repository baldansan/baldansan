"use client";

import { useMemo, useState } from "react";
import { playSfx } from "@/lib/games/game-fx";
import { shuffle, type LearnWord } from "@/lib/games/learn-session";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

type Props = {
  words: LearnWord[];
  /** Бүх хос таарсны дараа: үг бүр алдаагүй таарсан эсэх. */
  onDone: (results: { word: LearnWord; correct: boolean }[]) => void;
};

function meaning(w: LearnWord): string {
  return (w.meaning_mn ?? w.meaning_en ?? "").trim();
}

/** Холбох үе: 5 ханзыг монгол утгатай нь хослуулна. Буруу хослуулсан үг дахин ирнэ. */
export function MatchRound({ words, onDone }: Props) {
  const locale = useUiLocale();
  // Хоёр баганын дарааллыг нэг л удаа холино (mount бүрт key-ээр шинэчлэгдэнэ).
  const [left] = useState(() => shuffle(words));
  const [right] = useState(() => shuffle(words));
  const [pickL, setPickL] = useState<number | null>(null);
  const [pickR, setPickR] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [failed, setFailed] = useState<number[]>([]);
  const [wrongPair, setWrongPair] = useState<[number, number] | null>(null);

  const remaining = useMemo(() => words.length - matched.length, [words, matched]);

  function tryPair(l: number | null, r: number | null) {
    if (l == null || r == null) return;
    if (l === r) {
      const next = [...matched, l];
      playSfx("correct");
      setMatched(next);
      setPickL(null);
      setPickR(null);
      if (next.length === words.length) {
        onDone(words.map((w) => ({ word: w, correct: !failed.includes(w.id) })));
      }
      return;
    }
    playSfx("wrong");
    setFailed((p) => [...new Set([...p, l, r])]);
    setWrongPair([l, r]);
    window.setTimeout(() => {
      setWrongPair(null);
      setPickL(null);
      setPickR(null);
    }, 500);
  }

  const cell = (id: number, side: "l" | "r") => {
    const isMatched = matched.includes(id);
    const picked = side === "l" ? pickL === id : pickR === id;
    const wrong = wrongPair ? wrongPair[side === "l" ? 0 : 1] === id : false;
    return `rounded-2xl px-2 py-3 font-bold ring-1 transition active:scale-[0.97] ${
      isMatched
        ? "invisible"
        : wrong
          ? "bg-red-500 text-white ring-red-500"
          : picked
            ? "bg-emerald-600 text-white ring-emerald-600"
            : "bg-white text-slate-900 ring-slate-200 hover:bg-emerald-50"
    }`;
  };

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-center text-xs font-semibold text-slate-500">
        {tr(locale, "Үгийг утгатай нь холбо")} · {remaining} {tr(locale, "үлдсэн")}
      </p>
      <div className="mt-3 grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2">
        <div className="flex flex-col gap-2">
          {left.map((w) => (
            <button
              key={w.id}
              type="button"
              disabled={matched.includes(w.id) || wrongPair !== null}
              onClick={() => {
                setPickL(w.id);
                tryPair(w.id, pickR);
              }}
              className={`${cell(w.id, "l")} text-2xl`}
              translate="no"
            >
              {w.simplified}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {right.map((w) => (
            <button
              key={w.id}
              type="button"
              disabled={matched.includes(w.id) || wrongPair !== null}
              onClick={() => {
                setPickR(w.id);
                tryPair(pickL, w.id);
              }}
              className={`${cell(w.id, "r")} min-h-[56px] text-sm leading-snug`}
              translate="no"
            >
              {meaning(w)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
