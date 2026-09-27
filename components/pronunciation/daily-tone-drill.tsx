"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type { ToneGameItem, TonePairWord, TonePairs } from "@/lib/pronunciation/data";
import {
  DAILY_A,
  DAILY_B,
  DAILY_C,
  DAILY_D,
  DAILY_TONE_STORAGE_KEY,
  DAILY_TOTAL,
  EMPTY_DAILY,
  WHOLE_SYLLABLES,
  dayKey,
  dayOfYear,
  daySeed,
  normalizeDaily,
  recordDaily,
  seededRandom,
  type DailyToneStore,
} from "@/lib/pronunciation/daily-tone";
import { toneMark, TONE_GLYPH } from "@/lib/pronunciation/pinyin-mark";
import { playSyllable, stopSyllable } from "@/lib/pronunciation/syllable-player";
import { useStoredJson, writeStoredJson } from "@/lib/pronunciation/use-stored-json";
import { playChineseWordAudio } from "@/lib/tts/play-chinese-word-audio";
import { PronunciationPractice } from "@/components/speech/pronunciation-practice";
import { ToneContourSvg, TonePairIcon } from "./tone-contour-svg";

/** syl → { "1".."4": mp3 } — 16 бүхэл үе */
export type WholeTones = Record<string, Record<string, string>>;

type Props = { items: ToneGameItem[]; pairs: TonePairs; whole: WholeTones };

const ADVANCE_MS = 1000;

type QA = { kind: "A"; item: ToneGameItem; picked: number | null };
type QB = { kind: "B"; word: TonePairWord; pattern: string; options: string[]; picked: string | null };
type QC = { kind: "C"; syl: string; tone: number; file: string; options: string[]; picked: string | null };
type QD = { kind: "D"; word: TonePairWord; result: boolean | null };
type Q = QA | QB | QC | QD;

function seededPick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function seededShuffle<T>(rnd: () => number, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Өдрийн хичээл — өдөр бүр ижил бүтэц, өөр агуулга (өдрийн seed-ээр тогтмол) */
function buildSession(items: ToneGameItem[], pairs: TonePairs, whole: WholeTones, salt: number): Q[] {
  const d = new Date();
  const rnd = seededRandom(daySeed(d, salt));
  const qs: Q[] = [];

  // A — 8 үе (давхардахгүй)
  const usedSyl = new Set<string>();
  const poolA = seededShuffle(rnd, items);
  for (const it of poolA) {
    if (qs.length >= DAILY_A) break;
    if (usedSyl.has(it.syllable)) continue;
    usedSyl.add(it.syllable);
    qs.push({ kind: "A", item: it, picked: null });
  }

  // B — 6 хэв (day-of-year % 20-оос эхэлнэ)
  const patterns = Object.keys(pairs)
    .filter((k) => (pairs[k]?.length ?? 0) > 0)
    .sort();
  const start = patterns.length > 0 ? dayOfYear(d) % patterns.length : 0;
  const chosen: string[] = [];
  for (let i = 0; i < Math.min(DAILY_B, patterns.length); i++) chosen.push(patterns[(start + i) % patterns.length]);
  for (const pat of chosen) {
    const word = seededPick(rnd, pairs[pat]);
    const others = seededShuffle(
      rnd,
      patterns.filter((p) => p !== pat)
    );
    // Нэг аялгуу нь ижил (төстэй) хэвүүдийг түрүүлж авна
    const similar = others.filter((p) => p[0] === pat[0] || p[1] === pat[1]);
    const rest = others.filter((p) => !(p[0] === pat[0] || p[1] === pat[1]));
    const distract = [...similar.slice(0, 2), ...rest].slice(0, 3);
    qs.push({ kind: "B", word, pattern: pat, options: seededShuffle(rnd, [pat, ...distract]), picked: null });
  }

  // C — 4 бүхэл үе
  const wholeKeys = WHOLE_SYLLABLES.filter((s) => whole[s] && Object.keys(whole[s]).length > 0);
  const cKeys = seededShuffle(rnd, wholeKeys).slice(0, DAILY_C);
  for (const syl of cKeys) {
    const tones = [1, 2, 3, 4].filter((t) => whole[syl][String(t)]);
    const tone = seededPick(rnd, tones);
    const others = seededShuffle(
      rnd,
      wholeKeys.filter((s) => s !== syl)
    ).slice(0, 2);
    qs.push({ kind: "C", syl, tone, file: whole[syl][String(tone)], options: seededShuffle(rnd, [syl, ...others]), picked: null });
  }

  // D — 2 үг (Б хэсгийн үгсээс өөр)
  const bWords = new Set(qs.filter((q): q is QB => q.kind === "B").map((q) => q.word.zh));
  const allWords = patterns.flatMap((p) => pairs[p]).filter((w) => !bWords.has(w.zh));
  const dWords = seededShuffle(rnd, allWords).slice(0, DAILY_D);
  for (const w of dWords) qs.push({ kind: "D", word: w, result: null });

  return qs;
}

function isCorrect(q: Q): boolean {
  if (q.kind === "A") return q.picked === q.item.tone;
  if (q.kind === "B") return q.picked === q.pattern;
  if (q.kind === "C") return q.picked === q.syl;
  return q.result === true;
}

const PART_TITLE: Record<Q["kind"], string> = { A: "Аялгуу таних", B: "Аялгуу хос", C: "Бүхэл үе", D: "Хэл" };
const PART_EMOJI: Record<Q["kind"], string> = { A: "🎧", B: "🎵", C: "🧩", D: "🎤" };

/* ========================================================================== */

export function DailyToneDrill({ items, pairs, whole }: Props) {
  const locale = useUiLocale();
  const stored = useStoredJson<Partial<DailyToneStore>>(DAILY_TONE_STORAGE_KEY, EMPTY_DAILY);
  const store = useMemo(() => normalizeDaily(stored), [stored]);
  const today = dayKey();
  const todayScore = store.history[today];

  const [phase, setPhase] = useState<"intro" | "play" | "end">("intro");
  const [qs, setQs] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [playKey, setPlayKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const timer = useRef<number | null>(null);
  const replayCount = useRef(0);

  useEffect(
    () => () => {
      stopSyllable();
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  const q = qs[idx];
  const score = qs.filter(isCorrect).length;

  const playQ = useCallback(async (cur: Q) => {
    setPlayKey((k) => k + 1);
    if (cur.kind === "A") {
      void playSyllable(cur.item.file);
      return;
    }
    if (cur.kind === "C") {
      void playSyllable(cur.file);
      return;
    }
    if (cur.kind === "B") {
      stopSyllable();
      setBusy(true);
      try {
        await playChineseWordAudio(cur.word.zh);
      } finally {
        setBusy(false);
      }
    }
  }, []);

  const start = () => {
    stopSyllable();
    const session = buildSession(items, pairs, whole, replayCount.current);
    replayCount.current += 1;
    setQs(session);
    setIdx(0);
    setPhase("play");
    if (session[0]) void playQ(session[0]);
    try {
      window.scrollTo({ top: 0 });
    } catch {
      // ignore
    }
  };

  const finish = (all: Q[]) => {
    stopSyllable();
    const s = all.filter(isCorrect).length;
    setFinalScore(s);
    writeStoredJson(DAILY_TONE_STORAGE_KEY, recordDaily(store, s, today));
    setPhase("end");
  };

  const advance = (all: Q[]) => {
    if (idx + 1 >= all.length) {
      finish(all);
      return;
    }
    setIdx(idx + 1);
    void playQ(all[idx + 1]);
  };

  const answer = (value: number | string) => {
    if (!q || q.kind === "D") return;
    if ((q.kind === "A" && q.picked != null) || (q.kind === "B" && q.picked != null) || (q.kind === "C" && q.picked != null)) return;
    const next = qs.map((x, i) => (i === idx ? ({ ...x, picked: value } as Q) : x));
    setQs(next);
    const ok = isCorrect(next[idx]);
    if (!ok) void playQ(q);
    timer.current = window.setTimeout(() => advance(next), ok ? ADVANCE_MS : ADVANCE_MS + 700);
  };

  const answerD = (ok: boolean) => {
    if (!q || q.kind !== "D") return;
    const next = qs.map((x, i) => (i === idx ? ({ ...x, result: ok } as Q) : x));
    setQs(next);
  };

  /* ---- intro ---- */
  if (phase === "intro") {
    return (
      <div className="app-card p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-extrabold text-orange-700 ring-1 ring-orange-200">
            🔥 {tr(locale, "Streak")} {store.streak} {tr(locale, "өдөр")}
          </span>
          {store.best > 0 ? (
            <span className="text-xs font-semibold text-[var(--app-muted)]">
              {tr(locale, "Дээд оноо")}: {store.best}/{DAILY_TOTAL}
            </span>
          ) : null}
        </div>
        {todayScore != null ? (
          <div className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-center ring-1 ring-emerald-200">
            <p className="text-xs font-bold text-emerald-700">✅ {tr(locale, "Өнөөдөр дууссан")}</p>
            <p className="text-3xl font-extrabold text-emerald-700">
              {todayScore}/{DAILY_TOTAL}
            </p>
          </div>
        ) : null}
        <ul className="mt-3 space-y-1.5 text-sm font-semibold text-slate-700">
          <li>🎧 {tr(locale, "Аялгуу таних")} · {DAILY_A}</li>
          <li>🎵 {tr(locale, "Аялгуу хос")} · {DAILY_B}</li>
          <li>🧩 {tr(locale, "Бүхэл үе")} · {DAILY_C}</li>
          <li>🎤 {tr(locale, "Хэл")} · {DAILY_D}</li>
        </ul>
        <button type="button" onClick={start} disabled={items.length === 0} className="mt-4 w-full rounded-2xl bg-emerald-600 py-4 text-xl font-extrabold text-white disabled:opacity-50">
          {todayScore != null ? tr(locale, "🔁 Дахин тоглох") : `▶ ${tr(locale, "Эхлэх")} · 3 ${tr(locale, "минут")}`}
        </button>
        <WeekStrip store={store} today={today} />
      </div>
    );
  }

  /* ---- end ---- */
  if (phase === "end") {
    const aQs = qs.filter((x): x is QA => x.kind === "A");
    const perTone: Record<number, { ok: number; n: number }> = { 1: { ok: 0, n: 0 }, 2: { ok: 0, n: 0 }, 3: { ok: 0, n: 0 }, 4: { ok: 0, n: 0 } };
    for (const a of aQs) {
      perTone[a.item.tone].n += 1;
      if (a.picked === a.item.tone) perTone[a.item.tone].ok += 1;
    }
    const parts = (["A", "B", "C", "D"] as const).map((k) => {
      const list = qs.filter((x) => x.kind === k);
      return { k, ok: list.filter(isCorrect).length, n: list.length };
    });
    const toneName = (t: number) => (locale === "zh" ? `第${["", "一", "二", "三", "四"][t]}声` : `${t}-р аялгуу`);
    return (
      <div className="app-card p-4 text-center">
        <p className="text-5xl">{finalScore >= 16 ? "🎉" : finalScore >= 10 ? "👍" : "💪"}</p>
        <p className="mt-2 text-5xl font-extrabold text-emerald-700">
          {finalScore}/{DAILY_TOTAL}
        </p>
        <p className="mt-2 inline-block rounded-full bg-orange-50 px-4 py-1.5 text-base font-extrabold text-orange-700 ring-1 ring-orange-200">
          🔥 {tr(locale, "Streak")} {store.streak} {tr(locale, "өдөр")}
        </p>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {parts.map((p) => (
            <div key={p.k} className="rounded-xl bg-slate-50 px-1 py-2 ring-1 ring-slate-100">
              <span className="block text-lg leading-6">{PART_EMOJI[p.k]}</span>
              <span className="block text-sm font-extrabold text-slate-800">
                {p.ok}/{p.n}
              </span>
            </div>
          ))}
        </div>
        <ul className="mt-3 space-y-1.5 text-left">
          {[1, 2, 3, 4].map((t) => {
            const p = perTone[t];
            const pct = p.n ? Math.round((100 * p.ok) / p.n) : null;
            return (
              <li key={t} className="flex items-center gap-2 text-sm">
                <span className="w-7 text-center text-2xl font-extrabold leading-6 text-emerald-700" translate="no">
                  {TONE_GLYPH[t]}
                </span>
                <span className="w-20 text-xs font-semibold text-slate-600">{toneName(t)}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full bg-emerald-500" style={{ width: `${pct ?? 0}%` }} />
                </span>
                <span className="w-10 text-right text-xs font-bold text-slate-700">{pct == null ? "—" : `${p.ok}/${p.n}`}</span>
              </li>
            );
          })}
        </ul>
        <WeekStrip store={store} today={today} />
        <div className="mt-4 flex flex-col gap-2">
          <Link href="/pronunciation" className="rounded-2xl bg-emerald-600 py-4 text-xl font-extrabold text-white">
            🌙 {tr(locale, "Маргааш дахин")}
          </Link>
          <button type="button" onClick={start} className="rounded-2xl bg-white py-3 text-base font-bold text-emerald-700 ring-1 ring-emerald-300">
            {tr(locale, "🔁 Дахин тоглох")}
          </button>
        </div>
      </div>
    );
  }

  /* ---- play ---- */
  if (!q) return null;
  const partIdx = qs.slice(0, idx).filter((x) => x.kind === q.kind).length;
  const partN = qs.filter((x) => x.kind === q.kind).length;

  return (
    <div className="app-card p-4">
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--app-muted)]">
        <span>
          {PART_EMOJI[q.kind]} {tr(locale, PART_TITLE[q.kind])} {partIdx + 1}/{partN}
        </span>
        <span>
          {idx + 1}/{qs.length} · {tr(locale, "Оноо")}: {score}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <span className="block h-full bg-emerald-500 transition-all" style={{ width: `${Math.round((100 * idx) / qs.length)}%` }} />
      </div>

      {q.kind === "A" ? <PartA q={q} playKey={playKey} onReplay={() => void playQ(q)} onAnswer={answer} /> : null}
      {q.kind === "B" ? <PartB q={q} busy={busy} onReplay={() => void playQ(q)} onAnswer={answer} /> : null}
      {q.kind === "C" ? <PartC q={q} onReplay={() => void playQ(q)} onAnswer={answer} /> : null}
      {q.kind === "D" ? <PartD q={q} onResult={answerD} onNext={() => advance(qs)} onSkip={() => advance(qs)} /> : null}
    </div>
  );
}

/* ======================= A. Аялгуу таних ================================= */

function PartA({ q, playKey, onReplay, onAnswer }: { q: QA; playKey: number; onReplay: () => void; onAnswer: (t: number) => void }) {
  const locale = useUiLocale();
  const answered = q.picked != null;
  const correct = q.picked === q.item.tone;
  return (
    <>
      <button type="button" onClick={onReplay} className="mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-4xl ring-2 ring-emerald-200 active:bg-emerald-100" aria-label={tr(locale, "Дахин сонсох")}>
        🔊
      </button>
      <p className="mt-3 text-center text-3xl font-extrabold text-slate-800" translate="no">
        {answered ? toneMark(q.item.syllable, q.item.tone) : q.item.syllable}
      </p>
      <div className="mt-4 grid grid-cols-4 gap-2" translate="no">
        {[1, 2, 3, 4].map((t) => {
          let cls = "bg-white text-slate-800 ring-slate-200";
          if (answered) {
            if (t === q.item.tone) cls = "bg-emerald-600 text-white ring-emerald-600";
            else if (t === q.picked) cls = "bg-rose-500 text-white ring-rose-500";
            else cls = "bg-slate-50 text-slate-400 ring-slate-200";
          }
          return (
            <button key={t} type="button" disabled={answered} onClick={() => onAnswer(t)} className={`rounded-2xl py-3 ring-1 transition-colors ${cls}`}>
              <span className="block text-4xl font-extrabold leading-8">{TONE_GLYPH[t]}</span>
              <span className="block text-[11px] font-bold opacity-80">{t}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex h-10 items-center justify-center gap-3">
        {answered ? (
          <>
            <ToneContourSvg tone={q.item.tone} playKey={playKey} width={72} height={40} />
            <p className={`text-sm font-bold ${correct ? "text-emerald-600" : "text-rose-600"}`}>{correct ? tr(locale, "✓ Зөв!") : `✗ ${tr(locale, "Зөв нь")}: ${TONE_GLYPH[q.item.tone]} ${q.item.tone}`}</p>
          </>
        ) : (
          <p className="text-xs font-semibold text-[var(--app-muted)]">{tr(locale, "Аль аялгуу вэ?")}</p>
        )}
      </div>
    </>
  );
}

/* ======================= B. Аялгуу хос =================================== */

function PartB({ q, busy, onReplay, onAnswer }: { q: QB; busy: boolean; onReplay: () => void; onAnswer: (p: string) => void }) {
  const locale = useUiLocale();
  const answered = q.picked != null;
  const correct = q.picked === q.pattern;
  return (
    <>
      <button
        type="button"
        onClick={onReplay}
        className={`mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-full text-4xl ring-2 ${busy ? "bg-sky-50 ring-sky-300" : "bg-emerald-50 ring-emerald-200 active:bg-emerald-100"}`}
        aria-label={tr(locale, "Дахин сонсох")}
      >
        🔊
      </button>
      <p className="mt-3 text-center text-4xl font-extrabold text-slate-800" translate="no">
        {q.word.zh}
      </p>
      <p className="mt-1 h-6 text-center text-base font-bold text-emerald-700" translate="no">
        {answered ? q.word.pinyin : ""}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2" translate="no">
        {q.options.map((p) => {
          let cls = "bg-white text-slate-700 ring-slate-200";
          let inverted = false;
          if (answered) {
            if (p === q.pattern) {
              cls = "bg-emerald-600 text-white ring-emerald-600";
              inverted = true;
            } else if (p === q.picked) {
              cls = "bg-rose-500 text-white ring-rose-500";
              inverted = true;
            } else cls = "bg-slate-50 text-slate-400 ring-slate-200";
          }
          return (
            <button key={p} type="button" disabled={answered} onClick={() => onAnswer(p)} className={`flex flex-col items-center rounded-2xl py-2 ring-1 transition-colors ${cls}`} aria-label={p}>
              <TonePairIcon t1={Number(p[0])} t2={Number(p[1])} width={48} height={24} inverted={inverted} />
              <span className="text-xs font-extrabold">
                {p[0]}-{p[1]}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex h-8 items-center justify-center">
        {answered ? (
          <p className={`text-sm font-bold ${correct ? "text-emerald-600" : "text-rose-600"}`}>
            {correct ? tr(locale, "✓ Зөв!") : `✗ ${tr(locale, "Зөв нь")}: ${q.pattern[0]}-${q.pattern[1]}`}
            {locale !== "zh" ? <span className="ml-2 font-semibold text-slate-500">{q.word.mn}</span> : null}
          </p>
        ) : (
          <p className="text-xs font-semibold text-[var(--app-muted)]">{tr(locale, "Аялгуугийн хэв аль нь вэ?")}</p>
        )}
      </div>
    </>
  );
}

/* ======================= C. Бүхэл үе ===================================== */

function PartC({ q, onReplay, onAnswer }: { q: QC; onReplay: () => void; onAnswer: (s: string) => void }) {
  const locale = useUiLocale();
  const answered = q.picked != null;
  const correct = q.picked === q.syl;
  return (
    <>
      <button type="button" onClick={onReplay} className="mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-4xl ring-2 ring-emerald-200 active:bg-emerald-100" aria-label={tr(locale, "Дахин сонсох")}>
        🔊
      </button>
      <div className="mt-4 grid grid-cols-3 gap-2" translate="no">
        {q.options.map((s) => {
          let cls = "bg-white text-slate-800 ring-slate-200 active:bg-emerald-50";
          if (answered) {
            if (s === q.syl) cls = "bg-emerald-600 text-white ring-emerald-600";
            else if (s === q.picked) cls = "bg-rose-500 text-white ring-rose-500";
            else cls = "bg-slate-50 text-slate-400 ring-slate-200";
          }
          return (
            <button key={s} type="button" disabled={answered} onClick={() => onAnswer(s)} className={`rounded-2xl py-5 text-2xl font-extrabold ring-2 transition-colors ${cls}`}>
              {toneMark(s, q.tone)}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex h-8 items-center justify-center">
        {answered ? (
          <p className={`text-sm font-bold ${correct ? "text-emerald-600" : "text-rose-600"}`}>{correct ? tr(locale, "✓ Зөв!") : `✗ ${tr(locale, "Зөв нь")}: ${toneMark(q.syl, q.tone)}`}</p>
        ) : (
          <p className="text-xs font-semibold text-[var(--app-muted)]">{tr(locale, "Алийг нь сонсов?")}</p>
        )}
      </div>
    </>
  );
}

/* ======================= D. Хэл ========================================== */

function PartD({ q, onResult, onNext, onSkip }: { q: QD; onResult: (ok: boolean) => void; onNext: () => void; onSkip: () => void }) {
  const locale = useUiLocale();
  return (
    <>
      <p className="mt-3 text-center text-4xl font-extrabold text-slate-800" translate="no">
        {q.word.zh}
      </p>
      <p className="mt-1 text-center text-base font-bold text-emerald-700" translate="no">
        {q.word.pinyin}
      </p>
      {locale !== "zh" ? <p className="text-center text-xs text-slate-500">{q.word.mn}</p> : null}
      <PronunciationPractice
        key={q.word.zh}
        text={q.word.zh}
        pinyin={q.word.pinyin}
        sectionLink={false}
        className="mt-3"
        onDone={({ verdict, result }) => {
          const ok = verdict === "perfect" || verdict === "close" || (!!result && !result.empty && result.total > 0 && result.correct * 2 >= result.total);
          onResult(ok);
        }}
      />
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onSkip} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600">
          {tr(locale, "Алгасах")}
        </button>
        <button type="button" onClick={onNext} disabled={q.result == null} className="flex-1 rounded-2xl bg-emerald-600 py-3 text-base font-extrabold text-white disabled:opacity-40">
          {q.result == null ? tr(locale, "Хэлээд дараагийн руу") : `${q.result ? "✓" : "✗"} ${tr(locale, "Дараагийн →")}`}
        </button>
      </div>
    </>
  );
}

/* ======================= 7 хоногийн зураас ============================== */

function WeekStrip({ store, today }: { store: DailyToneStore; today: string }) {
  const days: Array<{ key: string; label: string }> = [];
  const [y, m, d] = today.split("-").map(Number);
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(y, m - 1, d - i);
    days.push({ key: dayKey(dt), label: ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"][dt.getDay()] });
  }
  return (
    <div className="mt-3 grid grid-cols-7 gap-1">
      {days.map((x) => {
        const s = store.history[x.key];
        const on = s != null;
        return (
          <div key={x.key} className="text-center">
            <span className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm ${on ? "bg-orange-100 ring-1 ring-orange-300" : "bg-slate-50 ring-1 ring-slate-100"}`}>
              {on ? "🔥" : ""}
            </span>
            <span className="block text-[10px] font-semibold text-slate-400">{x.label}</span>
          </div>
        );
      })}
    </div>
  );
}
