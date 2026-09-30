"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  START_LIVES,
  comboMultiplier,
  isComboMilestone,
  isSfxMuted,
  playSfx,
  scoreCorrect,
  setSfxMuted,
  type AnswerOutcome,
} from "@/lib/games/game-fx";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import "./game-juice.css";

export type ReactionKind = "correct" | "wrong" | "combo" | null;

export type JuiceState = {
  lives: number;
  combo: number;
  bestCombo: number;
  reaction: ReactionKind;
  lastOutcome: AnswerOutcome | null;
  shake: boolean;
};

/**
 * Тоглоомын нэг асуултын мөчлөг: newQuestion() → answer(correct) → {points…}.
 * Зүрх (lives), combo, хурдны урамшуулал, дуу, Тэмээгийн хариу үйлдлийг нэг дор удирдана.
 */
export function useGameJuice(options?: { lives?: boolean }) {
  const useLives = options?.lives ?? true;
  const [state, setState] = useState<JuiceState>({
    lives: START_LIVES,
    combo: 0,
    bestCombo: 0,
    reaction: null,
    lastOutcome: null,
    shake: false,
  });
  const questionStartRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  // Синхрон тооцоолол — setState-ийн updater дотор биш (React batching).
  const comboRef = useRef(0);
  const livesRef = useRef(START_LIVES);
  const bestComboRef = useRef(0);

  const newQuestion = useCallback(() => {
    questionStartRef.current = performance.now();
  }, []);

  useEffect(() => {
    questionStartRef.current = performance.now();
  }, []);

  const clearReactionLater = useCallback((ms: number) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setState((s) => ({ ...s, reaction: null, shake: false, lastOutcome: null }));
    }, ms);
  }, []);

  /** Хариулт бүрд дуудна. Буцаах: оноо, шинэ combo, үлдсэн зүрх. */
  const answer = useCallback(
    (correct: boolean): AnswerOutcome & { lives: number; outOfLives: boolean } => {
      const elapsed = performance.now() - (questionStartRef.current || performance.now());
      if (correct) {
        const combo = comboRef.current + 1;
        comboRef.current = combo;
        bestComboRef.current = Math.max(bestComboRef.current, combo);
        const outcome = scoreCorrect(combo, elapsed);
        const milestone = isComboMilestone(combo);
        playSfx(milestone ? "combo" : "correct");
        if (outcome.speedBonus > 0 && !milestone) playSfx("bonus");
        setState((s) => ({
          ...s,
          combo,
          bestCombo: bestComboRef.current,
          reaction: milestone ? "combo" : "correct",
          lastOutcome: outcome,
          shake: false,
        }));
        clearReactionLater(1400);
        return { ...outcome, lives: livesRef.current, outOfLives: false };
      }
      comboRef.current = 0;
      if (useLives) livesRef.current = Math.max(0, livesRef.current - 1);
      const lives = livesRef.current;
      const outOfLives = useLives && lives === 0;
      playSfx(outOfLives ? "heart" : "wrong");
      setState((s) => ({ ...s, combo: 0, lives, reaction: "wrong", lastOutcome: null, shake: true }));
      clearReactionLater(900);
      return { points: 0, multiplier: 1, speedBonus: 0, combo: 0, lives, outOfLives };
    },
    [useLives, clearReactionLater]
  );

  const reset = useCallback(() => {
    comboRef.current = 0;
    livesRef.current = START_LIVES;
    bestComboRef.current = 0;
    setState({ lives: START_LIVES, combo: 0, bestCombo: 0, reaction: null, lastOutcome: null, shake: false });
    questionStartRef.current = performance.now();
  }, []);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  return { ...state, multiplier: comboMultiplier(state.combo), newQuestion, answer, reset };
}

/* ---------------- UI ---------------- */

export function HeartsRow({ lives }: { lives: number }) {
  return (
    <span className="bs-gj-hearts" aria-label={`${lives} зүрх`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`bs-gj-heart${i < lives ? "" : " bs-gj-heart--lost"}`} aria-hidden>
          ♥
        </span>
      ))}
    </span>
  );
}

export function ComboBadge({ combo, multiplier }: { combo: number; multiplier: number }) {
  const locale = useUiLocale();
  if (combo < 2) return null;
  return (
    <span key={combo} className={`bs-gj-combo${multiplier > 1 ? " bs-gj-combo--hot" : ""}`}>
      🔥 {tr(locale, "Combo")} {combo}
      {multiplier > 1 ? <b>×{multiplier}</b> : null}
    </span>
  );
}

/** Оноо, зүрх, combo — GameHeader-ийн доор нэг мөр. */
export function JuiceBar({
  lives,
  combo,
  multiplier,
  showLives = true,
}: {
  lives: number;
  combo: number;
  multiplier: number;
  showLives?: boolean;
}) {
  return (
    <div className="bs-gj-bar">
      {showLives ? <HeartsRow lives={lives} /> : <span />}
      <ComboBadge combo={combo} multiplier={multiplier} />
      <SfxToggle />
    </div>
  );
}

/** Хариултын дараах хөвөгч мэдээ: +20 ×2 · ⚡ Хурдан! */
export function PointsPop({ outcome }: { outcome: AnswerOutcome | null }) {
  const locale = useUiLocale();
  if (!outcome) return null;
  return (
    <div className="bs-gj-pop" key={`${outcome.combo}-${outcome.points}`} aria-live="polite">
      <span className="bs-gj-pop-points">+{outcome.points}</span>
      {outcome.multiplier > 1 ? <span className="bs-gj-pop-mult">×{outcome.multiplier}</span> : null}
      {outcome.speedBonus > 0 ? <span className="bs-gj-pop-speed">⚡ {tr(locale, "Хурдан!")}</span> : null}
    </div>
  );
}

const TEMEE_SRC: Record<Exclude<ReactionKind, null>, string> = {
  correct: "/temee/temee-thumbsup.png",
  combo: "/temee/temee-hero.png",
  wrong: "/temee/temee-think.png",
};

/** Тэмээ багшийн хариу үйлдэл — картын дэргэд гарч ирээд алга болно. */
export function TemeeReaction({ reaction }: { reaction: ReactionKind }) {
  const locale = useUiLocale();
  if (!reaction) return null;
  const text =
    reaction === "combo"
      ? tr(locale, "Гайхалтай цуваа!")
      : reaction === "correct"
        ? tr(locale, "Зөв!")
        : tr(locale, "Дахиад бод…");
  return (
    <div className={`bs-gj-temee bs-gj-temee--${reaction}`} key={reaction} aria-hidden>
      <Image src={TEMEE_SRC[reaction]} alt="" width={64} height={64} className="bs-gj-temee-img" />
      <span className="bs-gj-temee-bubble">{text}</span>
    </div>
  );
}

export function SfxToggle() {
  const locale = useUiLocale();
  const [muted, setMuted] = useState(false);
  useEffect(() => setMuted(isSfxMuted()), []);
  return (
    <button
      type="button"
      className="bs-gj-sfx"
      aria-pressed={!muted}
      title={tr(locale, muted ? "Дуу асаах" : "Дуу унтраах")}
      onClick={() => {
        const next = !muted;
        setMuted(next);
        setSfxMuted(next);
        if (!next) playSfx("correct");
      }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

/** Зүрх дууссан үеийн дэлгэц. */
export function OutOfLivesCard({ onRetry, correct, total }: { onRetry: () => void; correct: number; total: number }) {
  const locale = useUiLocale();
  return (
    <div className="app-card p-6 text-center">
      <div className="bs-gj-hearts bs-gj-hearts--big" aria-hidden>
        <span className="bs-gj-heart bs-gj-heart--lost">♥</span>
        <span className="bs-gj-heart bs-gj-heart--lost">♥</span>
        <span className="bs-gj-heart bs-gj-heart--lost">♥</span>
      </div>
      <p className="mt-3 text-lg font-bold text-[var(--app-text)]">{tr(locale, "Зүрх дууслаа")}</p>
      <p className="mt-1 text-sm text-[var(--app-muted)]">
        {correct}/{total} {tr(locale, "зөв")} · {tr(locale, "3 буруу хариулт — дахин оролдоорой")}
      </p>
      <button type="button" onClick={onRetry} className="app-btn-game mt-5 w-full">
        {tr(locale, "Дахин оролдох")}
      </button>
    </div>
  );
}
