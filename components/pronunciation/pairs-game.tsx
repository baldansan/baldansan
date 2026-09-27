"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type { ResolvedCandidate, ResolvedGroup } from "@/lib/pronunciation/minimal-pairs";
import { playSequence, playSyllable, stopSyllable } from "@/lib/pronunciation/syllable-player";
import { useStoredJson, writeStoredJson } from "@/lib/pronunciation/use-stored-json";

const ROUNDS = 10;
const STORAGE_KEY = "buunduu-pairs-game-v1";

type Stats = Record<string, { ok: number; n: number }>;

const EMPTY_STATS: Stats = {};

type Round = { groupId: string; candidates: ResolvedCandidate[]; answer: number; picked: number | null };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeRound(groups: ResolvedGroup[], selected: Set<string>): Round | null {
  const pool = groups.filter((g) => selected.size === 0 || selected.has(g.id));
  if (pool.length === 0) return null;
  const g = pool[Math.floor(Math.random() * pool.length)];
  const item = g.items[Math.floor(Math.random() * g.items.length)];
  const candidates = shuffle(item.candidates);
  return { groupId: g.id, candidates, answer: Math.floor(Math.random() * candidates.length), picked: null };
}

type Props = { groups: ResolvedGroup[] };

export function PairsGame({ groups }: Props) {
  const locale = useUiLocale();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"intro" | "play" | "end">("intro");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [idx, setIdx] = useState(0);
  const stats = useStoredJson<Stats>(STORAGE_KEY, EMPTY_STATS);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => stopSyllable(), []);

  const current = rounds[idx];
  const score = rounds.filter((r) => r.picked === r.answer).length;

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const start = () => {
    const r = makeRound(groups, selected);
    if (!r) return;
    setRounds([r]);
    setIdx(0);
    setPhase("play");
    void playSyllable(r.candidates[r.answer].file);
  };

  const pickAnswer = (i: number) => {
    if (!current || current.picked != null) return;
    setRounds((rs) => rs.map((r, k) => (k === idx ? { ...r, picked: i } : r)));
    if (i !== current.answer) void playSyllable(current.candidates[current.answer].file);
  };

  const next = () => {
    if (!current) return;
    if (idx + 1 >= ROUNDS) {
      const s: Stats = { ...stats };
      for (const r of rounds) {
        const p = { ...(s[r.groupId] ?? { ok: 0, n: 0 }) };
        p.n += 1;
        if (r.picked === r.answer) p.ok += 1;
        s[r.groupId] = p;
      }
      writeStoredJson(STORAGE_KEY, s);
      stopSyllable();
      setPhase("end");
      return;
    }
    const r = makeRound(groups, selected);
    if (!r) return;
    setRounds((rs) => [...rs, r]);
    setIdx((i) => i + 1);
    void playSyllable(r.candidates[r.answer].file);
  };

  const playBoth = async () => {
    if (!current || busy) return;
    setBusy(true);
    try {
      await playSequence(
        current.candidates.map((c) => c.file),
        500
      );
    } finally {
      setBusy(false);
    }
  };

  const groupLabel = (g: ResolvedGroup) => (locale === "zh" ? g.zh : g.mn);

  const chips = (
    <div className="flex flex-wrap gap-1.5">
      {groups.map((g) => {
        const on = selected.size === 0 || selected.has(g.id);
        const st = stats[g.id];
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => toggle(g.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition-colors ${
              selected.has(g.id)
                ? "bg-emerald-600 text-white ring-emerald-600"
                : on
                  ? "bg-white text-slate-700 ring-slate-300"
                  : "bg-slate-50 text-slate-400 ring-slate-200"
            }`}
            title={groupLabel(g)}
          >
            <span translate="no">{g.label}</span>
            {st && st.n > 0 ? <span className="ml-1 opacity-70">{Math.round((100 * st.ok) / st.n)}%</span> : null}
          </button>
        );
      })}
    </div>
  );

  if (phase === "intro") {
    return (
      <div className="app-card p-4">
        <p className="text-sm leading-6 text-[var(--app-text)]">
          {tr(locale, "Нэг үе сонсоод хоёр (гурван) ойрхон дуунаас алийг нь сонссоноо сонго. Бүлэг сонгохгүй бол бүгдээс.")}
        </p>
        <div className="mt-3">{chips}</div>
        <button type="button" onClick={start} className="mt-4 w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white">
          {tr(locale, "▶ Эхлэх")}
        </button>
      </div>
    );
  }

  if (phase === "end") {
    const perGroup = new Map<string, { ok: number; n: number }>();
    for (const r of rounds) {
      const p = perGroup.get(r.groupId) ?? { ok: 0, n: 0 };
      p.n += 1;
      if (r.picked === r.answer) p.ok += 1;
      perGroup.set(r.groupId, p);
    }
    return (
      <div className="app-card p-4">
        <p className="text-2xl font-extrabold text-emerald-700">
          {score}/{ROUNDS}
        </p>
        <ul className="mt-3 space-y-1.5">
          {groups
            .filter((g) => perGroup.has(g.id))
            .map((g) => {
              const p = perGroup.get(g.id)!;
              const all = stats[g.id];
              return (
                <li key={g.id} className="flex items-center gap-2 text-sm">
                  <span className="w-16 text-sm font-extrabold text-emerald-700" translate="no">
                    {g.label}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full bg-emerald-500" style={{ width: `${Math.round((100 * p.ok) / p.n)}%` }} />
                  </span>
                  <span className="w-24 text-right text-xs font-bold text-slate-700">
                    {p.ok}/{p.n}
                    {all ? <span className="ml-1 font-semibold text-slate-400">({Math.round((100 * all.ok) / all.n)}%)</span> : null}
                  </span>
                </li>
              );
            })}
        </ul>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setPhase("intro")} className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white">
            {tr(locale, "🔁 Дахин тоглох")}
          </button>
          <Link href="/pronunciation" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
            {tr(locale, "Дуудлага")}
          </Link>
        </div>
      </div>
    );
  }

  if (!current) return null;
  const answered = current.picked != null;
  const group = groups.find((g) => g.id === current.groupId);

  return (
    <div className="app-card p-4">
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--app-muted)]">
        <span>
          {idx + 1}/{ROUNDS}
        </span>
        <span>
          {tr(locale, "Оноо")}: {score}
        </span>
      </div>
      {group ? (
        <p className="mt-1 text-center text-[11px] font-semibold text-slate-500">
          <span translate="no">{group.label}</span> · {groupLabel(group)}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void playSyllable(current.candidates[current.answer].file)}
        className="mx-auto mt-3 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-3xl ring-2 ring-emerald-200 active:bg-emerald-100"
        aria-label={tr(locale, "Дахин сонсох")}
      >
        🔊
      </button>

      <div className={`mt-4 grid gap-2 ${current.candidates.length === 3 ? "grid-cols-3" : "grid-cols-2"}`} translate="no">
        {current.candidates.map((c, i) => {
          let cls = "bg-white text-slate-800 ring-slate-200";
          if (answered) {
            if (i === current.answer) cls = "bg-emerald-600 text-white ring-emerald-600";
            else if (i === current.picked) cls = "bg-rose-500 text-white ring-rose-500";
            else cls = "bg-slate-50 text-slate-400 ring-slate-200";
          }
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => pickAnswer(i)}
              className={`rounded-2xl py-4 text-2xl font-extrabold ring-1 transition-colors ${cls}`}
            >
              {c.display}
            </button>
          );
        })}
      </div>

      {answered ? (
        <div className="mt-3 space-y-2">
          <p className={`text-center text-sm font-bold ${current.picked === current.answer ? "text-emerald-600" : "text-rose-600"}`}>
            {current.picked === current.answer
              ? tr(locale, "✓ Зөв!")
              : `✗ ${tr(locale, "Зөв нь")}: ${current.candidates[current.answer].display}`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void playBoth()}
              disabled={busy}
              className="flex-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-sky-700 ring-1 ring-sky-300 disabled:opacity-60"
            >
              {tr(locale, "🔊 Хоёуланг нь сонсох")}
            </button>
            <button type="button" onClick={next} className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white">
              {idx + 1 >= ROUNDS ? `${tr(locale, "Дүн")} →` : tr(locale, "Дараагийн →")}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-center text-xs font-semibold text-[var(--app-muted)]">{tr(locale, "Алийг нь сонслоо?")}</p>
      )}
    </div>
  );
}
