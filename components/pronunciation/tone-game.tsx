"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type { ToneGameItem } from "@/lib/pronunciation/data";
import { toneMark, TONE_GLYPH } from "@/lib/pronunciation/pinyin-mark";
import { playSyllable, stopSyllable } from "@/lib/pronunciation/syllable-player";
import { useStoredJson, writeStoredJson } from "@/lib/pronunciation/use-stored-json";
import { ToneContourSvg } from "./tone-contour-svg";

const ROUNDS = 10;
const STORAGE_KEY = "buunduu-tone-game-v1";

type Stats = { best: number; perTone: Record<string, { ok: number; n: number }>; games: number };

const EMPTY_STATS: Stats = { best: 0, perTone: {}, games: 0 };

type Round = { item: ToneGameItem; picked: number | null };

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Props = { items: ToneGameItem[] };

export function ToneGame({ items }: Props) {
  const locale = useUiLocale();
  const [phase, setPhase] = useState<"intro" | "play" | "end">("intro");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [idx, setIdx] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const stored = useStoredJson<Partial<Stats>>(STORAGE_KEY, EMPTY_STATS);
  const stats: Stats = { best: stored.best ?? 0, perTone: stored.perTone ?? {}, games: stored.games ?? 0 };
  const [playKey, setPlayKey] = useState(0);
  /** Алдсаны дараа 2 раунд энэ хоёр аялгаас илүү сонгоно */
  const focusRef = useRef<{ tones: number[]; left: number } | null>(null);

  const byTone = useMemo(() => {
    const m: Record<number, ToneGameItem[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const it of items) m[it.tone]?.push(it);
    return m;
  }, [items]);

  const draw = useCallback((): ToneGameItem => {
    const f = focusRef.current;
    if (f && f.left > 0 && Math.random() < 0.7) {
      f.left -= 1;
      const pool = byTone[pick(f.tones)];
      if (pool.length > 0) return pick(pool);
    }
    return pick(items);
  }, [items, byTone]);

  const current = rounds[idx];
  const score = rounds.filter((r) => r.picked === r.item.tone).length;

  const startGame = () => {
    stopSyllable();
    focusRef.current = null;
    const first = draw();
    setRounds([{ item: first, picked: null }]);
    setIdx(0);
    setStreak(0);
    setBestStreak(0);
    setPhase("play");
    setPlayKey((k) => k + 1);
    void playSyllable(first.file);
  };

  const answer = (tone: number) => {
    if (!current || current.picked != null) return;
    const ok = tone === current.item.tone;
    setRounds((rs) => rs.map((r, i) => (i === idx ? { ...r, picked: tone } : r)));
    if (ok) {
      const ns = streak + 1;
      setStreak(ns);
      setBestStreak((b) => Math.max(b, ns));
    } else {
      setStreak(0);
      focusRef.current = { tones: [tone, current.item.tone], left: 2 };
      // зөвийг дахин сонсгоно
      setPlayKey((k) => k + 1);
      void playSyllable(current.item.file);
    }
  };

  const next = () => {
    if (idx + 1 >= ROUNDS) {
      // дуусгах — статистик
      const s: Stats = { best: stats.best, games: stats.games + 1, perTone: { ...stats.perTone } };
      for (const r of rounds) {
        const key = String(r.item.tone);
        const pt = { ...(s.perTone[key] ?? { ok: 0, n: 0 }) };
        pt.n += 1;
        if (r.picked === r.item.tone) pt.ok += 1;
        s.perTone[key] = pt;
      }
      s.best = Math.max(s.best, score);
      writeStoredJson(STORAGE_KEY, s);
      stopSyllable();
      setPhase("end");
      return;
    }
    const it = draw();
    setRounds((rs) => [...rs, { item: it, picked: null }]);
    setIdx((i) => i + 1);
    setPlayKey((k) => k + 1);
    void playSyllable(it.file);
  };

  const replay = () => {
    if (!current) return;
    setPlayKey((k) => k + 1);
    void playSyllable(current.item.file);
  };

  const toneName = (t: number) =>
    locale === "zh" ? `第${["", "一", "二", "三", "四"][t]}声` : `${t}-р аялгуу`;

  /* ---- intro ---- */
  if (phase === "intro") {
    return (
      <div className="app-card p-4">
        <p className="text-sm leading-6 text-[var(--app-text)]">
          {tr(locale, "Үеийг сонсоод аль аялгуу болохыг таа. 10 раунд, зөв бүрд оноо, дараалан зөв бол цуврал.")}
        </p>
        {stats.games > 0 ? (
          <p className="mt-2 text-xs font-semibold text-[var(--app-muted)]">
            {tr(locale, "Дээд оноо")}: {stats.best}/{ROUNDS} · {tr(locale, "Тоглосон")}: {stats.games}
          </p>
        ) : null}
        <PerToneStats stats={stats} toneName={toneName} />
        <button
          type="button"
          onClick={startGame}
          disabled={items.length === 0}
          className="mt-4 w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {tr(locale, "▶ Эхлэх")}
        </button>
      </div>
    );
  }

  /* ---- end ---- */
  if (phase === "end") {
    const conf = new Map<string, number>();
    for (const r of rounds) {
      if (r.picked != null && r.picked !== r.item.tone) {
        const a = Math.min(r.picked, r.item.tone);
        const b = Math.max(r.picked, r.item.tone);
        const k = `${a}-${b}`;
        conf.set(k, (conf.get(k) ?? 0) + 1);
      }
    }
    const top = [...conf.entries()].sort((x, y) => y[1] - x[1])[0];
    const perToneNow: Record<number, { ok: number; n: number }> = { 1: { ok: 0, n: 0 }, 2: { ok: 0, n: 0 }, 3: { ok: 0, n: 0 }, 4: { ok: 0, n: 0 } };
    for (const r of rounds) {
      perToneNow[r.item.tone].n += 1;
      if (r.picked === r.item.tone) perToneNow[r.item.tone].ok += 1;
    }
    return (
      <div className="app-card p-4">
        <p className="text-2xl font-extrabold text-emerald-700">
          {score}/{ROUNDS}
        </p>
        <p className="text-xs font-semibold text-[var(--app-muted)]">
          {tr(locale, "Дараалан зөв")}: {bestStreak} · {tr(locale, "Дээд оноо")}: {stats.best}/{ROUNDS}
        </p>
        <ul className="mt-3 space-y-1.5">
          {[1, 2, 3, 4].map((t) => {
            const p = perToneNow[t];
            const pct = p.n ? Math.round((100 * p.ok) / p.n) : null;
            return (
              <li key={t} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-center text-2xl font-extrabold leading-6 text-emerald-700" translate="no">
                  {TONE_GLYPH[t]}
                </span>
                <span className="w-24 text-xs font-semibold text-slate-600">{toneName(t)}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full bg-emerald-500" style={{ width: `${pct ?? 0}%` }} />
                </span>
                <span className="w-14 text-right text-xs font-bold text-slate-700">{pct == null ? "—" : `${p.ok}/${p.n}`}</span>
              </li>
            );
          })}
        </ul>
        {top ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
            {locale === "zh"
              ? `第${["", "一", "二", "三", "四"][Number(top[0].split("-")[0])]}声和第${["", "一", "二", "三", "四"][Number(top[0].split("-")[1])]}声混淆 ×${top[1]}`
              : `${top[0].split("-")[0]} ба ${top[0].split("-")[1]}-р аялгууг андуурав ×${top[1]}`}
          </p>
        ) : (
          <p className="mt-3 text-xs font-semibold text-emerald-700">{tr(locale, "Алдаагүй! Маш сайн.")}</p>
        )}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={startGame} className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white">
            {tr(locale, "🔁 Дахин тоглох")}
          </button>
          <Link href="/pronunciation" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
            {tr(locale, "Дуудлага")}
          </Link>
        </div>
      </div>
    );
  }

  /* ---- play ---- */
  if (!current) return null;
  const answered = current.picked != null;
  const correct = current.picked === current.item.tone;

  return (
    <div className="app-card p-4">
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--app-muted)]">
        <span>
          {idx + 1}/{ROUNDS}
        </span>
        <span>
          {tr(locale, "Оноо")}: {score} · {tr(locale, "Дараалан зөв")}: {streak}
        </span>
      </div>

      <button
        type="button"
        onClick={replay}
        className="mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-4xl ring-2 ring-emerald-200 active:bg-emerald-100"
        aria-label={tr(locale, "Дахин сонсох")}
      >
        🔊
      </button>
      <p className="mt-3 text-center text-3xl font-extrabold text-slate-800" translate="no">
        {answered ? toneMark(current.item.syllable, current.item.tone) : current.item.syllable}
      </p>

      <div className="mt-4 grid grid-cols-4 gap-2" translate="no">
        {[1, 2, 3, 4].map((t) => {
          let cls = "bg-white text-slate-800 ring-slate-200";
          if (answered) {
            if (t === current.item.tone) cls = "bg-emerald-600 text-white ring-emerald-600";
            else if (t === current.picked) cls = "bg-rose-500 text-white ring-rose-500";
            else cls = "bg-slate-50 text-slate-400 ring-slate-200";
          }
          return (
            <button
              key={t}
              type="button"
              disabled={answered}
              onClick={() => answer(t)}
              className={`rounded-2xl py-3 ring-1 transition-colors ${cls}`}
            >
              <span className="block text-4xl font-extrabold leading-8">{TONE_GLYPH[t]}</span>
              <span className="block text-[11px] font-bold opacity-80">{t}</span>
            </button>
          );
        })}
      </div>

      {answered ? (
        <div className="mt-3 flex items-center gap-3">
          <ToneContourSvg tone={current.item.tone} playKey={playKey} width={72} height={40} />
          <p className={`text-sm font-bold ${correct ? "text-emerald-600" : "text-rose-600"}`}>
            {correct
              ? tr(locale, "✓ Зөв!")
              : `✗ ${tr(locale, "Зөв нь")}: ${toneName(current.item.tone)} ${TONE_GLYPH[current.item.tone]}`}
          </p>
          <button
            type="button"
            onClick={next}
            className="ml-auto whitespace-nowrap rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
          >
            {idx + 1 >= ROUNDS ? `${tr(locale, "Дүн")} →` : tr(locale, "Дараагийн →")}
          </button>
        </div>
      ) : (
        <p className="mt-3 text-center text-xs font-semibold text-[var(--app-muted)]">
          {tr(locale, "Аль аялгуу вэ?")}
        </p>
      )}
    </div>
  );
}

function PerToneStats({ stats, toneName }: { stats: Stats; toneName: (t: number) => string }) {
  const locale = useUiLocale();
  const has = Object.values(stats.perTone).some((p) => p.n > 0);
  if (!has) return null;
  return (
    <div className="mt-3 grid grid-cols-4 gap-2">
      {[1, 2, 3, 4].map((t) => {
        const p = stats.perTone[String(t)] ?? { ok: 0, n: 0 };
        const pct = p.n ? Math.round((100 * p.ok) / p.n) : null;
        return (
          <div key={t} className="rounded-xl bg-slate-50 px-2 py-2 text-center ring-1 ring-slate-100">
            <span className="block text-2xl font-extrabold leading-6 text-emerald-700" translate="no">
              {TONE_GLYPH[t]}
            </span>
            <span className="block text-[10px] font-semibold text-slate-500">{toneName(t)}</span>
            <span className="block text-xs font-bold text-slate-700">{pct == null ? "—" : `${pct}%`}</span>
          </div>
        );
      })}
      <p className="col-span-4 text-[10px] font-semibold text-slate-400">{tr(locale, "Аялгуу бүрийн зөв хувь (бүх тоглолт)")}</p>
    </div>
  );
}
