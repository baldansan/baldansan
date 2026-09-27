"use client";

import { useEffect, useMemo, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { toneMark } from "@/lib/pronunciation/pinyin-mark";
import type { PinyinChart } from "@/lib/pronunciation/minimal-pairs";
import { playSyllable, stopSyllable } from "@/lib/pronunciation/syllable-player";
import { PronunciationPractice } from "@/components/speech/pronunciation-practice";
import { ToneContourSvg } from "./tone-contour-svg";

/** Эгшгийн бүлэг (мөрийн шошго — монгол жижиг үсгээр) */
const GROUPS: Array<{ initials: string[]; mn: string; zh: string }> = [
  { initials: ["b", "p", "m", "f"], mn: "уруулын", zh: "唇音" },
  { initials: ["d", "t", "n", "l"], mn: "хэлний үзүүрийн", zh: "舌尖音" },
  { initials: ["g", "k", "h"], mn: "хэлний угийн", zh: "舌根音" },
  { initials: ["j", "q", "x"], mn: "хэлний нурууны", zh: "舌面音" },
  { initials: ["zh", "ch", "sh", "r"], mn: "хэл эргэсэн", zh: "翘舌音" },
  { initials: ["z", "c", "s"], mn: "хэлний үзүүр ба шүдний", zh: "平舌音" },
  { initials: ["∅"], mn: "эгшгээр эхлэх", zh: "零声母" },
];

export const TONE_DESC: Array<{ tone: number; mn: string; zh: string; glyph: string }> = [
  { tone: 1, mn: "1-р аялгуу — өндөр тэгш", zh: "第一声 — 高平", glyph: "ˉ" },
  { tone: 2, mn: "2-р аялгуу — өгсөх", zh: "第二声 — 上升", glyph: "ˊ" },
  { tone: 3, mn: "3-р аялгуу — буугаад өгсөх", zh: "第三声 — 先降后升", glyph: "ˇ" },
  { tone: 4, mn: "4-р аялгуу — буурах", zh: "第四声 — 下降", glyph: "ˋ" },
  { tone: 0, mn: "саармаг — богино хөнгөн", zh: "轻声 — 短而轻", glyph: "·" },
];

type Props = { chart: PinyinChart };

export function PinyinChartView({ chart }: Props) {
  const locale = useUiLocale();
  const [open, setOpen] = useState<string | null>(null);

  // (initial, final) → syllable key
  const index = useMemo(() => {
    const m = new Map<string, string>();
    for (const [key, cell] of Object.entries(chart.cells)) m.set(`${cell.initial}|${cell.final}`, key);
    return m;
  }, [chart]);

  const rows = GROUPS.flatMap((g) =>
    g.initials
      .filter((i) => chart.initials.includes(i))
      .map((initial, k) => ({ initial, group: k === 0 ? g : null, groupSize: g.initials.length }))
  );

  return (
    <div>
      <p className="mb-2 rounded-xl bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
        {tr(locale, "Хүний дуу")} · audio-cmn (CC BY-SA) · {tr(locale, "Нүдийг дараад 4 аялгуугаар сонс")}
      </p>
      <div
        className="app-card overflow-auto"
        style={{ maxHeight: "calc(100dvh - 190px)", WebkitOverflowScrolling: "touch" }}
      >
        <table className="border-separate border-spacing-0 text-center text-[13px]" translate="no">
          <thead>
            <tr>
              <th
                className="sticky left-0 top-0 z-30 bg-white px-2 py-2 text-left text-[10px] font-bold tracking-wide text-slate-400"
                style={{ minWidth: 64, fontVariant: "small-caps" }}
              >
                {locale === "zh" ? "声母 ╲ 韵母" : "гийгүүлэгч ╲ эгшиг"}
              </th>
              {chart.finals.map((f) => (
                <th
                  key={f}
                  className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 px-1 py-2 text-xs font-bold text-emerald-800"
                  style={{ minWidth: 46 }}
                >
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.initial}>
                <th
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-2 py-1 text-left align-middle"
                  style={{ minWidth: 64 }}
                >
                  {r.group ? (
                    <span
                      className="block text-[9px] font-semibold leading-3 tracking-wide text-slate-400"
                      style={{ fontVariant: "small-caps" }}
                    >
                      {locale === "zh" ? r.group.zh : r.group.mn}
                    </span>
                  ) : null}
                  <span className="text-sm font-extrabold text-emerald-700">{r.initial}</span>
                </th>
                {chart.finals.map((f) => {
                  const key = index.get(`${r.initial}|${f}`);
                  return (
                    <td key={f} className="border-b border-slate-100 p-0.5">
                      {key ? (
                        <button
                          type="button"
                          onClick={() => setOpen(key)}
                          className={`h-9 w-full rounded-lg text-[13px] font-semibold transition-colors active:bg-emerald-100 ${
                            open === key ? "bg-emerald-600 text-white" : "bg-emerald-50/60 text-slate-800"
                          }`}
                        >
                          {key}
                        </button>
                      ) : (
                        <span className="block h-9" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && chart.cells[open] ? (
        <SyllableSheet key={open} syllable={open} tones={chart.cells[open].tones} onClose={() => setOpen(null)} />
      ) : null}
    </div>
  );
}

/* ---- Доод самбар: үе + 4 (5) аялга ---- */

export function SyllableSheet({
  syllable,
  tones,
  onClose,
}: {
  syllable: string;
  tones: Record<string, string>;
  onClose: () => void;
}) {
  const locale = useUiLocale();
  const [active, setActive] = useState<number>(() => (tones["1"] ? 1 : Number(Object.keys(tones)[0] ?? 1)));
  const [playKey, setPlayKey] = useState(0);
  const [practice, setPractice] = useState(false);

  // Хаах/солиход дууг зогсооно (үе солигдоход `key`-ээр дахин үүснэ)
  useEffect(() => () => stopSyllable(), []);

  const play = (tone: number) => {
    const file = tones[String(tone === 0 ? 5 : tone)];
    if (!file) return;
    setActive(tone);
    setPlayKey((k) => k + 1);
    void playSyllable(file);
  };

  const available = [1, 2, 3, 4, 0].filter((t) => tones[String(t === 0 ? 5 : t)]);
  const desc = TONE_DESC.find((d) => d.tone === active);
  const activeFile = tones[String(active === 0 ? 5 : active)] ?? null;
  const marked = toneMark(syllable, active);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="close" onClick={onClose} className="absolute inset-0 bg-slate-900/40" />
      <div className="relative w-full max-w-[480px] rounded-t-[24px] bg-white px-4 pb-6 pt-3 shadow-2xl">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between">
          <p className="text-3xl font-extrabold text-emerald-700" translate="no">
            {marked}
          </p>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {tr(locale, "Хаах")}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2" translate="no">
          {available
            .filter((t) => t !== 0)
            .map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => play(t)}
                className={`rounded-2xl py-3 text-xl font-extrabold ring-1 transition-colors ${
                  active === t ? "bg-emerald-600 text-white ring-emerald-600" : "bg-emerald-50 text-emerald-800 ring-emerald-200"
                }`}
              >
                {toneMark(syllable, t)}
                <span className="block text-[10px] font-semibold opacity-80">{t}</span>
              </button>
            ))}
        </div>
        {available.includes(0) ? (
          <button
            type="button"
            onClick={() => play(0)}
            className={`mt-2 w-full rounded-2xl py-2 text-base font-bold ring-1 ${
              active === 0 ? "bg-slate-600 text-white ring-slate-600" : "bg-slate-50 text-slate-700 ring-slate-200"
            }`}
          >
            <span translate="no">({syllable})</span>{" "}
            <span className="text-xs font-semibold">{tr(locale, "саармаг")}</span>
          </button>
        ) : null}

        <div className="mt-3 flex items-center gap-3">
          <ToneContourSvg tone={active} playKey={playKey} width={84} height={44} />
          <p className="text-sm font-semibold text-slate-700">
            {desc ? `${locale === "zh" ? desc.zh : desc.mn} ${desc.glyph}` : null}
          </p>
        </div>

        {practice ? (
          <PronunciationPractice
            key={marked}
            text={marked}
            pinyin={marked}
            mode="pitch"
            audioUrl={activeFile}
            sectionLink={false}
            className="mt-3"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPractice(true)}
            className="mt-3 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
          >
            {tr(locale, "🎤 Дагаж хэлэх")}
          </button>
        )}
      </div>
    </div>
  );
}
