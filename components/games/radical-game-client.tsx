"use client";

import { useCallback, useMemo, useState } from "react";
import { GameShell } from "@/components/games/game-shell";
import {
  getRadicalGameEntries,
  isAnswerCorrect,
  orderHintFromStructure,
  scoreForAttempt,
  type RadicalGameEntry,
} from "@/lib/games/radical-game-data";
import { resolveGameLabels, type GameLabels } from "@/lib/games/game-lesson-meta";
import { saveGameResult } from "@/lib/games/game-progress";

type Props = {
  lessonId: string;
  entries?: RadicalGameEntry[];
  labels?: GameLabels;
};

type SelectedSlot = {
  c: string;
  componentIndex: number;
};

type CheckResult = "ok" | "no" | null;

export function RadicalGameClient({
  lessonId,
  entries: entriesProp,
  labels: labelsProp,
}: Props) {
  const labels = labelsProp ?? resolveGameLabels(false, false);
  const entries = useMemo(
    () => entriesProp ?? getRadicalGameEntries(),
    [entriesProp]
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<SelectedSlot[]>([]);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [locked, setLocked] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult>(null);
  const [missedOnChar, setMissedOnChar] = useState(false);
  const [lastGain, setLastGain] = useState(0);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = entries.length;
  const current = entries[index];
  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 100;
  const progressPct = finished ? 100 : Math.round((index / total) * 100);

  const resetSelection = useCallback(() => {
    setSelected([]);
    setUsedIndices(new Set());
    setCheckResult(null);
    setMissedOnChar(false);
    setLastGain(0);
    setLocked(false);
  }, []);

  const resetRound = useCallback(() => {
    resetSelection();
  }, [resetSelection]);

  function pickComponent(componentIndex: number) {
    if (locked || !current || usedIndices.has(componentIndex)) return;
    const comp = current.components[componentIndex];
    if (!comp) return;
    setSelected((prev) => [...prev, { c: comp.c, componentIndex }]);
    setUsedIndices((prev) => new Set(prev).add(componentIndex));
    setCheckResult(null);
  }

  function unpickSlot(slotIndex: number) {
    if (locked || !current) return;
    const slot = selected[slotIndex];
    if (!slot) return;
    setSelected((prev) => prev.filter((_, i) => i !== slotIndex));
    setUsedIndices((prev) => {
      const next = new Set(prev);
      next.delete(slot.componentIndex);
      return next;
    });
    setCheckResult(null);
  }

  function handleCheck() {
    if (locked || !current || selected.length === 0) return;

    const picked = selected.map((s) => s.c);
    const ok = isAnswerCorrect(picked, current.answer);
    setAttempts((a) => a + 1);

    if (ok) {
      const firstTry = !missedOnChar;
      const gain = scoreForAttempt(firstTry);
      setCorrect((c) => c + 1);
      setScore((s) => s + gain);
      setStreak(firstTry ? (s) => s + 1 : () => 0);
      setLastGain(gain);
      setLocked(true);
      setCheckResult("ok");
    } else {
      setMissedOnChar(true);
      setStreak(0);
      setCheckResult("no");
    }
  }

  function handleNext() {
    if (index >= total - 1) {
      finishGame();
      return;
    }
    setIndex((i) => i + 1);
    resetRound();
  }

  function finishGame() {
    const finalAccuracy =
      attempts > 0 ? Math.round((correct / attempts) * 100) : 100;
    saveGameResult({
      gameType: "radical",
      lessonId,
      score,
      correct,
      total,
      accuracy: finalAccuracy,
      playedAt: new Date().toISOString(),
    });
    setFinished(true);
  }

  function restart() {
    setIndex(0);
    setScore(0);
    setStreak(0);
    setAttempts(0);
    setCorrect(0);
    setFinished(false);
    resetRound();
  }

  if (entries.length === 0) {
    return (
      <GameShell mainClassName="max-w-[430px] mx-auto w-full bg-[#f1f6f3]">
        <div className="py-16 text-center text-sm text-[var(--app-muted)]">
          Тоглоомын өгөгдөл олдсонгүй.
        </div>
      </GameShell>
    );
  }

  if (finished) {
    return (
      <GameShell mainClassName="max-w-[430px] mx-auto w-full bg-[#f1f6f3] px-5 pt-6">
        <RadicalGameTop title={labels.radicalTitle} counter={`${total} / ${total}`} />
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#e1ebe5]">
          <div className="h-full w-full rounded-full bg-[var(--app-primary)] transition-all" />
        </div>
        <RadicalGameStats score={score} streak={streak} accuracy={accuracy} />
        <div className="rounded-[24px] bg-white p-10 text-center shadow-[0_12px_30px_rgba(25,40,30,0.10)]">
          <p className="text-[54px] leading-none">🏆</p>
          <h2 className="mt-2 text-xl font-extrabold text-[var(--app-text)]">
            Бүх ханз дууслаа!
          </h2>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Оноо: <b className="text-[var(--app-text)]">{score}</b> · Нарийвчлал:{" "}
            <b className="text-[var(--app-text)]">{accuracy}%</b>
          </p>
          <button
            type="button"
            onClick={restart}
            className="mt-4 min-h-[48px] w-full max-w-[200px] rounded-[15px] bg-[var(--app-primary)] px-5 py-3 text-[15px] font-extrabold text-white active:bg-[var(--app-primary-dark)]"
          >
            Дахин эхлэх
          </button>
        </div>
      </GameShell>
    );
  }

  if (!current) return null;

  return (
    <GameShell mainClassName="max-w-[430px] mx-auto w-full bg-[#f1f6f3] px-5 pt-6 pb-8">
      <RadicalGameTop
        title={labels.radicalTitle}
        counter={`${index + 1} / ${total}`}
      />

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#e1ebe5]">
        <div
          className="h-full rounded-full bg-[var(--app-primary)] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <RadicalGameStats score={score} streak={streak} accuracy={accuracy} />

      <div className="rounded-[24px] bg-white p-[18px] shadow-[0_12px_30px_rgba(25,40,30,0.10)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="font-[family-name:var(--font-noto-sc,'Noto Sans SC',sans-serif)] text-[74px] font-black leading-none tracking-[4px] text-[var(--app-text)]">
              {current.char}
            </p>
            <div>
              <p className="text-xl font-bold text-[var(--app-text)]">
                {current.pinyin}
              </p>
              <p className="mt-1 text-sm text-[var(--app-muted)]">
                {current.meaning_mn}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--app-primary-light)] px-[11px] py-1.5 text-[11px] font-extrabold text-[var(--app-primary-dark)]">
            Шинэ
          </span>
        </div>

        <p className="mt-3.5 text-sm font-extrabold text-[#33433b]">
          Бүрдэл хэсгүүдийг зөв дарааллаар нь сонго
        </p>
        <p className="mt-1 mb-2.5 text-xs text-[var(--app-muted)]">
          Дараалал: {orderHintFromStructure(current.structure)}
        </p>

        <div className="flex min-h-[78px] flex-wrap items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[#c6d4cc] bg-[#fbfffd] px-3 py-3">
          {selected.length === 0 ? (
            <span className="text-[13px] font-extrabold text-[#9fb0a7]">
              Бүрдлүүдийг энд дараалуулна
            </span>
          ) : (
            selected.map((slot, slotIndex) => (
              <span key={`${slot.c}-${slot.componentIndex}-${slotIndex}`} className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => unpickSlot(slotIndex)}
                  disabled={locked}
                  className="min-w-[52px] rounded-[14px] border border-[#d6eadf] bg-[var(--app-primary-light)] px-[11px] py-2 text-[26px] font-black text-[var(--app-text)] disabled:opacity-60"
                >
                  {slot.c}
                </button>
                {slotIndex < selected.length - 1 ? (
                  <span className="text-lg font-black text-[#9fb0a7]">+</span>
                ) : null}
              </span>
            ))
          )}
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          {current.components.map((comp, compIndex) => {
            const used = usedIndices.has(compIndex);
            return (
              <button
                key={`${comp.c}-${compIndex}`}
                type="button"
                onClick={() => pickComponent(compIndex)}
                disabled={locked || used}
                className={`flex items-center gap-[11px] rounded-[18px] border border-[var(--app-border)] bg-white px-3 py-3 text-left shadow-[0_6px_16px_rgba(20,30,25,0.06)] transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-30`}
              >
                <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] bg-[var(--app-primary-light)] text-[23px]">
                  {comp.icon}
                </span>
                <span className="min-w-0">
                  <b className="block text-xl font-black text-[var(--app-text)]">
                    {comp.c}
                  </b>
                  <span className="block text-[11px] text-[var(--app-muted)]">
                    {comp.name}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3.5 flex gap-2.5">
          <button
            type="button"
            onClick={resetSelection}
            disabled={locked}
            className="min-h-[48px] flex-1 rounded-[15px] bg-[#eaf0ed] px-4 py-3 text-[15px] font-extrabold text-[#3b473f] disabled:opacity-50"
          >
            Цэвэрлэх
          </button>
          <button
            type="button"
            onClick={handleCheck}
            disabled={locked || selected.length === 0}
            className="min-h-[48px] flex-1 rounded-[15px] bg-[var(--app-primary)] px-4 py-3 text-[15px] font-extrabold text-white active:bg-[var(--app-primary-dark)] disabled:opacity-50"
          >
            Шалгах
          </button>
        </div>

        {checkResult === "ok" ? (
          <div className="mt-3.5 rounded-[18px] border border-[#b6e6c8] bg-[var(--app-primary-light)] p-[15px] leading-relaxed">
            <h3 className="text-base font-bold text-[var(--app-text)]">
              ✅ Зөв! +{lastGain} оноо
            </h3>
            <div className="mt-2.5 rounded-[14px] border border-[var(--app-border)] bg-white p-3 text-sm">
              💡 <b>{current.char}</b> ({current.pinyin}) — {current.meaning_mn}
              <br />
              {current.etymology_mn}
            </div>
            <div className="mt-2.5 grid gap-2">
              {current.breakdown.map((part, i) => (
                <div
                  key={`${part.c}-${i}`}
                  className="flex items-center gap-[11px] rounded-[13px] border border-[var(--app-border)] bg-white px-[11px] py-2"
                >
                  <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-[var(--app-primary-light)] text-xl">
                    {part.icon}
                  </span>
                  <div>
                    <b className="text-[19px] text-[var(--app-text)]">{part.c}</b>
                    <small className="ml-2 text-[var(--app-muted)]">{part.name}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {checkResult === "no" ? (
          <div className="mt-3.5 rounded-[18px] border border-[#fbcfcf] bg-[#fef2f2] p-[15px] leading-relaxed">
            <h3 className="text-base font-bold text-[var(--app-text)]">
              ❌ Дараалал/бүрдэл буруу
            </h3>
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              Илүү (хууран мэхлэх) бүрдлийг хасаад, зөв хэсгүүдийг дарааллаар нь
              сонгоорой.
            </p>
          </div>
        ) : null}

        {checkResult === "ok" ? (
          <button
            type="button"
            onClick={handleNext}
            className="mt-3 min-h-[48px] w-full rounded-[15px] bg-[var(--app-primary)] px-4 py-3 text-[15px] font-extrabold text-white active:bg-[var(--app-primary-dark)]"
          >
            {index >= total - 1 ? "Дуусгах →" : "Дараагийн ханз →"}
          </button>
        ) : null}
      </div>
    </GameShell>
  );
}

function RadicalGameTop({
  title,
  counter,
}: {
  title: string;
  counter: string;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between">
      <h1 className="text-xl font-extrabold text-[var(--app-text)]">🧩 {title}</h1>
      <span className="rounded-full bg-[var(--app-primary-light)] px-[11px] py-1.5 text-[11px] font-extrabold text-[var(--app-primary-dark)]">
        {counter}
      </span>
    </div>
  );
}

function RadicalGameStats({
  score,
  streak,
  accuracy,
}: {
  score: number;
  streak: number;
  accuracy: number;
}) {
  return (
    <div className="mb-4 grid grid-cols-3 gap-2.5">
      {[
        { value: score, label: "Оноо" },
        { value: streak, label: "Цуваа 🔥" },
        { value: `${accuracy}%`, label: "Нарийвчлал" },
      ].map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl bg-white px-1.5 py-3 text-center shadow-[0_12px_30px_rgba(25,40,30,0.10)]"
        >
          <b className="block text-[22px] font-bold leading-tight text-[var(--app-primary-dark)]">
            {stat.value}
          </b>
          <span className="text-[11px] text-[var(--app-muted)]">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
