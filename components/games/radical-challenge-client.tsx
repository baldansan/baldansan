"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { GameShell } from "@/components/games/game-shell";
import {
  buildChallengeRoundOptions,
  calculateChallengeScore,
  challengeTierForRound,
  entryToBreakdown,
  filterChallengeEntriesByHskLevel,
  getChallengeComponentMeta,
  getRadicalChallengeEntries,
  isChallengeAnswerCorrect,
  type RadicalChallengeEntry,
} from "@/lib/games/radical-challenge-game";
import { RadicalHanziPanel } from "@/components/games/radical-hanzi-panel";
import { resolveGameLabels } from "@/lib/games/game-lesson-meta";
import { saveGameResult } from "@/lib/games/game-progress";
import { formatActiveHskLevel } from "@/lib/hsk/active-hsk-level";

type Props = {
  lessonId: string;
  entries?: RadicalChallengeEntry[];
  onExitChallenge?: () => void;
};

type SelectedSlot = {
  c: string;
  optIndex: number;
};

type RoundResult = "ok" | "wrong" | "timeout" | null;

const MAX_LIVES = 3;
const HINT_PENALTY = 5;
const WRONG_PENALTY = 5;

export function RadicalChallengeClient({
  lessonId,
  entries: entriesProp,
  onExitChallenge,
}: Props) {
  const { level: hskLevel } = useActiveHskLevel();
  const labels = resolveGameLabels(false, false);

  const entries = useMemo(() => {
    const source = entriesProp ?? getRadicalChallengeEntries();
    return filterChallengeEntriesByHskLevel(source, hskLevel);
  }, [entriesProp, hskLevel]);

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState<SelectedSlot[]>([]);
  const [usedOptIndices, setUsedOptIndices] = useState<Set<number>>(new Set());
  const [roundOptions, setRoundOptions] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [roundResult, setRoundResult] = useState<RoundResult>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [tierTime, setTierTime] = useState(30);
  const [lastGain, setLastGain] = useState({ total: 0, base: 0, speed: 0, streakBonus: 0 });
  const [finished, setFinished] = useState<"win" | "lose" | null>(null);
  const [saved, setSaved] = useState(false);
  const [hideHanzi, setHideHanzi] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedRef = useRef(false);
  const currentRef = useRef<RadicalChallengeEntry | undefined>(undefined);

  const total = entries.length;
  const current = entries[round];
  const tier = challengeTierForRound(round);
  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 100;
  const timerPct = tierTime > 0 ? Math.max(0, (timeLeft / tierTime) * 100) : 0;
  const timerColor =
    timerPct < 25
      ? "bg-red-500"
      : timerPct < 50
        ? "bg-amber-500"
        : "bg-[var(--app-primary)]";

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetRoundState = useCallback(() => {
    setSelected([]);
    setUsedOptIndices(new Set());
    setLocked(false);
    lockedRef.current = false;
    setRoundResult(null);
    setHintUsed(false);
    setLastGain({ total: 0, base: 0, speed: 0, streakBonus: 0 });
  }, []);

  const initRound = useCallback(
    (roundIndex: number, list: RadicalChallengeEntry[]) => {
      const entry = list[roundIndex];
      if (!entry) return;
      const nextTier = challengeTierForRound(roundIndex);
      resetRoundState();
      setRoundOptions(buildChallengeRoundOptions(entry, nextTier));
      setTierTime(nextTier.timeSeconds);
      setTimeLeft(nextTier.timeSeconds);
    },
    [resetRoundState]
  );

  useEffect(() => {
    if (entries.length === 0 || finished) return;
    if (round >= entries.length) {
      setFinished("win");
      return;
    }
    if (lives <= 0) {
      setFinished("lose");
      return;
    }
    initRound(round, entries);
  }, [round, entries, finished, lives, initRound]);

  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const handleTimeout = useCallback(() => {
    if (!currentRef.current || lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    setAttempts((a) => a + 1);
    setStreak(0);
    setLives((l) => {
      const next = l - 1;
      if (next <= 0) {
        window.setTimeout(() => setFinished("lose"), 700);
      }
      return next;
    });
    setRoundResult("timeout");
  }, []);

  useEffect(() => {
    if (finished || locked || !current || lives <= 0) {
      clearTimer();
      return;
    }

    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          if (!lockedRef.current) {
            handleTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [round, finished, locked, current, lives, clearTimer, handleTimeout]);

  function pickOption(optIndex: number) {
    if (locked || usedOptIndices.has(optIndex) || !current) return;
    const glyph = roundOptions[optIndex];
    if (!glyph) return;
    setSelected((prev) => [...prev, { c: glyph, optIndex }]);
    setUsedOptIndices((prev) => new Set(prev).add(optIndex));
    if (roundResult === "wrong") setRoundResult(null);
  }

  function unpickSlot(slotIndex: number) {
    if (locked || !current) return;
    const slot = selected[slotIndex];
    if (!slot) return;
    setSelected((prev) => prev.filter((_, i) => i !== slotIndex));
    setUsedOptIndices((prev) => {
      const next = new Set(prev);
      next.delete(slot.optIndex);
      return next;
    });
  }

  function resetSelection() {
    if (locked) return;
    setSelected([]);
    setUsedOptIndices(new Set());
    setRoundResult(null);
  }

  function useHint() {
    if (locked || hintUsed || !current) return;
    const firstAnswer = current.answer[0];
    const optIndex = roundOptions.indexOf(firstAnswer);
    if (optIndex < 0) return;

    setHintUsed(true);
    setScore((s) => Math.max(0, s - HINT_PENALTY));
    setSelected([{ c: firstAnswer, optIndex }]);
    setUsedOptIndices(new Set([optIndex]));
    setRoundResult("wrong");
  }

  function handleCheck() {
    if (locked || !current || selected.length === 0) return;

    const picked = selected.map((s) => s.c);
    const ok = isChallengeAnswerCorrect(picked, current.answer);
    setAttempts((a) => a + 1);

    if (ok) {
      clearTimer();
      lockedRef.current = true;
      setLocked(true);
      setCorrect((c) => c + 1);
      const gain = calculateChallengeScore(tier, timeLeft, streak);
      setLastGain(gain);
      setScore((s) => s + gain.total);
      setStreak((s) => s + 1);
      setRoundResult("ok");
      return;
    }

    setStreak(0);
    setScore((s) => Math.max(0, s - WRONG_PENALTY));
    setLives((l) => {
      const next = l - 1;
      if (next <= 0) {
        clearTimer();
        lockedRef.current = true;
        setLocked(true);
        window.setTimeout(() => setFinished("lose"), 700);
      }
      return next;
    });
    setRoundResult("wrong");
  }

  function handleNext() {
    if (round >= total - 1) {
      setFinished("win");
      return;
    }
    setRound((r) => r + 1);
  }

  function restart() {
    clearTimer();
    setRound(0);
    setScore(0);
    setStreak(0);
    setLives(MAX_LIVES);
    setAttempts(0);
    setCorrect(0);
    setFinished(null);
    setSaved(false);
    resetRoundState();
  }

  useEffect(() => {
    if (!finished || saved) return;
    const finalAccuracy =
      attempts > 0 ? Math.round((correct / attempts) * 100) : 100;
    saveGameResult({
      gameType: "radical-challenge",
      lessonId,
      score,
      correct,
      total,
      accuracy: finalAccuracy,
      playedAt: new Date().toISOString(),
    });
    setSaved(true);
  }, [finished, saved, attempts, correct, total, score, lessonId]);

  if (entries.length === 0) {
    return (
      <GameShell mainClassName="mx-auto w-full max-w-[430px] bg-[#f1f6f3] px-5 pt-6">
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">
          {formatActiveHskLevel(hskLevel)} түвшинд сорилтын ханз олдсонгүй.
        </p>
        <Link
          href="/games/radical"
          className="mx-auto block w-fit rounded-[14px] bg-[var(--app-primary)] px-5 py-3 text-sm font-extrabold text-white"
        >
          ← Энгийн горим
        </Link>
      </GameShell>
    );
  }

  if (finished) {
    const won = finished === "win";
    return (
      <GameShell mainClassName="mx-auto w-full max-w-[430px] bg-[#f1f6f3] px-5 pt-6 pb-8">
        <ChallengeHeader
          lives={lives}
          title={labels.radicalTitle}
          counter={won ? `${total} / ${total}` : "Дууслаа"}
          tierLabel={tier.label}
          tierClass={tier.badgeClass}
        />
        <div className="mb-3 h-[9px] overflow-hidden rounded-full bg-[#e1ebe5]">
          <div className="h-full w-full rounded-full bg-[var(--app-primary)]" />
        </div>
        <ChallengeStats score={score} streak={streak} accuracy={accuracy} />
        <div className="rounded-[22px] bg-white p-8 text-center shadow-[0_12px_30px_rgba(25,40,30,0.10)]">
          <p className="text-[52px] leading-none">{won ? "🏆" : "💪"}</p>
          <h2 className="mt-2 text-xl font-extrabold text-[var(--app-text)]">
            {won ? "Бүх ханз дууслаа!" : "Амь дууслаа"}
          </h2>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Оноо: <b className="text-[var(--app-text)]">{score}</b> · Нарийвчлал:{" "}
            <b className="text-[var(--app-text)]">{accuracy}%</b> · {correct}/
            {total} ханз
          </p>
          <button
            type="button"
            onClick={restart}
            className="mt-4 min-h-[48px] rounded-[14px] bg-[var(--app-primary)] px-6 py-3 text-[15px] font-extrabold text-white"
          >
            Дахин эхлэх
          </button>
        </div>
      </GameShell>
    );
  }

  if (!current) return null;

  const breakdown = entryToBreakdown(current);
  const hideNamesNote = !tier.showNames ? " · нэр нуугдсан" : "";
  const hanziRevealed = roundResult === "ok" || roundResult === "timeout";

  return (
    <GameShell mainClassName="mx-auto w-full max-w-[430px] bg-[#f1f6f3] px-[18px] pt-5 pb-8">
      <ChallengeHeader
        lives={lives}
        title={labels.radicalTitle}
        counter={`${round + 1} / ${total}`}
        tierLabel={tier.label}
        tierClass={tier.badgeClass}
      />

      <div className="mb-3 h-[9px] overflow-hidden rounded-full bg-[#e1ebe5]">
        <div
          className={`h-full rounded-full transition-all duration-1000 linear ${timerColor}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <ChallengeStats score={score} streak={streak} accuracy={accuracy} />

      <div className="mb-3 flex justify-end">
        {onExitChallenge ? (
          <button
            type="button"
            onClick={onExitChallenge}
            className="text-xs font-bold text-[var(--app-primary-dark)] underline"
          >
            ← Энгийн горим
          </button>
        ) : (
        <Link
          href="/games/radical"
          className="text-xs font-bold text-[var(--app-primary-dark)] underline"
        >
          ← Энгийн горим
        </Link>
        )}
      </div>

      <div className="rounded-[22px] bg-white p-4 shadow-[0_12px_30px_rgba(25,40,30,0.10)]">
        <RadicalHanziPanel
          entry={current}
          hideHanzi={hideHanzi}
          revealed={hanziRevealed}
          onToggleHide={() => setHideHanzi((h) => !h)}
          extraHint={hideNamesNote}
        />

        <p className="mt-3 text-[13px] font-extrabold text-[#33433b]">
          Бүрдэл хэсгүүдийг зөв дарааллаар нь сонго
        </p>

        <div className="flex min-h-[66px] flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#c6d4cc] bg-[#fbfffd] px-2.5 py-2.5">
          {selected.length === 0 ? (
            <span className="text-xs font-extrabold text-[#9fb0a7]">
              Бүрдлүүдийг энд дараалуулна
            </span>
          ) : (
            selected.map((slot, slotIndex) => (
              <span
                key={`${slot.c}-${slot.optIndex}-${slotIndex}`}
                className="inline-flex items-center gap-1.5"
              >
                <button
                  type="button"
                  onClick={() => unpickSlot(slotIndex)}
                  disabled={locked}
                  className="min-w-[46px] rounded-xl bg-[var(--app-primary-light)] px-2 py-1.5 text-2xl font-black disabled:opacity-60"
                >
                  {slot.c}
                </button>
                {slotIndex < selected.length - 1 ? (
                  <span className="font-black text-[#9fb0a7]">+</span>
                ) : null}
              </span>
            ))
          )}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {roundOptions.map((glyph, optIndex) => {
            const meta = getChallengeComponentMeta(glyph);
            const used = usedOptIndices.has(optIndex);
            return (
              <button
                key={`${glyph}-${optIndex}`}
                type="button"
                onClick={() => pickOption(optIndex)}
                disabled={locked || used}
                className="rounded-[15px] border border-[var(--app-border)] bg-white px-1.5 py-2.5 text-center shadow-[0_5px_13px_rgba(20,30,25,0.06)] transition active:scale-95 disabled:pointer-events-none disabled:opacity-30"
              >
                {tier.showIcons ? (
                  <span className="block text-xl">{meta.icon}</span>
                ) : null}
                <b className="block text-[22px] font-black">{glyph}</b>
                {tier.showNames ? (
                  <span className="block text-[10px] text-[var(--app-muted)]">
                    {meta.name}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={useHint}
            disabled={locked || hintUsed}
            className="shrink-0 rounded-[14px] bg-[#fff4e0] px-3.5 py-3 text-sm font-extrabold text-[#b9760a] disabled:opacity-50"
          >
            💡 −5
          </button>
          <button
            type="button"
            onClick={resetSelection}
            disabled={locked}
            className="min-h-[46px] flex-1 rounded-[14px] bg-[#eaf0ed] text-sm font-extrabold text-[#3b473f] disabled:opacity-50"
          >
            Цэвэр
          </button>
          <button
            type="button"
            onClick={handleCheck}
            disabled={locked || selected.length === 0}
            className="min-h-[46px] flex-1 rounded-[14px] bg-[var(--app-primary)] text-sm font-extrabold text-white disabled:opacity-50"
          >
            Шалгах
          </button>
        </div>

        {roundResult === "ok" ? (
          <div className="mt-3 rounded-2xl border border-[#b6e6c8] bg-[var(--app-primary-light)] p-3 leading-relaxed">
            <h3 className="text-[15px] font-bold">
              ✅ Зөв! +{lastGain.total}{" "}
              <span className="font-semibold text-[var(--app-muted)]">
                ({lastGain.base}+хурд {lastGain.speed}+цуваа {lastGain.streakBonus})
              </span>
            </h3>
            <div className="mt-2 rounded-xl border border-[var(--app-border)] bg-white p-2.5 text-[13px]">
              💡 {current.etymology_mn}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {breakdown.map((part, i) => (
                <div
                  key={`${part.c}-${i}`}
                  className="flex items-center gap-1.5 rounded-[11px] border border-[var(--app-border)] bg-white px-2 py-1.5 text-[13px]"
                >
                  <span className="text-lg" aria-hidden>
                    {part.icon}
                  </span>
                  <b className="text-[17px]">{part.c}</b>
                  <span className="text-[var(--app-muted)]">{part.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {roundResult === "wrong" && !hintUsed ? (
          <div className="mt-3 rounded-2xl border border-[#fbcfcf] bg-[#fef2f2] p-3">
            <h3 className="text-[15px] font-bold">❌ Буруу −1 ❤️ −5 оноо</h3>
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              Дахин оролдоорой (цаг үргэлжилж байна).
            </p>
          </div>
        ) : null}

        {roundResult === "wrong" && hintUsed ? (
          <div className="mt-3 rounded-2xl border border-[#fbcfcf] bg-[#fef2f2] p-3 text-sm">
            💡 Эхний бүрдлийг тавилаа (−5 оноо).
          </div>
        ) : null}

        {roundResult === "timeout" ? (
          <div className="mt-3 rounded-2xl border border-[#fbcfcf] bg-[#fef2f2] p-3">
            <h3 className="text-[15px] font-bold">⏰ Цаг дууслаа! −1 ❤️</h3>
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              Зөв хариу: <b>{current.answer.join(" + ")}</b>
            </p>
          </div>
        ) : null}

        {locked && roundResult !== "wrong" ? (
          <button
            type="button"
            onClick={handleNext}
            className="mt-3 min-h-[46px] w-full rounded-[14px] bg-[var(--app-primary)] text-[15px] font-extrabold text-white"
          >
            {round >= total - 1 ? "Дуусгах →" : "Дараагийн →"}
          </button>
        ) : null}
      </div>
    </GameShell>
  );
}

function ChallengeHeader({
  lives,
  title,
  counter,
  tierLabel,
  tierClass,
}: {
  lives: number;
  title: string;
  counter: string;
  tierLabel: string;
  tierClass: string;
}) {
  return (
    <>
      <div className="flex items-center justify-end">
        <span className="text-lg tracking-wide">
          {"❤️".repeat(Math.max(0, lives))}
          {"🖤".repeat(Math.max(0, MAX_LIVES - lives))}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-[19px] font-extrabold">
          🧩 {title}{" "}
          <span className="text-[13px] font-extrabold text-[var(--app-muted)]">
            {counter}
          </span>
        </h1>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-extrabold text-white ${tierClass}`}
        >
          {tierLabel}
        </span>
      </div>
    </>
  );
}

function ChallengeStats({
  score,
  streak,
  accuracy,
}: {
  score: number;
  streak: number;
  accuracy: number;
}) {
  return (
    <div className="mb-3.5 grid grid-cols-3 gap-2">
      {[
        { value: score, label: "Оноо" },
        { value: streak, label: "Цуваа 🔥" },
        { value: `${accuracy}%`, label: "Нарийвчлал" },
      ].map((stat) => (
        <div
          key={stat.label}
          className="rounded-[15px] bg-white px-1 py-2.5 text-center shadow-[0_12px_30px_rgba(25,40,30,0.10)]"
        >
          <b className="block text-xl font-bold text-[var(--app-primary-dark)]">
            {stat.value}
          </b>
          <span className="text-[10px] text-[var(--app-muted)]">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
