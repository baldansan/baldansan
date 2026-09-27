"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale, type UiLocale } from "@/lib/i18n/ui-locale";
import { parsePinyinSyllables } from "@/lib/speech/pinyin-tones";
import {
  EXERCISE_ROUNDS,
  PASS_SCORE,
  PINYIN_COURSE_STORAGE_KEY,
  RULE_QUESTIONS,
  TEST_QUESTIONS,
  blendKey,
  mouthShapeFor,
  type CourseProgress,
  type CourseRule,
  type CourseUnit,
  type UnitProgress,
} from "@/lib/pronunciation/pinyin-course";
import { toneMark, TONE_GLYPH } from "@/lib/pronunciation/pinyin-mark";
import { playSyllable, stopSyllable } from "@/lib/pronunciation/syllable-player";
import { useStoredJson, writeStoredJson } from "@/lib/pronunciation/use-stored-json";
import { PronunciationPractice } from "@/components/speech/pronunciation-practice";
import { MouthShape } from "./mouth-shape";
import { ToneContourSvg } from "./tone-contour-svg";

/** syl → { "1".."5": mp3 } (зөвхөн энэ нэгжид хэрэгтэй нүднүүд) */
export type UnitTones = Record<string, Record<string, string>>;

type Props = {
  unit: CourseUnit;
  tones: UnitTones;
  next: { id: string; title: string; titleZh: string } | null;
};

const EMPTY_PROGRESS: CourseProgress = {};
const ADVANCE_MS = 1100;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toneOf(pinyin: string): number {
  const t = parsePinyinSyllables(pinyin)[0]?.tone ?? 1;
  return t >= 1 && t <= 4 ? t : 1;
}

function unitTitle(u: { title: string; titleZh: string }, locale: UiLocale): string {
  return locale === "zh" ? u.titleZh : u.title;
}

/* ========================================================================== */

export function PinyinUnit({ unit, tones, next }: Props) {
  const locale = useUiLocale();
  const isRules = !!unit.rules && unit.items.length === 0;
  const steps = isRules
    ? [
        { emoji: "📏", mn: "Бичих дүрэм" },
        { emoji: "✅", mn: "Шалгалт" },
      ]
    : [
        { emoji: "👂", mn: "Сонс" },
        { emoji: "👄", mn: "Хэрхэн дуудах" },
        { emoji: "🎯", mn: "Дасгал" },
        { emoji: "✅", mn: "Шалгалт" },
      ];
  const [step, setStep] = useState(0);
  const progressAll = useStoredJson<CourseProgress>(PINYIN_COURSE_STORAGE_KEY, EMPTY_PROGRESS);
  const progress: UnitProgress = progressAll[unit.id] ?? { listened: [], done: false };
  /** Хуудсан дээр анх дарсны дараа л автоматаар тоглуулна (browser autoplay) */
  const interacted = useRef(false);

  useEffect(() => () => stopSyllable(), []);

  const save = useCallback(
    (patch: Partial<UnitProgress>) => {
      let all: CourseProgress = {};
      try {
        all = JSON.parse(localStorage.getItem(PINYIN_COURSE_STORAGE_KEY) ?? "{}") as CourseProgress;
      } catch {
        all = {};
      }
      const cur = all[unit.id] ?? { listened: [], done: false };
      writeStoredJson(PINYIN_COURSE_STORAGE_KEY, { ...all, [unit.id]: { ...cur, ...patch } });
    },
    [unit.id]
  );

  const markListened = useCallback(
    (key: string) => {
      let all: CourseProgress = {};
      try {
        all = JSON.parse(localStorage.getItem(PINYIN_COURSE_STORAGE_KEY) ?? "{}") as CourseProgress;
      } catch {
        all = {};
      }
      const cur = all[unit.id] ?? { listened: [], done: false };
      if (cur.listened.includes(key)) return;
      writeStoredJson(PINYIN_COURSE_STORAGE_KEY, { ...all, [unit.id]: { ...cur, listened: [...cur.listened, key] } });
    },
    [unit.id]
  );

  const fileFor = useCallback((syl: string, tone: number): string | null => tones[syl]?.[String(tone)] ?? null, [tones]);

  const goStep = (s: number) => {
    stopSyllable();
    setStep(s);
    try {
      window.scrollTo({ top: 0 });
    } catch {
      // ignore
    }
  };

  return (
    <div
      onPointerDownCapture={() => {
        interacted.current = true;
      }}
    >
      {/* Алхам */}
      <div className={`grid gap-1 ${steps.length === 2 ? "grid-cols-2" : "grid-cols-4"}`}>
        {steps.map((s, i) => (
          <button
            key={s.mn}
            type="button"
            onClick={() => goStep(i)}
            className={`rounded-2xl px-1 py-2 text-center ring-1 transition-colors ${
              i === step ? "bg-emerald-600 text-white ring-emerald-600" : i < step ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-white text-slate-500 ring-slate-200"
            }`}
          >
            <span className="block text-xl leading-6">{s.emoji}</span>
            <span className="block text-[11px] font-bold leading-4">{tr(locale, s.mn)}</span>
          </button>
        ))}
      </div>

      <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900 ring-1 ring-amber-100">
        {locale === "zh" && unit.introZh ? unit.introZh : unit.intro}
      </p>

      <div className="mt-3">
        {isRules ? (
          step === 0 ? (
            <RulesStep rules={unit.rules ?? []} fileFor={fileFor} onSeen={markListened} onNext={() => goStep(1)} />
          ) : (
            <RulesTest
              onFinish={(score) => save({ testScore: score, done: score >= PASS_SCORE, listened: (unit.rules ?? []).map((_, i) => String(i)) })}
              next={next}
              progress={progress}
            />
          )
        ) : step === 0 ? (
          <ListenStep unit={unit} fileFor={fileFor} interacted={interacted} onListened={markListened} onNext={() => goStep(1)} />
        ) : step === 1 ? (
          <TipStep unit={unit} fileFor={fileFor} onNext={() => goStep(2)} />
        ) : step === 2 ? (
          <ExerciseStep unit={unit} tones={tones} fileFor={fileFor} onNext={() => goStep(3)} />
        ) : (
          <TestStep
            unit={unit}
            tones={tones}
            fileFor={fileFor}
            onFinish={(score) => save({ testScore: score, done: score >= PASS_SCORE })}
            next={next}
            progress={progress}
          />
        )}
      </div>

      <Link href="/pronunciation/basics" className="mt-4 block text-center text-sm font-bold text-emerald-700">
        ← {tr(locale, "Хичээлүүд")}
      </Link>
    </div>
  );
}

/* ======================= 1. 👂 Сонс ======================================= */

type FileFor = (syl: string, tone: number) => string | null;

function ToneButtons({
  syl,
  active,
  onPlay,
  size = "lg",
}: {
  syl: string;
  active: number | null;
  onPlay: (tone: number) => void;
  size?: "lg" | "sm";
}) {
  return (
    <div className="grid grid-cols-4 gap-2" translate="no">
      {[1, 2, 3, 4].map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onPlay(t)}
          className={`rounded-2xl ring-1 transition-colors ${size === "lg" ? "py-4" : "py-2"} ${
            active === t ? "bg-emerald-600 text-white ring-emerald-600" : "bg-emerald-50 text-emerald-800 ring-emerald-200 active:bg-emerald-100"
          }`}
        >
          <span className={`block font-extrabold ${size === "lg" ? "text-3xl" : "text-xl"}`}>{toneMark(syl, t)}</span>
          <span className="block text-[11px] font-bold opacity-80">
            {TONE_GLYPH[t]} {t}
          </span>
        </button>
      ))}
    </div>
  );
}

function ListenStep({
  unit,
  fileFor,
  interacted,
  onListened,
  onNext,
}: {
  unit: CourseUnit;
  fileFor: FileFor;
  interacted: MutableRefObject<boolean>;
  onListened: (key: string) => void;
  onNext: () => void;
}) {
  const locale = useUiLocale();
  const [idx, setIdx] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const item = unit.items[idx];

  const play = (tone: number, syl: string = item.syl) => {
    const f = fileFor(syl, tone);
    if (!f) return;
    setActive(tone);
    setPlayKey((k) => k + 1);
    onListened(syl);
    void playSyllable(f);
  };

  /** Карт солиход 1-р аялгуу автоматаар (хуудсан дээр анх дарсны дараа) */
  const goTo = (n: number) => {
    stopSyllable();
    setIdx(n);
    setActive(null);
    if (interacted.current) play(1, unit.items[n].syl);
  };

  const go = (d: number) => {
    onListened(item.syl);
    const n = idx + d;
    if (n >= unit.items.length) {
      onNext();
      return;
    }
    if (n < 0) return;
    goTo(n);
  };

  return (
    <div className="app-card p-4">
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--app-muted)]">
        <span>
          {idx + 1}/{unit.items.length}
        </span>
        <div className="flex gap-1" translate="no">
          {unit.items.map((it, i) => (
            <button
              key={it.letter}
              type="button"
              onClick={() => goTo(i)}
              className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${i === idx ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {it.letter}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 text-center" translate="no">
        <p className="text-8xl font-extrabold leading-none text-emerald-700">{item.letter}</p>
        {item.syl !== item.letter ? <p className="mt-1 text-3xl font-bold text-slate-500">{item.syl}</p> : null}
      </div>

      <button
        type="button"
        onClick={() => play(toneOf(item.examplePinyin))}
        className="mx-auto mt-3 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2 ring-1 ring-slate-200 active:bg-slate-100"
        translate="no"
      >
        <span className="text-5xl font-bold text-slate-800">{item.exampleHanzi}</span>
        <span className="text-left">
          <span className="block text-xl font-extrabold text-emerald-700">{item.examplePinyin}</span>
          <span className="block text-sm text-slate-600">{item.exampleMn}</span>
        </span>
      </button>

      <div className="mt-4">
        <ToneButtons syl={item.syl} active={active} onPlay={play} />
      </div>
      <div className="mt-2 flex h-11 items-center justify-center">
        {active ? <ToneContourSvg tone={active} playKey={playKey} width={120} height={44} /> : <span className="text-xs font-semibold text-[var(--app-muted)]">{tr(locale, "Аялгуу дараад сонс")}</span>}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={idx === 0}
          className="rounded-2xl bg-slate-100 px-4 py-4 text-base font-bold text-slate-700 disabled:opacity-40"
        >
          ←
        </button>
        <button type="button" onClick={() => go(1)} className="flex-1 rounded-2xl bg-emerald-600 py-4 text-xl font-extrabold text-white active:bg-emerald-700">
          {idx + 1 >= unit.items.length ? `👄 ${tr(locale, "Хэрхэн дуудах")} →` : `${tr(locale, "Дараах")} →`}
        </button>
      </div>
    </div>
  );
}

/* ======================= 2. 👄 Хэрхэн дуудах ============================= */

function TipStep({ unit, fileFor, onNext }: { unit: CourseUnit; fileFor: FileFor; onNext: () => void }) {
  const locale = useUiLocale();
  const [idx, setIdx] = useState(0);
  const [mic, setMic] = useState(false);
  const item = unit.items[idx];
  const tone = toneOf(item.examplePinyin);
  const file = fileFor(item.syl, tone);
  const tip = locale === "zh" && item.tipZh ? item.tipZh : item.tip;

  const goTo = (n: number) => {
    stopSyllable();
    setMic(false);
    setIdx(n);
  };

  const go = (d: number) => {
    const n = idx + d;
    if (n >= unit.items.length) {
      onNext();
      return;
    }
    if (n < 0) return;
    goTo(n);
  };

  return (
    <div className="app-card p-4">
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--app-muted)]">
        <span>
          {idx + 1}/{unit.items.length}
        </span>
        <div className="flex gap-1" translate="no">
          {unit.items.map((it, i) => (
            <button
              key={it.letter}
              type="button"
              onClick={() => goTo(i)}
              className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${i === idx ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {it.letter}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-4">
        <MouthShape shape={mouthShapeFor(item.letter, item.syl)} size={110} />
        <div className="text-center" translate="no">
          <p className="text-6xl font-extrabold leading-none text-emerald-700">{item.letter}</p>
          <button
            type="button"
            onClick={() => file && void playSyllable(file)}
            className="mt-2 rounded-full bg-emerald-50 px-3 py-1.5 text-lg font-extrabold text-emerald-800 ring-1 ring-emerald-200"
          >
            🔊 {item.exampleHanzi} {item.examplePinyin}
          </button>
        </div>
      </div>

      <p className="mt-3 rounded-2xl bg-sky-50 px-4 py-3 text-base font-semibold leading-7 text-slate-800 ring-1 ring-sky-100">{tip}</p>

      {mic ? (
        <PronunciationPractice
          key={item.syl}
          text={item.exampleHanzi}
          pinyin={item.examplePinyin}
          mode="pitch"
          audioUrl={file}
          sectionLink={false}
          className="mt-3"
        />
      ) : (
        <button
          type="button"
          onClick={() => setMic(true)}
          className="mt-3 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-lg font-bold text-emerald-700"
        >
          {tr(locale, "🎤 Дагаж хэлэх")}
        </button>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={idx === 0}
          className="rounded-2xl bg-slate-100 px-4 py-4 text-base font-bold text-slate-700 disabled:opacity-40"
        >
          ←
        </button>
        <button type="button" onClick={() => go(1)} className="flex-1 rounded-2xl bg-emerald-600 py-4 text-xl font-extrabold text-white active:bg-emerald-700">
          {idx + 1 >= unit.items.length ? `🎯 ${tr(locale, "Дасгал")} →` : `${tr(locale, "Дараах")} →`}
        </button>
      </div>
    </div>
  );
}

/* ======================= 3. 🎯 Дасгал ==================================== */

type PickRound = { a: string; b: string; tone: number; answer: 0 | 1; picked: number | null };

function commonTones(tones: UnitTones, a: string, b: string): number[] {
  return [1, 2, 3, 4].filter((t) => tones[a]?.[String(t)] && tones[b]?.[String(t)]);
}

function makePickRound(pairs: [string, string][], tones: UnitTones): PickRound | null {
  const usable = pairs.filter(([a, b]) => commonTones(tones, a, b).length > 0);
  if (usable.length === 0) return null;
  const [a, b] = pick(usable);
  const tone = pick(commonTones(tones, a, b));
  return { a, b, tone, answer: Math.random() < 0.5 ? 0 : 1, picked: null };
}

/** Сонсоод сонго — 2 том товч */
function HearPick({
  unit,
  tones,
  fileFor,
  rounds: total,
  onDone,
}: {
  unit: CourseUnit;
  tones: UnitTones;
  fileFor: FileFor;
  rounds: number;
  onDone: (score: number) => void;
}) {
  const locale = useUiLocale();
  const pairs = useMemo(() => unit.pairs ?? [], [unit.pairs]);
  const [round, setRound] = useState<PickRound | null>(() => makePickRound(pairs, tones));
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const playRound = useCallback(
    (r: PickRound) => {
      const syl = r.answer === 0 ? r.a : r.b;
      const f = fileFor(syl, r.tone);
      if (f) void playSyllable(f);
    },
    [fileFor]
  );

  const start = () => {
    const r = makePickRound(pairs, tones);
    setRound(r);
    setN(0);
    setScore(0);
    if (r) playRound(r);
  };

  const advance = (curScore: number, curN: number) => {
    if (curN + 1 >= total) {
      onDone(curScore);
      return;
    }
    const r = makePickRound(pairs, tones);
    setRound(r);
    setN(curN + 1);
    if (r) playRound(r);
  };

  const choose = (i: 0 | 1) => {
    if (!round || round.picked != null) return;
    const ok = i === round.answer;
    const s = score + (ok ? 1 : 0);
    setScore(s);
    setRound({ ...round, picked: i });
    if (!ok) playRound(round);
    timer.current = window.setTimeout(() => advance(s, n), ok ? ADVANCE_MS : ADVANCE_MS + 600);
  };

  if (!round) return <p className="text-sm text-[var(--app-muted)]">{tr(locale, "Энэ нэгжид хос алга.")}</p>;

  const answered = round.picked != null;
  const opts = [round.a, round.b] as const;

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--app-muted)]">
        <span>
          {n + 1}/{total}
        </span>
        <span>
          {tr(locale, "Оноо")}: {score}
        </span>
      </div>
      <button
        type="button"
        onClick={() => playRound(round)}
        className="mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-5xl ring-2 ring-emerald-200 active:bg-emerald-100"
        aria-label={tr(locale, "Дахин сонсох")}
      >
        🔊
      </button>
      <p className="mt-2 text-center text-sm font-bold text-[var(--app-muted)]">{tr(locale, "Алийг нь сонсов?")}</p>
      <div className="mt-3 grid grid-cols-2 gap-3" translate="no">
        {opts.map((syl, i) => {
          let cls = "bg-white text-slate-800 ring-slate-200 active:bg-emerald-50";
          if (answered) {
            if (i === round.answer) cls = "bg-emerald-600 text-white ring-emerald-600";
            else if (i === round.picked) cls = "bg-rose-500 text-white ring-rose-500";
            else cls = "bg-slate-50 text-slate-400 ring-slate-200";
          }
          return (
            <button
              key={syl}
              type="button"
              disabled={answered}
              onClick={() => choose(i as 0 | 1)}
              className={`rounded-3xl py-7 text-4xl font-extrabold ring-2 transition-colors ${cls}`}
            >
              {toneMark(syl, round.tone)}
            </button>
          );
        })}
      </div>
      {answered ? (
        <p className={`mt-3 text-center text-lg font-extrabold ${round.picked === round.answer ? "text-emerald-600" : "text-rose-600"}`}>
          {round.picked === round.answer ? tr(locale, "✓ Зөв!") : `✗ ${tr(locale, "Зөв нь")}: ${toneMark(opts[round.answer], round.tone)}`}
        </p>
      ) : (
        <button type="button" onClick={start} className="mx-auto mt-3 block text-xs font-semibold text-slate-400">
          {tr(locale, "🔁 Дахин")}
        </button>
      )}
    </div>
  );
}

function Chip({
  label,
  on,
  dim,
  onClick,
  state,
}: {
  label: string;
  on: boolean;
  dim: boolean;
  onClick: () => void;
  state?: "ok" | "bad";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-2 py-3 text-2xl font-extrabold ring-1 transition-colors ${
        state === "ok"
          ? "bg-emerald-600 text-white ring-emerald-600"
          : state === "bad"
            ? "bg-rose-500 text-white ring-rose-500"
            : on
              ? "bg-emerald-600 text-white ring-emerald-600"
              : dim
                ? "bg-slate-50 text-slate-300 ring-slate-100"
                : "bg-white text-slate-800 ring-slate-200 active:bg-emerald-50"
      }`}
    >
      {label}
    </button>
  );
}

/** 拼读 бүтээгч — гийгүүлэгч + эгшиг */
function Builder({
  unit,
  tones,
  fileFor,
  onDone,
}: {
  unit: CourseUnit;
  tones: UnitTones;
  fileFor: FileFor;
  onDone: () => void;
}) {
  const locale = useUiLocale();
  const blend = unit.blend!;
  const [selI, setSelI] = useState<string | null>(null);
  const [selF, setSelF] = useState<string | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [playKey, setPlayKey] = useState(0);
  /** Санамсаргүй горим: __ + a = ? */
  const [quiz, setQuiz] = useState<{ i: string; f: string; picked: string | null } | null>(null);
  const [qn, setQn] = useState(0);
  const [qScore, setQScore] = useState(0);
  const [qDone, setQDone] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const exists = useCallback((i: string, f: string) => !!tones[blendKey(i, f)]?.["1"], [tones]);
  const combos = useMemo(() => {
    const out: Array<{ i: string; f: string }> = [];
    for (const i of blend.initials) for (const f of blend.finals) if (exists(i, f)) out.push({ i, f });
    return out;
  }, [blend, exists]);

  const key = selI && selF ? blendKey(selI, selF) : null;
  const has = key ? !!tones[key] : false;

  const play = useCallback(
    (syl: string, tone: number) => {
      const f = fileFor(syl, tone);
      if (!f) return;
      setActive(tone);
      setPlayKey((k) => k + 1);
      void playSyllable(f);
    },
    [fileFor]
  );

  /** Хоёулаа сонгогдоход 1-р аялгуу */
  const select = (kind: "i" | "f", val: string) => {
    const ni = kind === "i" ? (selI === val ? null : val) : selI;
    const nf = kind === "f" ? (selF === val ? null : val) : selF;
    setSelI(ni);
    setSelF(nf);
    setActive(null);
    if (ni && nf) {
      const k = blendKey(ni, nf);
      if (tones[k]) play(k, 1);
    }
  };

  const startQuiz = () => {
    const c = pick(combos);
    setQuiz({ ...c, picked: null });
    setQn(0);
    setQScore(0);
    setQDone(false);
    setSelI(null);
    setSelF(null);
    play(blendKey(c.i, c.f), 1);
  };

  const answerQuiz = (i: string) => {
    if (!quiz || quiz.picked != null) return;
    const ok = i === quiz.i;
    const s = qScore + (ok ? 1 : 0);
    setQScore(s);
    setQuiz({ ...quiz, picked: i });
    if (!ok) play(blendKey(quiz.i, quiz.f), 1);
    timer.current = window.setTimeout(() => {
      if (qn + 1 >= EXERCISE_ROUNDS) {
        setQDone(true);
        setQuiz(null);
        return;
      }
      const c = pick(combos);
      setQuiz({ ...c, picked: null });
      setQn(qn + 1);
      play(blendKey(c.i, c.f), 1);
    }, ok ? ADVANCE_MS : ADVANCE_MS + 600);
  };

  return (
    <div>
      {/* Үр дүн */}
      <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center ring-1 ring-slate-200" translate="no">
        {quiz ? (
          <>
            <p className="text-xs font-semibold text-[var(--app-muted)]">
              {qn + 1}/{EXERCISE_ROUNDS} · {tr(locale, "Оноо")}: {qScore}
            </p>
            <p className="mt-1 text-4xl font-extrabold text-slate-800">
              <span className="text-emerald-700">{quiz.picked ? quiz.i : "__"}</span> + {quiz.f} = {quiz.picked ? blendKey(quiz.i, quiz.f) : "?"}
            </p>
            <button
              type="button"
              onClick={() => play(blendKey(quiz.i, quiz.f), 1)}
              className="mt-2 rounded-full bg-emerald-50 px-4 py-2 text-2xl ring-1 ring-emerald-200"
              aria-label={tr(locale, "Дахин сонсох")}
            >
              🔊
            </button>
            <p className="mt-1 text-xs font-bold text-[var(--app-muted)]">{tr(locale, "Аль гийгүүлэгчийг сонсов?")}</p>
          </>
        ) : qDone ? (
          <>
            <p className="text-3xl font-extrabold text-emerald-700">
              {qScore}/{EXERCISE_ROUNDS}
            </p>
            <div className="mt-2 flex justify-center gap-2">
              <button type="button" onClick={startQuiz} className="rounded-full bg-white px-4 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-300">
                {tr(locale, "🎲 Дахин")}
              </button>
              <button type="button" onClick={onDone} className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white">
                ✅ {tr(locale, "Шалгалт")} →
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-4xl font-extrabold text-slate-800">
              <span className="text-emerald-700">{selI ?? "_"}</span> + <span className="text-sky-700">{selF ?? "_"}</span> ={" "}
              {key ? (has ? key : <span className="text-slate-300 line-through">{key}</span>) : "?"}
            </p>
            {key && !has ? <p className="mt-1 text-xs font-semibold text-rose-500">{tr(locale, "Ийм үе байхгүй")}</p> : null}
            {key && has ? (
              <div className="mt-2">
                <ToneButtons syl={key} active={active} onPlay={(t) => play(key, t)} size="sm" />
                <div className="mt-1 flex h-9 items-center justify-center">
                  {active ? <ToneContourSvg tone={active} playKey={playKey} width={96} height={36} /> : null}
                </div>
              </div>
            ) : (
              <p className="mt-1 text-xs font-semibold text-[var(--app-muted)]">{tr(locale, "Нэг гийгүүлэгч, нэг эгшиг сонго")}</p>
            )}
          </>
        )}
      </div>

      {/* Хоёр багана */}
      <div className="mt-3 grid grid-cols-2 gap-3" translate="no">
        <div>
          <p className="mb-1 text-center text-[11px] font-bold text-emerald-700">{locale === "zh" ? "声母" : "гийгүүлэгч"}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {blend.initials.map((i) => {
              const dim = !!selF && !exists(i, selF) && !quiz;
              const state = quiz && quiz.picked ? (i === quiz.i ? "ok" : i === quiz.picked ? "bad" : undefined) : undefined;
              return <Chip key={i} label={i} on={selI === i} dim={dim} state={state} onClick={() => (quiz ? answerQuiz(i) : select("i", i))} />;
            })}
          </div>
        </div>
        <div className={quiz ? "opacity-40" : ""}>
          <p className="mb-1 text-center text-[11px] font-bold text-sky-700">{locale === "zh" ? "韵母" : "эгшиг"}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {blend.finals.map((f) => {
              const dim = !!selI && !exists(selI, f);
              return <Chip key={f} label={f} on={selF === f || quiz?.f === f} dim={dim} onClick={() => !quiz && select("f", f)} />;
            })}
          </div>
        </div>
      </div>

      {!quiz && !qDone ? (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={startQuiz} className="flex-1 rounded-2xl bg-white py-3 text-base font-bold text-emerald-700 ring-1 ring-emerald-300">
            🎲 {tr(locale, "Санамсаргүй")}
          </button>
          <button type="button" onClick={onDone} className="rounded-2xl bg-emerald-600 px-4 py-3 text-base font-bold text-white">
            ✅ {tr(locale, "Шалгалт")} →
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ExerciseStep({ unit, tones, fileFor, onNext }: { unit: CourseUnit; tones: UnitTones; fileFor: FileFor; onNext: () => void }) {
  const locale = useUiLocale();
  const hasBuilder = !!unit.blend;
  const [tab, setTab] = useState<"pick" | "build">("pick");
  const [pickDone, setPickDone] = useState<number | null>(null);

  return (
    <div className="app-card p-4">
      {hasBuilder ? (
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
          {(["pick", "build"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                stopSyllable();
                setTab(t);
              }}
              className={`rounded-full py-2 text-sm font-bold ${tab === t ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}
            >
              {t === "pick" ? `👂 ${tr(locale, "Сонсоод сонго")}` : `🧩 ${tr(locale, "Үе бүтээх")}`}
            </button>
          ))}
        </div>
      ) : null}

      {tab === "pick" ? (
        pickDone == null ? (
          <HearPick key="pick" unit={unit} tones={tones} fileFor={fileFor} rounds={EXERCISE_ROUNDS} onDone={setPickDone} />
        ) : (
          <div className="text-center">
            <p className="text-5xl">{pickDone >= EXERCISE_ROUNDS - 1 ? "🎉" : "👍"}</p>
            <p className="mt-1 text-3xl font-extrabold text-emerald-700">
              {pickDone}/{EXERCISE_ROUNDS}
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setPickDone(null)} className="flex-1 rounded-2xl bg-white py-3 text-base font-bold text-emerald-700 ring-1 ring-emerald-300">
                {tr(locale, "🔁 Дахин")}
              </button>
              <button
                type="button"
                onClick={() => (hasBuilder ? setTab("build") : onNext())}
                className="flex-1 rounded-2xl bg-emerald-600 py-3 text-base font-bold text-white"
              >
                {hasBuilder ? `🧩 ${tr(locale, "Үе бүтээх")} →` : `✅ ${tr(locale, "Шалгалт")} →`}
              </button>
            </div>
          </div>
        )
      ) : (
        <Builder key="build" unit={unit} tones={tones} fileFor={fileFor} onDone={onNext} />
      )}
    </div>
  );
}

/* ======================= 4. ✅ Шалгалт =================================== */

type TestQ =
  | { kind: "pick"; a: string; b: string; tone: number; answer: 0 | 1 }
  | { kind: "tone"; syl: string; tone: number };

function makeTest(unit: CourseUnit, tones: UnitTones): TestQ[] {
  const qs: TestQ[] = [];
  const syls = unit.items.map((i) => i.syl).filter((s) => tones[s]);
  const pairs = (unit.pairs ?? []).filter(([a, b]) => commonTones(tones, a, b).length > 0);
  for (let i = 0; i < TEST_QUESTIONS; i++) {
    const wantPick = pairs.length > 0 && (syls.length === 0 || i % 2 === 0);
    if (wantPick) {
      const [a, b] = pick(pairs);
      qs.push({ kind: "pick", a, b, tone: pick(commonTones(tones, a, b)), answer: Math.random() < 0.5 ? 0 : 1 });
    } else {
      const syl = pick(syls);
      const ts = [1, 2, 3, 4].filter((t) => tones[syl]?.[String(t)]);
      qs.push({ kind: "tone", syl, tone: pick(ts) });
    }
  }
  return shuffle(qs);
}

function qFile(q: TestQ, fileFor: FileFor): string | null {
  return q.kind === "pick" ? fileFor(q.answer === 0 ? q.a : q.b, q.tone) : fileFor(q.syl, q.tone);
}

function TestStep({
  unit,
  tones,
  fileFor,
  onFinish,
  next,
  progress,
}: {
  unit: CourseUnit;
  tones: UnitTones;
  fileFor: FileFor;
  onFinish: (score: number) => void;
  next: Props["next"];
  progress: UnitProgress;
}) {
  const locale = useUiLocale();
  const [qs, setQs] = useState<TestQ[]>([]);
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"intro" | "play" | "end">("intro");
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const start = () => {
    const t = makeTest(unit, tones);
    setQs(t);
    setN(0);
    setScore(0);
    setPicked(null);
    setPhase("play");
    const f = qFile(t[0], fileFor);
    if (f) void playSyllable(f);
  };

  const q = qs[n];
  const correctIdx = q ? (q.kind === "pick" ? q.answer : q.tone) : -1;

  const answer = (i: number) => {
    if (!q || picked != null) return;
    const ok = i === correctIdx;
    const s = score + (ok ? 1 : 0);
    setScore(s);
    setPicked(i);
    if (!ok) {
      const f = qFile(q, fileFor);
      if (f) void playSyllable(f);
    }
    timer.current = window.setTimeout(() => {
      if (n + 1 >= qs.length) {
        stopSyllable();
        onFinish(s);
        setPhase("end");
        return;
      }
      setN(n + 1);
      setPicked(null);
      const f = qFile(qs[n + 1], fileFor);
      if (f) void playSyllable(f);
    }, ok ? ADVANCE_MS : ADVANCE_MS + 600);
  };

  if (phase === "intro") {
    return (
      <div className="app-card p-4 text-center">
        <p className="text-5xl">✅</p>
        <p className="mt-2 text-base font-semibold leading-6 text-slate-700">
          {tr(locale, "8 асуулт: сонсоод сонго + аль аялгуу вэ. 6-аас дээш бол нэгж дууссан.")}
        </p>
        {progress.testScore != null ? (
          <p className="mt-1 text-xs font-bold text-[var(--app-muted)]">
            {tr(locale, "Өмнөх оноо")}: {progress.testScore}/{TEST_QUESTIONS}
          </p>
        ) : null}
        <button type="button" onClick={start} className="mt-4 w-full rounded-2xl bg-emerald-600 py-4 text-xl font-extrabold text-white">
          ▶ {tr(locale, "Эхлэх")}
        </button>
      </div>
    );
  }

  if (phase === "end") {
    const passed = score >= PASS_SCORE;
    return (
      <div className="app-card p-4 text-center">
        <p className="text-6xl">{passed ? "🎉" : "💪"}</p>
        <p className="mt-2 text-4xl font-extrabold text-emerald-700">
          {score}/{TEST_QUESTIONS}
        </p>
        <p className="mt-1 text-lg font-bold text-slate-700">{passed ? tr(locale, "Гоё!") : tr(locale, "Дахин оролдоорой!")}</p>
        <div className="mt-4 flex flex-col gap-2">
          {passed && next ? (
            <Link href={`/pronunciation/basics/${next.id}`} className="rounded-2xl bg-emerald-600 py-4 text-xl font-extrabold text-white">
              {tr(locale, "Дараагийн нэгж →")}
              <span className="block text-sm font-bold opacity-80" translate="no">
                {unitTitle(next, locale)}
              </span>
            </Link>
          ) : null}
          {passed && !next ? (
            <Link href="/pronunciation/basics" className="rounded-2xl bg-emerald-600 py-4 text-xl font-extrabold text-white">
              🏆 {tr(locale, "Бүх нэгж дууссан!")}
            </Link>
          ) : null}
          <button type="button" onClick={start} className="rounded-2xl bg-white py-3 text-base font-bold text-emerald-700 ring-1 ring-emerald-300">
            {tr(locale, "🔁 Дахин")}
          </button>
        </div>
      </div>
    );
  }

  if (!q) return null;
  const answered = picked != null;
  const optionCls = (i: number) => {
    if (!answered) return "bg-white text-slate-800 ring-slate-200 active:bg-emerald-50";
    if (i === correctIdx) return "bg-emerald-600 text-white ring-emerald-600";
    if (i === picked) return "bg-rose-500 text-white ring-rose-500";
    return "bg-slate-50 text-slate-400 ring-slate-200";
  };

  return (
    <div className="app-card p-4">
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--app-muted)]">
        <span>
          {n + 1}/{qs.length}
        </span>
        <span>
          {tr(locale, "Оноо")}: {score}
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          const f = qFile(q, fileFor);
          if (f) void playSyllable(f);
        }}
        className="mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-5xl ring-2 ring-emerald-200 active:bg-emerald-100"
        aria-label={tr(locale, "Дахин сонсох")}
      >
        🔊
      </button>
      <p className="mt-2 text-center text-sm font-bold text-[var(--app-muted)]">
        {q.kind === "pick" ? tr(locale, "Алийг нь сонсов?") : tr(locale, "Аль аялгуу вэ?")}
      </p>
      {q.kind === "pick" ? (
        <div className="mt-3 grid grid-cols-2 gap-3" translate="no">
          {[q.a, q.b].map((syl, i) => (
            <button key={syl} type="button" disabled={answered} onClick={() => answer(i)} className={`rounded-3xl py-7 text-4xl font-extrabold ring-2 ${optionCls(i)}`}>
              {toneMark(syl, q.tone)}
            </button>
          ))}
        </div>
      ) : (
        <>
          <p className="mt-2 text-center text-4xl font-extrabold text-slate-800" translate="no">
            {answered ? toneMark(q.syl, q.tone) : q.syl}
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2" translate="no">
            {[1, 2, 3, 4].map((t) => (
              <button key={t} type="button" disabled={answered} onClick={() => answer(t)} className={`rounded-2xl py-4 ring-1 ${optionCls(t)}`}>
                <span className="block text-4xl font-extrabold leading-8">{TONE_GLYPH[t]}</span>
                <span className="block text-[11px] font-bold opacity-80">{t}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {answered ? (
        <p className={`mt-3 text-center text-lg font-extrabold ${picked === correctIdx ? "text-emerald-600" : "text-rose-600"}`}>
          {picked === correctIdx ? tr(locale, "✓ Зөв!") : `✗ ${tr(locale, "Зөв нь")}: ${q.kind === "pick" ? toneMark(q.answer === 0 ? q.a : q.b, q.tone) : toneMark(q.syl, q.tone)}`}
        </p>
      ) : null}
    </div>
  );
}

/* ======================= 13. 📏 Дүрэм ==================================== */

function RulesStep({
  rules,
  fileFor,
  onSeen,
  onNext,
}: {
  rules: CourseRule[];
  fileFor: FileFor;
  onSeen: (key: string) => void;
  onNext: () => void;
}) {
  const locale = useUiLocale();
  return (
    <div className="space-y-3">
      {rules.map((r, i) => (
        <div key={r.title} className="app-card p-4">
          <p className="text-base font-extrabold text-slate-800">
            {i + 1}. {locale === "zh" ? r.titleZh : r.title}
            {locale !== "zh" ? <span className="ml-2 text-xs font-semibold text-slate-400">{r.titleZh}</span> : null}
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{locale === "zh" && r.bodyZh ? r.bodyZh : r.body}</p>
          <div className="mt-2 flex flex-wrap gap-2" translate="no">
            {r.examples.map((ex) => {
              const f = ex.syl && ex.tone ? fileFor(ex.syl, ex.tone) : null;
              return (
                <button
                  key={ex.text + ex.pinyin}
                  type="button"
                  disabled={!f}
                  onClick={() => {
                    if (!f) return;
                    onSeen(String(i));
                    void playSyllable(f);
                  }}
                  className={`rounded-2xl px-3 py-2 text-left ring-1 ${f ? "bg-emerald-50 ring-emerald-200 active:bg-emerald-100" : "bg-slate-50 ring-slate-200"}`}
                >
                  <span className="block text-xl font-bold text-slate-800">
                    {f ? "🔊 " : ""}
                    {ex.text}
                  </span>
                  <span className="block text-sm font-extrabold text-emerald-700">{ex.pinyin}</span>
                  {ex.mn && locale !== "zh" ? <span className="block text-[11px] text-slate-500">{ex.mn}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button type="button" onClick={onNext} className="w-full rounded-2xl bg-emerald-600 py-4 text-xl font-extrabold text-white">
        ✅ {tr(locale, "Шалгалт")} →
      </button>
    </div>
  );
}

function RulesTest({ onFinish, next, progress }: { onFinish: (score: number) => void; next: Props["next"]; progress: UnitProgress }) {
  const locale = useUiLocale();
  const [qs, setQs] = useState(() => shuffle(RULE_QUESTIONS).slice(0, TEST_QUESTIONS));
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"play" | "end">("play");
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const restart = () => {
    setQs(shuffle(RULE_QUESTIONS).slice(0, TEST_QUESTIONS));
    setN(0);
    setPicked(null);
    setScore(0);
    setPhase("play");
  };

  const q = qs[n];
  const answer = (i: number) => {
    if (!q || picked != null) return;
    const ok = i === q.answer;
    const s = score + (ok ? 1 : 0);
    setScore(s);
    setPicked(i);
    timer.current = window.setTimeout(() => {
      if (n + 1 >= qs.length) {
        onFinish(s);
        setPhase("end");
        return;
      }
      setN(n + 1);
      setPicked(null);
    }, ok ? ADVANCE_MS : ADVANCE_MS + 600);
  };

  if (phase === "end") {
    const passed = score >= PASS_SCORE;
    return (
      <div className="app-card p-4 text-center">
        <p className="text-6xl">{passed ? "🎉" : "💪"}</p>
        <p className="mt-2 text-4xl font-extrabold text-emerald-700">
          {score}/{qs.length}
        </p>
        <p className="mt-1 text-lg font-bold text-slate-700">{passed ? tr(locale, "Гоё!") : tr(locale, "Дахин оролдоорой!")}</p>
        <div className="mt-4 flex flex-col gap-2">
          {passed && next ? (
            <Link href={`/pronunciation/basics/${next.id}`} className="rounded-2xl bg-emerald-600 py-4 text-xl font-extrabold text-white">
              {tr(locale, "Дараагийн нэгж →")}
            </Link>
          ) : null}
          {passed && !next ? (
            <Link href="/pronunciation/basics" className="rounded-2xl bg-emerald-600 py-4 text-xl font-extrabold text-white">
              🏆 {tr(locale, "Бүх нэгж дууссан!")}
            </Link>
          ) : null}
          <button type="button" onClick={restart} className="rounded-2xl bg-white py-3 text-base font-bold text-emerald-700 ring-1 ring-emerald-300">
            {tr(locale, "🔁 Дахин")}
          </button>
        </div>
      </div>
    );
  }

  if (!q) return null;
  const answered = picked != null;
  return (
    <div className="app-card p-4">
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--app-muted)]">
        <span>
          {n + 1}/{qs.length}
        </span>
        <span>
          {tr(locale, "Оноо")}: {score}
          {progress.testScore != null ? ` · ${tr(locale, "Өмнөх оноо")}: ${progress.testScore}` : ""}
        </span>
      </div>
      <p className="mt-3 text-center text-lg font-bold text-slate-800">{locale === "zh" ? q.qZh : q.q}</p>
      <div className="mt-3 grid grid-cols-2 gap-3" translate="no">
        {q.options.map((o, i) => {
          let cls = "bg-white text-slate-800 ring-slate-200 active:bg-emerald-50";
          if (answered) {
            if (i === q.answer) cls = "bg-emerald-600 text-white ring-emerald-600";
            else if (i === picked) cls = "bg-rose-500 text-white ring-rose-500";
            else cls = "bg-slate-50 text-slate-400 ring-slate-200";
          }
          return (
            <button key={o} type="button" disabled={answered} onClick={() => answer(i)} className={`rounded-3xl py-6 text-3xl font-extrabold ring-2 ${cls}`}>
              {o}
            </button>
          );
        })}
      </div>
      {answered ? (
        <p className={`mt-3 text-center text-lg font-extrabold ${picked === q.answer ? "text-emerald-600" : "text-rose-600"}`}>
          {picked === q.answer ? tr(locale, "✓ Зөв!") : `✗ ${tr(locale, "Зөв нь")}: ${q.options[q.answer]}`}
        </p>
      ) : null}
    </div>
  );
}
