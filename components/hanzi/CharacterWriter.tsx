"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { localHanziCharDataLoader } from "@/lib/hanzi/character-data-loader";
import { HANZI_WRITING_LABELS } from "@/lib/hanzi/writing-practice";
import type { HskCharacter } from "@/types/hsk-lesson-package";

type PracticeMode =
  | "loading"
  | "ready"
  | "animating"
  | "quiz"
  | "success"
  | "unavailable";

type Props = {
  character: HskCharacter;
  /**
   * write = traced quiz (дагаж → санаж);
   * recognize = stroke animation only;
   * recall = шууд санаж бичих (жишээ, outline огт харуулахгүй)
   */
  mode: "write" | "recognize" | "recall";
  onComplete?: () => void;
  /**
   * Бичилт бүрэн дуусахад (сүүлийн ханзны дараа) бодит гүйцэтгэлийг
   * буцаана — бичих SRS-ийн автомат үнэлгээнд ашиглана.
   */
  onResult?: (result: { mistakes: number; usedHint: boolean }) => void;
};

const CJK_RE = /[㐀-鿿]/;

function MizigeGrid() {
  return (
    <svg
      className="bs-mizige-lines"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect x="0.5" y="0.5" width="99" height="99" fill="none" stroke="currentColor" strokeWidth="1" />
      <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" />
      <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2.5 3" opacity="0.65" />
      <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2.5 3" opacity="0.65" />
    </svg>
  );
}

function formatComponents(character: HskCharacter): string | null {
  const parts = character.components?.map((c) => c.c).filter(Boolean) ?? [];
  if (parts.length === 0) return null;
  return `${character.hanzi} = ${parts.join(" + ")}`;
}

export function CharacterWriter({ character, mode, onComplete, onResult }: Props) {
  const locale = useUiLocale();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const actionsRef = useRef<{
    quiz: () => void;
    animate: () => void;
    hint: () => void;
  } | null>(null);

  // Multi-character entries (words) are practiced one character at a time.
  const chars = useMemo(
    () =>
      Array.from((character.hanzi ?? "").replace(/\s/g, "")).filter((c) =>
        CJK_RE.test(c)
      ),
    [character.hanzi]
  );
  const [charIndex, setCharIndex] = useState(0);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("loading");
  /** write mode: trace = outline visible; memory = write from memory. */
  const [writePhase, setWritePhase] = useState<"trace" | "memory">("trace");
  const [strokeDone, setStrokeDone] = useState(0);
  const [strokeTotal, setStrokeTotal] = useState(0);
  /** Бүх ханзны туршид хуримтлагдсан буруу зураас + сануулга. */
  const mistakesRef = useRef(0);
  const usedHintRef = useRef(false);
  const resultSentRef = useRef(false);

  useEffect(() => {
    setCharIndex(0);
    mistakesRef.current = 0;
    usedHintRef.current = false;
    resultSentRef.current = false;
  }, [character.hanzi]);

  const safeIndex = Math.min(charIndex, Math.max(chars.length - 1, 0));
  const activeChar = chars[safeIndex] ?? null;
  const isLastChar = safeIndex >= chars.length - 1;
  const isSingleChar = chars.length === 1;

  const isLastCharRef = useRef(isLastChar);
  isLastCharRef.current = isLastChar;

  function emitResultIfDone() {
    if (!isLastCharRef.current || resultSentRef.current) return;
    resultSentRef.current = true;
    onResult?.({
      mistakes: mistakesRef.current,
      usedHint: usedHintRef.current,
    });
  }

  useEffect(() => {
    const mount = containerRef.current;
    if (!mount) return;

    if (!activeChar) {
      setPracticeMode("unavailable");
      return;
    }

    let cancelled = false;
    mount.innerHTML = "";
    setPracticeMode("loading");
    setWritePhase("trace");
    setStrokeDone(0);
    setStrokeTotal(0);

    const box = mount.parentElement;
    const measured = box?.clientWidth ?? 0;
    const size = measured > 80 ? Math.min(measured, 300) : 260;

    let writer: HanziWriter | null = null;

    function startQuiz(memory = false) {
      if (!writer || cancelled) return;
      const w = writer;
      w.cancelQuiz();
      void w.hideCharacter({ duration: 0 });
      if (memory) {
        void w.hideOutline({ duration: 0 });
      } else {
        void w.showOutline({ duration: 0 });
      }
      setWritePhase(memory ? "memory" : "trace");
      setStrokeDone(0);
      setPracticeMode("quiz");
      void w.quiz({
        leniency: memory ? 1.4 : 1.3,
        showHintAfterMisses: memory ? 3 : 2,
        markStrokeCorrectAfterMisses: memory ? 6 : 5,
        highlightOnComplete: true,
        onMistake: () => {
          // Дагаж бичих шат оноонд тооцогдохгүй — санах шат л хэмжигдэнэ.
          if (memory) mistakesRef.current += 1;
        },
        onCorrectStroke: (data) => {
          if (!cancelled) setStrokeDone(data.strokeNum + 1);
        },
        onComplete: () => {
          if (cancelled) return;
          if (!memory) {
            // Consolidation step: write the same character from memory.
            window.setTimeout(() => {
              if (!cancelled) startQuiz(true);
            }, 900);
          } else {
            setPracticeMode("success");
            emitResultIfDone();
          }
        },
      });
    }

    function startAnimation() {
      if (!writer || cancelled) return;
      const w = writer;
      w.cancelQuiz();
      setPracticeMode("animating");
      void w.hideCharacter({ duration: 0 });
      void w.animateCharacter({
        onComplete: (result?: { canceled?: boolean }) => {
          if (cancelled || result?.canceled) return;
          void w.showOutline({ duration: 0 });
          setPracticeMode("success");
        },
      });
    }

    writer = HanziWriter.create(mount, activeChar, {
      width: size,
      height: size,
      padding: Math.round(size * 0.07),
      // recall горимд хариулт (outline/ханз) урьдчилж огт харагдах ёсгүй
      showCharacter: false,
      showOutline: mode !== "recall",
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 350,
      drawingColor: "#059669",
      drawingWidth: 10,
      outlineColor: "#9ca3af",
      highlightColor: "#10b981",
      charDataLoader: localHanziCharDataLoader,
      onLoadCharDataSuccess: (data: unknown) => {
        if (cancelled) return;
        const total = Array.isArray((data as { strokes?: unknown[] })?.strokes)
          ? (data as { strokes: unknown[] }).strokes.length
          : 0;
        setStrokeTotal(total);
        setPracticeMode("ready");
        if (mode === "write") startQuiz();
        else if (mode === "recall") startQuiz(true);
        else startAnimation();
      },
      onLoadCharDataError: () => {
        if (!cancelled) setPracticeMode("unavailable");
      },
    });

    function showHint() {
      if (!writer || cancelled) return;
      usedHintRef.current = true;
      const w = writer;
      void w.showOutline({ duration: 150 });
      window.setTimeout(() => {
        if (!cancelled) void w.hideOutline({ duration: 300 });
      }, 1600);
    }

    actionsRef.current = {
      quiz: () => startQuiz(mode === "recall"),
      animate: startAnimation,
      hint: showHint,
    };

    return () => {
      cancelled = true;
      actionsRef.current = null;
      try {
        writer?.cancelQuiz();
      } catch {
        // writer may already be torn down
      }
      mount.innerHTML = "";
    };
  }, [activeChar, mode]);

  const decomposition = isSingleChar ? formatComponents(character) : null;
  const successLabel =
    mode === "recognize"
      ? tr(locale, HANZI_WRITING_LABELS.strokeOrder)
      : tr(locale, HANZI_WRITING_LABELS.success);

  return (
    <div className="bs-char-writer">
      {chars.length > 1 ? (
        <p className="bs-stroke-progress">
          {mode === "recall" ? "❓" : activeChar} · {safeIndex + 1}/
          {chars.length} {tr(locale, "ханз")}
        </p>
      ) : null}

      <div
        className="bs-mizige"
        aria-label={`${character.hanzi} ${tr(locale, HANZI_WRITING_LABELS.write)}`}
      >
        <MizigeGrid />
        {practiceMode === "loading" ? (
          <p className="bs-mizige-loading">{tr(locale, HANZI_WRITING_LABELS.loading)}</p>
        ) : null}
        {practiceMode === "unavailable" ? (
          <p className="bs-mizige-loading">{tr(locale, HANZI_WRITING_LABELS.unavailable)}</p>
        ) : null}
        <div
          ref={containerRef}
          className="bs-mizige-canvas"
          style={
            practiceMode === "loading" || practiceMode === "unavailable"
              ? { visibility: "hidden" }
              : undefined
          }
        />
      </div>

      {(mode === "write" || mode === "recall") && practiceMode === "quiz" ? (
        <p
          className="bs-stroke-progress"
          style={
            writePhase === "memory"
              ? { color: "#b45309", fontWeight: 700 }
              : undefined
          }
        >
          {mode === "recall"
            ? tr(locale, "🧠 Санаж бич")
            : writePhase === "trace"
              ? tr(locale, "1/2 · Дагаж бич")
              : tr(locale, "2/2 · Санаж бич — жишээгүй!")}
          {strokeTotal > 0
            ? ` · ${strokeDone}/${strokeTotal} ${tr(locale, "зураас")}`
            : ""}
        </p>
      ) : null}

      {mode === "recall" && practiceMode === "quiz" ? (
        <button
          type="button"
          className="bs-cta bs-cta-muted"
          onClick={() => actionsRef.current?.hint()}
        >
          {tr(locale, "💡 Сануулга харах")}
        </button>
      ) : null}

      {practiceMode === "success" && (mode === "write" || mode === "recall") ? (
        <p className="bs-stroke-success">{successLabel}</p>
      ) : null}

      <dl className="bs-char-meta">
        {isSingleChar && character.radical ? (
          <>
            <dt>{tr(locale, HANZI_WRITING_LABELS.radical)}</dt>
            <dd>{character.radical}</dd>
          </>
        ) : null}
        {strokeTotal > 0 ? (
          <>
            <dt>{tr(locale, HANZI_WRITING_LABELS.strokeCount)}</dt>
            <dd>{strokeTotal}</dd>
          </>
        ) : null}
        {decomposition ? (
          <>
            <dt>{tr(locale, HANZI_WRITING_LABELS.components)}</dt>
            <dd className="bs-char-decomp">{decomposition}</dd>
          </>
        ) : null}
      </dl>

      {practiceMode === "success" && !isLastChar ? (
        <button
          type="button"
          className="bs-cta"
          onClick={() => setCharIndex(safeIndex + 1)}
        >
          {tr(locale, HANZI_WRITING_LABELS.nextCharacter)}
        </button>
      ) : null}

      {practiceMode === "success" && isLastChar && onComplete ? (
        <button type="button" className="bs-cta" onClick={onComplete}>
          {tr(locale, HANZI_WRITING_LABELS.done)}
        </button>
      ) : null}

      {practiceMode === "unavailable" && onComplete ? (
        <button
          type="button"
          className="bs-cta bs-cta-muted"
          onClick={onComplete}
        >
          {tr(locale, HANZI_WRITING_LABELS.done)}
        </button>
      ) : null}

      {mode === "recognize" &&
      (practiceMode === "success" || practiceMode === "ready") ? (
        <button
          type="button"
          className="bs-cta bs-cta-muted"
          onClick={() => actionsRef.current?.animate()}
        >
          {tr(locale, HANZI_WRITING_LABELS.watchStrokes)}
        </button>
      ) : null}

      {(mode === "write" || mode === "recall") && practiceMode === "success" ? (
        <button
          type="button"
          className="bs-cta bs-cta-muted"
          onClick={() => actionsRef.current?.quiz()}
        >
          {tr(locale, HANZI_WRITING_LABELS.retry)}
        </button>
      ) : null}
    </div>
  );
}
