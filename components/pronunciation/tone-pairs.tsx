"use client";

import { useEffect, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type { TonePairs } from "@/lib/pronunciation/data";
import { TONE_GLYPH } from "@/lib/pronunciation/pinyin-mark";
import { stopSyllable } from "@/lib/pronunciation/syllable-player";
import { playChineseWordAudio } from "@/lib/tts/play-chinese-word-audio";
import { PronunciationPractice } from "@/components/speech/pronunciation-practice";
import { TonePairIcon } from "./tone-contour-svg";

type Props = { pairs: TonePairs };

export function TonePairsView({ pairs }: Props) {
  const locale = useUiLocale();
  const [pattern, setPattern] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [mic, setMic] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => stopSyllable(), []);

  const pickPattern = (p: string) => {
    stopSyllable();
    setPattern(p);
    setI(0);
    setMic(false);
  };

  const words = pattern ? pairs[pattern] ?? [] : [];
  const word = words[i];

  const play = async () => {
    if (!word || playing) return;
    setPlaying(true);
    try {
      await playChineseWordAudio(word.zh);
    } finally {
      setPlaying(false);
    }
  };

  const nextWord = () => {
    if (words.length === 0) return;
    setMic(false);
    setI((k) => (k + 1) % words.length);
  };

  const patternLabel = (p: string) => `${TONE_GLYPH[Number(p[0])]}${TONE_GLYPH[Number(p[1])]}`;

  return (
    <div>
      {/* Сонгогч: 4×4 + саармаг багана */}
      <div className="app-card p-3">
        <p className="mb-2 text-[11px] font-semibold text-[var(--app-muted)]">
          {tr(locale, "Мөр = 1-р үе, багана = 2-р үе (сүүлийнх нь саармаг)")}
        </p>
        <div className="grid grid-cols-6 gap-1" translate="no">
          <span />
          {[1, 2, 3, 4, 0].map((t2) => (
            <span key={t2} className="text-center text-xl font-extrabold leading-5 text-slate-500">
              {TONE_GLYPH[t2]}
            </span>
          ))}
          {[1, 2, 3, 4].map((t1) => (
            <FragmentRow key={t1} t1={t1} pairs={pairs} pattern={pattern} onPick={pickPattern} />
          ))}
        </div>
      </div>

      {pattern && word ? (
        <div className="app-card mt-3 p-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-200" translate="no">
              {patternLabel(pattern)} · {pattern}
            </span>
            <span className="text-xs font-semibold text-[var(--app-muted)]">
              {i + 1}/{words.length} · HSK {word.level}
            </span>
          </div>
          <p className="mt-3 text-center text-5xl font-extrabold text-slate-800" translate="no">
            {word.zh}
          </p>
          <p className="mt-1 text-center text-xl font-bold text-emerald-700" translate="no">
            {word.pinyin}
          </p>
          <p className="mt-1 text-center text-sm text-slate-600" translate="no">
            {word.mn}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void play()}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-bold ring-1 ${
                playing ? "bg-sky-100 text-sky-800 ring-sky-300" : "bg-white text-sky-700 ring-sky-300"
              }`}
            >
              🔊 {tr(locale, "Сонсох")}
            </button>
            <button
              type="button"
              onClick={() => setMic((m) => !m)}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-bold ring-1 ${
                mic ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-emerald-700 ring-emerald-300"
              }`}
            >
              🎤 {tr(locale, "Дагаж хэлэх")}
            </button>
            <button
              type="button"
              onClick={nextWord}
              className="whitespace-nowrap rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white"
            >
              {tr(locale, "Дараагийн →")}
            </button>
          </div>
          {mic ? (
            <PronunciationPractice key={word.zh} text={word.zh} pinyin={word.pinyin} sectionLink={false} className="mt-3" />
          ) : null}
        </div>
      ) : pattern ? (
        <p className="mt-3 text-center text-sm text-[var(--app-muted)]">{tr(locale, "Энэ хэвд үг алга.")}</p>
      ) : (
        <p className="mt-3 text-center text-sm text-[var(--app-muted)]">{tr(locale, "Аялгуугийн хэв сонгоно уу.")}</p>
      )}
    </div>
  );
}

function FragmentRow({
  t1,
  pairs,
  pattern,
  onPick,
}: {
  t1: number;
  pairs: TonePairs;
  pattern: string | null;
  onPick: (p: string) => void;
}) {
  return (
    <>
      <span className="flex items-center justify-center text-xl font-extrabold text-slate-500">{TONE_GLYPH[t1]}</span>
      {[1, 2, 3, 4, 0].map((t2) => {
        const key = `${t1}${t2}`;
        const n = pairs[key]?.length ?? 0;
        const on = pattern === key;
        return (
          <button
            key={key}
            type="button"
            disabled={n === 0}
            onClick={() => onPick(key)}
            className={`flex flex-col items-center rounded-xl py-1 ring-1 transition-colors disabled:opacity-30 ${
              on ? "bg-emerald-600 ring-emerald-600" : "bg-white ring-slate-200 active:bg-emerald-50"
            }`}
            aria-label={key}
          >
            <TonePairIcon t1={t1} t2={t2} width={44} height={22} inverted={on} />
            <span className={`text-[9px] font-bold ${on ? "text-white" : "text-slate-500"}`}>{n}</span>
          </button>
        );
      })}
    </>
  );
}
