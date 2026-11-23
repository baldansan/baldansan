"use client";

import { useEffect, useState } from "react";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { POS_OPTIONS } from "@/lib/dictionary/types";
import { fetchApprovedDictionary, type ApprovedDictionary } from "@/lib/supabase/dictionary-senses";

const posLabel = (v: string | null) => POS_OPTIONS.find((p) => p.v === v)?.mn ?? v ?? "";

/**
 * Толь бичиг v2 — батлагдсан баялаг утгууд (олон утга, синоним, жишээ, хэрэглээ).
 * Байхгүй бол юу ч харуулахгүй → хуучин meaning_mn/example хэвээр үлдэнэ.
 * `onLoaded(true)` — эцэг нь хуучин ганц утга/жишээг нуухад.
 */
export function WordSenses({ wordId, onLoaded }: { wordId: number; onLoaded?: (has: boolean) => void }) {
  const [data, setData] = useState<ApprovedDictionary | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    fetchApprovedDictionary(wordId)
      .then((d) => {
        if (!alive) return;
        setData(d);
        onLoaded?.(Boolean(d));
      })
      .catch(() => alive && onLoaded?.(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordId]);

  if (!data) return null;

  return (
    <div className="mt-3 space-y-3" translate="no">
      {data.senses.map((s) => (
        <section key={s.id ?? s.sense_no} className="rounded-2xl bg-[var(--app-surface,#fff)] p-3 ring-1 ring-slate-200/70">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
              {s.sense_no}
            </span>
            {s.pos ? <span className="text-[11px] font-semibold text-slate-500">{posLabel(s.pos)}</span> : null}
            <span className="text-base font-semibold text-[var(--app-text)]">{s.meaning_mn}</span>
            {s.gloss_zh ? <span className="hanzi text-xs text-slate-500">{s.gloss_zh}</span> : null}
          </div>
          {s.synonyms_mn.length ? (
            <p className="mt-1 text-sm text-[var(--app-muted)]">{s.synonyms_mn.join(" · ")}</p>
          ) : null}
          {s.note_mn ? <p className="mt-1 text-xs text-slate-500">{s.note_mn}</p> : null}
          {s.examples.length ? (
            <ul className="mt-2 space-y-1.5">
              {s.examples.map((ex) => (
                <li key={ex.id ?? ex.zh} className="flex items-start gap-2 rounded-xl bg-emerald-50/70 px-2.5 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="hanzi text-[15px] font-medium text-[var(--app-text)]">{ex.zh}</p>
                    {ex.pinyin ? <p className="text-[11px] text-emerald-700">{ex.pinyin}</p> : null}
                    <p className="text-sm text-[var(--app-text)]">{ex.mn}</p>
                  </div>
                  <SpeakerButton text={ex.zh} lang="zh-CN" size="sm" showInlineError={false} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      {data.entry?.collocations?.length ? (
        <section className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Холбоо үг</p>
          <ul className="mt-1 grid gap-1 sm:grid-cols-2">
            {data.entry.collocations.map((c) => (
              <li key={c.zh} className="text-sm">
                <span className="hanzi font-medium text-[var(--app-text)]">{c.zh}</span>
                {c.pinyin ? <span className="ml-1 text-[11px] text-slate-500">{c.pinyin}</span> : null}
                <span className="ml-1 text-[var(--app-muted)]">— {c.mn}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.entry?.usage_note_mn || data.entry?.confusable_with?.length || data.entry?.measure_words?.length ? (
        <section className="rounded-2xl bg-amber-50/70 p-3 ring-1 ring-amber-200/70">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Хэрэглээ</p>
          {data.entry.usage_note_mn ? <p className="mt-1 text-sm text-[var(--app-text)]">{data.entry.usage_note_mn}</p> : null}
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {data.entry.measure_words?.length ? (
              <span>
                Тооны нэр: <span className="hanzi">{data.entry.measure_words.join("、")}</span>
              </span>
            ) : null}
            {data.entry.confusable_with?.length ? (
              <span>
                Андуурагддаг: <span className="hanzi">{data.entry.confusable_with.join("、")}</span>
              </span>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
