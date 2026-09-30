"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfusableChars } from "@/components/hanzi/confusable-chars";
import { HanziWriterPractice } from "@/components/hanzi/hanzi-writer-practice";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { saveWordFromLesson } from "@/lib/supabase/saved-words";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

export type DictionaryWordLike = {
  id: number;
  simplified: string;
  traditional: string | null;
  pinyin: string | null;
  pos: string | null;
  radical: string | null;
  hsk_level: string | number | null;
  meaning_en: string | null;
  meaning_mn: string | null;
  example_zh: string | null;
  example_pinyin: string | null;
  example_mn: string | null;
};

const HAN_RE = /\p{Script=Han}/u;

/** PC: толь бичгийн баруун самбар — сонгосон үгийн дэлгэрэнгүй + зураасны дараалал. */
export function WordDetailPanel({ word }: { word: DictionaryWordLike | null }) {
  const locale = useUiLocale();
  const chars = word ? Array.from(word.simplified).filter((c) => HAN_RE.test(c)) : [];
  const [charIdx, setCharIdx] = useState(0);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    setCharIdx(0);
    setSaved(null);
  }, [word?.id]);

  if (!word) {
    return (
      <div className="bs-dict-empty">
        <p className="text-4xl" aria-hidden>📖</p>
        <p className="mt-2 text-sm font-semibold text-[var(--app-text)]">{tr(locale, "Зүүн талаас үг сонго")}</p>
        <p className="mt-1 text-xs text-[var(--app-muted)]">
          {tr(locale, "Утга, жишээ өгүүлбэр, зураасны дараалал энд гарна")}
        </p>
      </div>
    );
  }

  const meaning = word.meaning_mn || word.meaning_en || "";
  const showTraditional = word.traditional && word.traditional !== word.simplified;
  const activeChar = chars[charIdx] ?? null;

  async function handleSave() {
    const r = await saveWordFromLesson({
      zh: word!.simplified,
      pinyin: word!.pinyin ?? undefined,
      mn: word!.meaning_mn ?? undefined,
    });
    if (r.ok) {
      setSaved(r.alreadyInSrs || r.duplicate ? tr(locale, "Аль хэдийн хадгалсан") : tr(locale, "Давталтад нэмлээ ✓"));
    } else if (r.error) {
      setSaved(r.error);
    }
  }

  return (
    <div className="bs-dict-panel" translate="no">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="hanzi text-5xl font-bold leading-tight text-[var(--app-text)]">{word.simplified}</p>
          {showTraditional ? <p className="hanzi mt-0.5 text-sm text-slate-400">{word.traditional}</p> : null}
          <p className="mt-1 text-lg font-semibold text-emerald-700">{word.pinyin}</p>
        </div>
        <SpeakerButton
          text={word.simplified}
          lang="zh-CN"
          hskLevel={word.hsk_level != null ? String(word.hsk_level) : undefined}
          size="md"
          showInlineError={false}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {word.hsk_level != null && word.hsk_level !== "" ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            HSK {word.hsk_level}
          </span>
        ) : null}
        {word.pos ? (
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
            {word.pos}
          </span>
        ) : null}
        {word.radical ? (
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
            {tr(locale, "язгуур")} {word.radical}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-base font-semibold text-[var(--app-text)]">{meaning}</p>
      {word.meaning_mn && word.meaning_en ? (
        <p className="mt-0.5 text-xs text-[var(--app-muted)]">{word.meaning_en}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="app-btn-primary !min-h-[40px] !py-0 px-4 text-sm" onClick={() => void handleSave()}>
          ＋ {tr(locale, "Үгсэд нэмэх")}
        </button>
        <Link href={`/library/idioms?q=${encodeURIComponent(word.simplified)}`} className="app-btn-secondary !min-h-[40px] !py-0 px-4 text-sm">
          {tr(locale, "Хэлц үгэнд хайх")}
        </Link>
      </div>
      {saved ? <p className="mt-2 text-xs font-semibold text-emerald-700">{saved}</p> : null}

      {word.example_zh ? (
        <div className="mt-4 rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="hanzi text-lg font-semibold text-[var(--app-text)]">{word.example_zh}</p>
              {word.example_pinyin ? <p className="mt-0.5 text-xs text-emerald-700">{word.example_pinyin}</p> : null}
              {word.example_mn ? <p className="mt-1 text-sm text-[var(--app-text)]">{word.example_mn}</p> : null}
            </div>
            <SpeakerButton text={word.example_zh} lang="zh-CN" size="sm" showInlineError={false} />
          </div>
        </div>
      ) : null}

      {chars.length > 0 ? (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">{tr(locale, "Зураасны дараалал")}</p>
            {chars.length > 1 ? (
              <div className="flex gap-1">
                {chars.map((c, i) => (
                  <button
                    key={`${c}-${i}`}
                    type="button"
                    onClick={() => setCharIdx(i)}
                    className={`hanzi h-9 w-9 rounded-lg text-lg font-bold ring-1 ${
                      i === charIdx ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-[var(--app-text)] ring-slate-200"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {activeChar ? (
            <div className="mt-2 flex justify-center">
              <HanziWriterPractice key={activeChar} character={activeChar} />
            </div>
          ) : null}
        </div>
      ) : null}

      <ConfusableChars text={word.simplified} className="mt-3" />
    </div>
  );
}
