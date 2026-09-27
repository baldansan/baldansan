"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import {
  PASS_SCORE,
  PINYIN_COURSE_STORAGE_KEY,
  TEST_QUESTIONS,
  type CourseProgress,
  type CourseUnit,
  type ErrorPair,
  type ErrorSection,
  type ErrorWord,
  type UnitProgress,
} from "@/lib/pronunciation/pinyin-course";
import { toneMark, TONE_GLYPH } from "@/lib/pronunciation/pinyin-mark";
import { playSequence, playSyllable, stopSyllable } from "@/lib/pronunciation/syllable-player";
import { useStoredJson, writeStoredJson } from "@/lib/pronunciation/use-stored-json";
import { playChineseWordAudio } from "@/lib/tts/play-chinese-word-audio";
import { PronunciationPractice } from "@/components/speech/pronunciation-practice";
import { MouthShape } from "./mouth-shape";
import { ToneContourSvg } from "./tone-contour-svg";
import type { UnitTones } from "./pinyin-unit";

type Props = {
  unit: CourseUnit;
  tones: UnitTones;
};

const EMPTY_PROGRESS: CourseProgress = {};
const ADVANCE_MS = 1100;
/** A ↔ B хооронд завсар */
const PAIR_GAP_MS = 400;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type FileFor = (syl: string, tone: number) => string | null;

/** Хосын аудио байгаа эсэх — байхгүй аялгуутай бол байгаа нийтлэг аялгуу руу шилжүүлнэ */
type ResolvedPair = { a: string; b: string; ta: number; tb: number; right?: "a" | "b" };

function resolvePair(p: ErrorPair, tones: UnitTones): ResolvedPair | null {
  const ta = p.tone;
  const tb = p.toneB ?? p.tone;
  if (tones[p.a]?.[String(ta)] && tones[p.b]?.[String(tb)]) return { a: p.a, b: p.b, ta, tb, right: p.right };
  if (p.toneB != null) return null;
  const common = [1, 2, 3, 4].filter((t) => tones[p.a]?.[String(t)] && tones[p.b]?.[String(t)]);
  if (common.length === 0) return null;
  return { a: p.a, b: p.b, ta: common[0], tb: common[0], right: p.right };
}

/* ========================================================================== */

export function PinyinErrorsUnit({ unit, tones }: Props) {
  const locale = useUiLocale();
  const sections = useMemo(() => unit.sections ?? [], [unit.sections]);
  const [secIdx, setSecIdx] = useState(0);
  const progressAll = useStoredJson<CourseProgress>(PINYIN_COURSE_STORAGE_KEY, EMPTY_PROGRESS);
  const progress: UnitProgress = progressAll[unit.id] ?? { listened: [], done: false };
  const scores = progress.sections ?? {};
  const section = sections[secIdx];

  useEffect(() => () => stopSyllable(), []);

  const fileFor = useCallback<FileFor>((syl, tone) => tones[syl]?.[String(tone)] ?? null, [tones]);

  const saveScore = useCallback(
    (sectionId: string, score: number) => {
      let all: CourseProgress = {};
      try {
        all = JSON.parse(localStorage.getItem(PINYIN_COURSE_STORAGE_KEY) ?? "{}") as CourseProgress;
      } catch {
        all = {};
      }
      const cur = all[unit.id] ?? { listened: [], done: false };
      const secs = { ...(cur.sections ?? {}) };
      secs[sectionId] = Math.max(secs[sectionId] ?? 0, score);
      const done = sections.every((s) => (secs[s.id] ?? 0) >= PASS_SCORE);
      const listened = cur.listened.includes(sectionId) ? cur.listened : [...cur.listened, sectionId];
      writeStoredJson(PINYIN_COURSE_STORAGE_KEY, { ...all, [unit.id]: { ...cur, sections: secs, done, listened } });
    },
    [unit.id, sections]
  );

  const goSection = (i: number) => {
    stopSyllable();
    setSecIdx(i);
    try {
      window.scrollTo({ top: 0 });
    } catch {
      // ignore
    }
  };

  if (!section) return null;
  const doneCount = sections.filter((s) => (scores[s.id] ?? 0) >= PASS_SCORE).length;

  return (
    <div>
      {/* Хэсэг сонгох чипүүд */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {sections.map((s, i) => {
          const sc = scores[s.id];
          const passed = (sc ?? 0) >= PASS_SCORE;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goSection(i)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-extrabold ring-1 transition-colors ${
                i === secIdx ? "bg-emerald-600 text-white ring-emerald-600" : passed ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-white text-slate-600 ring-slate-200"
              }`}
            >
              <span translate="no">
                {passed ? "⭐ " : `${i + 1}. `}
                {locale === "zh" ? s.titleZh : s.title}
              </span>
              {sc != null ? <span className="ml-1 opacity-70">{sc}/8</span> : null}
            </button>
          );
        })}
      </div>

      <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900 ring-1 ring-amber-100" translate="no">
        {locale === "zh" && unit.introZh ? unit.introZh : unit.intro}
      </p>
      <p className="mt-2 text-xs font-semibold text-[var(--app-muted)]">
        {doneCount}/{sections.length} {tr(locale, "хэсэг дууссан")} · {tr(locale, "Хэсэг бүрд 6/8-аас дээш авбал нэгж дууссан.")}
      </p>

      <SectionView key={section.id} section={section} tones={tones} fileFor={fileFor} best={scores[section.id]} onScore={(s) => saveScore(section.id, s)} />

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => goSection(secIdx - 1)}
          disabled={secIdx === 0}
          className="rounded-2xl bg-slate-100 px-4 py-3 text-base font-bold text-slate-700 disabled:opacity-40"
        >
          ←
        </button>
        {secIdx + 1 < sections.length ? (
          <button type="button" onClick={() => goSection(secIdx + 1)} className="min-w-0 flex-1 rounded-2xl bg-emerald-600 px-3 py-3 text-lg font-extrabold text-white active:bg-emerald-700">
            {tr(locale, "Дараах")} →
            <span className="block truncate text-xs font-bold opacity-80" translate="no">
              {secIdx + 2}. {locale === "zh" ? sections[secIdx + 1].titleZh : sections[secIdx + 1].title}
            </span>
          </button>
        ) : (
          <Link href="/pronunciation/basics" className="flex flex-1 items-center justify-center rounded-2xl bg-emerald-600 py-3 text-lg font-extrabold text-white active:bg-emerald-700">
            {progress.done ? `🏆 ${tr(locale, "Бүх нэгж дууссан!")}` : `← ${tr(locale, "Хичээлүүд")}`}
          </Link>
        )}
      </div>

      <Link href="/pronunciation/basics" className="mt-4 block text-center text-sm font-bold text-emerald-700">
        ← {tr(locale, "Хичээлүүд")}
      </Link>
    </div>
  );
}

/* ======================= Нэг хэсэг ======================================= */

function SectionView({
  section,
  tones,
  fileFor,
  best,
  onScore,
}: {
  section: ErrorSection;
  tones: UnitTones;
  fileFor: FileFor;
  best?: number;
  onScore: (score: number) => void;
}) {
  const locale = useUiLocale();
  const pairs = useMemo(() => section.pairs.map((p) => resolvePair(p, tones)).filter((p): p is ResolvedPair => !!p), [section.pairs, tones]);
  const [practice, setPractice] = useState<ErrorWord | null>(null);
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const playWord = async (w: ErrorWord) => {
    if (playingWord) return;
    stopSyllable();
    setPlayingWord(w.zh);
    try {
      await playChineseWordAudio(w.zh);
    } finally {
      setPlayingWord(null);
    }
  };

  return (
    <div className="mt-3 space-y-3">
      <p className="text-center text-2xl font-extrabold text-emerald-700" translate="no">
        {section.title}
        {locale !== "zh" ? <span className="block text-xs font-semibold text-slate-400">{section.titleZh}</span> : null}
      </p>

      {/* Яагаад */}
      <div className="rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
        <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700">🤔 {tr(locale, "Яагаад")}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-amber-950" translate="no">
          {section.why}
        </p>
      </div>

      {/* Яаж засах */}
      <div className="rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
        <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">🛠️ {tr(locale, "Яаж засах")}</p>
        <div className="mt-1 flex items-start gap-3">
          {section.mouth ? <MouthShape shape={section.mouth} size={72} className="shrink-0" /> : null}
          <p className="text-sm font-semibold leading-6 text-emerald-950" translate="no">
            {section.fix}
          </p>
        </div>
      </div>

      {/* Зөв ↔ Монголчилсон */}
      <div className="app-card p-3">
        <p className="text-xs font-extrabold text-slate-700">
          👂 {section.pairs.some((p) => p.right) ? tr(locale, "Зөв ↔ Монголчилсон") : tr(locale, "Ялгааг сонс")}
          <span className="ml-1 font-semibold text-slate-400">{tr(locale, "дараад А, дараа нь Б")}</span>
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {pairs.map((p) => (
            <PairStrip key={`${p.a}${p.ta}-${p.b}${p.tb}`} p={p} fileFor={fileFor} />
          ))}
        </div>
        {pairs.length === 0 ? <p className="text-xs text-[var(--app-muted)]">{tr(locale, "Энэ нэгжид хос алга.")}</p> : null}
      </div>

      {/* Үгс */}
      <div className="app-card p-3">
        <p className="text-xs font-extrabold text-slate-700">🔊 {tr(locale, "Үгс")} <span className="font-semibold text-slate-400">{tr(locale, "дараад сонс, дахин дарвал дагаж хэлнэ")}</span></p>
        <div className="mt-2 flex flex-wrap gap-2" translate="no">
          {section.words.map((w) => {
            const on = practice?.zh === w.zh;
            return (
              <button
                key={w.zh}
                type="button"
                onClick={() => {
                  if (on) return;
                  void playWord(w);
                  setPractice(w);
                }}
                className={`rounded-2xl px-3 py-2 text-left ring-1 transition-colors ${
                  on ? "bg-emerald-600 text-white ring-emerald-600" : playingWord === w.zh ? "bg-sky-50 ring-sky-300" : "bg-emerald-50 ring-emerald-200 active:bg-emerald-100"
                }`}
              >
                <span className={`block text-xl font-bold ${on ? "text-white" : "text-slate-800"}`}>{w.zh}</span>
                <span className={`block text-sm font-extrabold ${on ? "text-emerald-50" : "text-emerald-700"}`}>{w.pinyin}</span>
                {locale !== "zh" ? <span className={`block text-[11px] ${on ? "text-emerald-100" : "text-slate-500"}`}>{w.mn}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Дасгал */}
      <Drill key={section.id} section={section} pairs={pairs} tones={tones} fileFor={fileFor} best={best} onScore={onScore} />

      {/* Дагаж хэлэх */}
      <div className="app-card p-3">
        <p className="text-xs font-extrabold text-slate-700">{tr(locale, "🎤 Дагаж хэлэх")}</p>
        {practice ? (
          <PronunciationPractice key={practice.zh} text={practice.zh} pinyin={practice.pinyin} sectionLink={false} className="mt-2" />
        ) : (
          <button
            type="button"
            onClick={() => setPractice(section.words[0] ?? null)}
            className="mt-2 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-base font-bold text-emerald-700"
          >
            🎤 {section.words[0]?.zh} {section.words[0]?.pinyin}
          </button>
        )}
      </div>
    </div>
  );
}

/** Нэг хос: А → (400 мс) → Б */
function PairStrip({ p, fileFor }: { p: ResolvedPair; fileFor: FileFor }) {
  const locale = useUiLocale();
  const right = p.right;
  const [busy, setBusy] = useState<"a" | "b" | "both" | null>(null);
  const fa = fileFor(p.a, p.ta);
  const fb = fileFor(p.b, p.tb);

  const playBoth = async () => {
    if (busy || !fa || !fb) return;
    setBusy("both");
    try {
      await playSequence([fa, fb], PAIR_GAP_MS);
    } finally {
      setBusy(null);
    }
  };
  const playOne = async (which: "a" | "b") => {
    const f = which === "a" ? fa : fb;
    if (!f) return;
    setBusy(which);
    try {
      await playSyllable(f);
    } finally {
      setBusy(null);
    }
  };

  const label = (which: "a" | "b") => {
    if (!right) return which === "a" ? "A" : "Б";
    return which === right ? `✓ ${tr(locale, "Зөв")}` : `✗ ${tr(locale, "Монголчлоод хэлдэг")}`;
  };
  const cls = (which: "a" | "b") => {
    const on = busy === which || busy === "both";
    if (!right) return on ? "bg-emerald-600 text-white" : "bg-white text-slate-800";
    if (which === right) return on ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800";
    return on ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-800";
  };

  return (
    <div className="rounded-2xl bg-slate-50 p-1.5 ring-1 ring-slate-200">
      <div className="grid grid-cols-2 gap-1" translate="no">
        {(["a", "b"] as const).map((which) => (
          <button key={which} type="button" onClick={() => void playOne(which)} className={`rounded-xl px-1 py-2 text-center transition-colors ${cls(which)}`}>
            <span className="block text-xl font-extrabold leading-6">{toneMark(which === "a" ? p.a : p.b, which === "a" ? p.ta : p.tb)}</span>
            <span className="block text-[9px] font-bold leading-3 opacity-80">{label(which)}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => void playBoth()}
        disabled={busy != null}
        className="mt-1 w-full rounded-xl bg-white py-1 text-[11px] font-bold text-sky-700 ring-1 ring-sky-200 disabled:opacity-60"
      >
        🔊 A → Б
      </button>
    </div>
  );
}

/* ======================= 🎯 Дасгал (8 раунд) ============================ */

type Round = { a: string; b: string; ta: number; tb: number; answer: 0 | 1; picked: number | null };

function makeRound(section: ErrorSection, pairs: ResolvedPair[], tones: UnitTones): Round | null {
  if (pairs.length === 0) return null;
  const p = pick(pairs);
  if (section.drill === "tone") {
    return { a: p.a, b: p.b, ta: p.ta, tb: p.tb, answer: Math.random() < 0.5 ? 0 : 1, picked: null };
  }
  // pick: ижил санамсаргүй аялгуугаар (хоёуланд нь байгаа)
  const common = [1, 2, 3, 4].filter((t) => tones[p.a]?.[String(t)] && tones[p.b]?.[String(t)]);
  const t = common.length > 0 ? pick(common) : p.ta;
  return { a: p.a, b: p.b, ta: t, tb: t, answer: Math.random() < 0.5 ? 0 : 1, picked: null };
}

function Drill({
  section,
  pairs,
  tones,
  fileFor,
  best,
  onScore,
}: {
  section: ErrorSection;
  pairs: ResolvedPair[];
  tones: UnitTones;
  fileFor: FileFor;
  best?: number;
  onScore: (score: number) => void;
}) {
  const locale = useUiLocale();
  const [phase, setPhase] = useState<"intro" | "play" | "end">("intro");
  const [round, setRound] = useState<Round | null>(null);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [playKey, setPlayKey] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const playRound = useCallback(
    (r: Round) => {
      const f = r.answer === 0 ? fileFor(r.a, r.ta) : fileFor(r.b, r.tb);
      setPlayKey((k) => k + 1);
      if (f) void playSyllable(f);
    },
    [fileFor]
  );

  const start = () => {
    stopSyllable();
    const r = makeRound(section, pairs, tones);
    setRound(r);
    setN(0);
    setScore(0);
    setPhase("play");
    if (r) playRound(r);
  };

  const choose = (i: 0 | 1) => {
    if (!round || round.picked != null) return;
    const ok = i === round.answer;
    const s = score + (ok ? 1 : 0);
    setScore(s);
    setRound({ ...round, picked: i });
    if (!ok) playRound(round);
    timer.current = window.setTimeout(() => {
      if (n + 1 >= TEST_QUESTIONS) {
        stopSyllable();
        onScore(s);
        setPhase("end");
        return;
      }
      const r = makeRound(section, pairs, tones);
      setRound(r);
      setN(n + 1);
      if (r) playRound(r);
    }, ok ? ADVANCE_MS : ADVANCE_MS + 600);
  };

  if (phase === "intro") {
    return (
      <div className="app-card p-4 text-center">
        <p className="text-xs font-extrabold text-slate-700">🎯 {tr(locale, "Дасгал")}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
          {section.drill === "tone" ? tr(locale, "8 раунд: сонсоод 2-р эсвэл 3-р аялгуу алийг нь вэ?") : tr(locale, "8 раунд: сонсоод алийг нь хэлснийг сонго.")}
        </p>
        {best != null ? (
          <p className="mt-1 text-xs font-bold text-[var(--app-muted)]">
            {tr(locale, "Хамгийн сайн")}: {best}/{TEST_QUESTIONS}
          </p>
        ) : null}
        <button type="button" onClick={start} disabled={pairs.length === 0} className="mt-3 w-full rounded-2xl bg-emerald-600 py-4 text-xl font-extrabold text-white disabled:opacity-50">
          ▶ {tr(locale, "Эхлэх")}
        </button>
      </div>
    );
  }

  if (phase === "end") {
    const passed = score >= PASS_SCORE;
    return (
      <div className="app-card p-4 text-center">
        <p className="text-5xl">{passed ? "🎉" : "💪"}</p>
        <p className="mt-2 text-4xl font-extrabold text-emerald-700">
          {score}/{TEST_QUESTIONS}
        </p>
        <p className="mt-1 text-base font-bold text-slate-700">{passed ? tr(locale, "Гоё!") : tr(locale, "Дахин оролдоорой!")}</p>
        <button type="button" onClick={start} className="mt-3 w-full rounded-2xl bg-white py-3 text-base font-bold text-emerald-700 ring-1 ring-emerald-300">
          {tr(locale, "🔁 Дахин")}
        </button>
      </div>
    );
  }

  if (!round) return null;
  const answered = round.picked != null;
  const opts = [
    { syl: round.a, tone: round.ta },
    { syl: round.b, tone: round.tb },
  ];
  const correctTone = round.answer === 0 ? round.ta : round.tb;

  return (
    <div className="app-card p-4">
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--app-muted)]">
        <span>
          🎯 {n + 1}/{TEST_QUESTIONS}
        </span>
        <span>
          {tr(locale, "Оноо")}: {score}
        </span>
      </div>
      <button
        type="button"
        onClick={() => playRound(round)}
        className="mx-auto mt-3 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl ring-2 ring-emerald-200 active:bg-emerald-100"
        aria-label={tr(locale, "Дахин сонсох")}
      >
        🔊
      </button>
      <p className="mt-2 text-center text-sm font-bold text-[var(--app-muted)]">
        {section.drill === "tone" ? tr(locale, "Аль аялгуу вэ?") : tr(locale, "Алийг нь сонсов?")}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3" translate="no">
        {opts.map((o, i) => {
          let cls = "bg-white text-slate-800 ring-slate-200 active:bg-emerald-50";
          if (answered) {
            if (i === round.answer) cls = "bg-emerald-600 text-white ring-emerald-600";
            else if (i === round.picked) cls = "bg-rose-500 text-white ring-rose-500";
            else cls = "bg-slate-50 text-slate-400 ring-slate-200";
          }
          return (
            <button key={i} type="button" disabled={answered} onClick={() => choose(i as 0 | 1)} className={`rounded-3xl py-6 text-4xl font-extrabold ring-2 transition-colors ${cls}`}>
              {toneMark(o.syl, o.tone)}
              {section.drill === "tone" ? <span className="block text-sm font-bold opacity-80">{TONE_GLYPH[o.tone]} {o.tone}</span> : null}
            </button>
          );
        })}
      </div>
      {answered ? (
        <div className="mt-3 flex items-center justify-center gap-3">
          {section.drill === "tone" ? <ToneContourSvg tone={correctTone} playKey={playKey} width={72} height={40} /> : null}
          <p className={`text-center text-lg font-extrabold ${round.picked === round.answer ? "text-emerald-600" : "text-rose-600"}`}>
            {round.picked === round.answer ? tr(locale, "✓ Зөв!") : `✗ ${tr(locale, "Зөв нь")}: ${toneMark(opts[round.answer].syl, opts[round.answer].tone)}`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
