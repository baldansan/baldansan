"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import { localHanziCharDataLoader } from "@/lib/hanzi/character-data-loader";
import { HANZI_WRITING_LABELS } from "@/lib/hanzi/writing-practice";
import type { HskCharacter } from "@/types/hsk-lesson-package";

type PracticeMode = "loading" | "ready" | "animating" | "quiz" | "success" | "unavailable";

type Props = {
  character: HskCharacter;
  /** write = traced quiz; recognize = stroke animation only */
  mode: "write" | "recognize";
  onComplete?: () => void;
};

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

export function CharacterWriter({ character, mode, onComplete }: Props) {
  const containerId = useId().replace(/:/g, "");
  const writerRef = useRef<HanziWriter | null>(null);
  const startedRef = useRef(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("loading");
  const [strokeDone, setStrokeDone] = useState(0);
  const [strokeTotal, setStrokeTotal] = useState(character.strokeCount ?? 0);

  const resetWriterSurface = useCallback(async (writer: HanziWriter) => {
    writer.cancelQuiz();
    await writer.hideCharacter({ duration: 0 });
    await writer.showOutline({ duration: 0 });
  }, []);

  const startRecognizeAnimation = useCallback(
    async (writer: HanziWriter) => {
      writer.cancelQuiz();
      setPracticeMode("animating");
      await writer.animateCharacter({
        onComplete: () => {
          void resetWriterSurface(writer);
          setPracticeMode("success");
        },
      });
    },
    [resetWriterSurface]
  );

  const startWriteQuiz = useCallback(
    async (writer: HanziWriter) => {
      writer.cancelQuiz();
      await resetWriterSurface(writer);
      setStrokeDone(0);
      setPracticeMode("quiz");
      await writer.quiz({
        showHintAfterMisses: 3,
        highlightOnComplete: true,
        onCorrectStroke: (data) => {
          setStrokeDone(data.strokeNum + 1);
          if (data.strokesRemaining === 0 && strokeTotal === 0) {
            setStrokeTotal(data.strokeNum + 1);
          }
        },
        onComplete: () => setPracticeMode("success"),
      });
    },
    [resetWriterSurface, strokeTotal]
  );

  useEffect(() => {
    let cancelled = false;
    writerRef.current = null;
    startedRef.current = false;
    setPracticeMode("loading");
    setStrokeDone(0);
    setStrokeTotal(character.strokeCount ?? 0);

    async function init() {
      try {
        const mount = document.getElementById(containerId);
        if (!mount) return;
        mount.innerHTML = "";

        const writer = HanziWriter.create(mount, character.hanzi, {
          width: 260,
          height: 260,
          padding: 18,
          showOutline: true,
          strokeAnimationSpeed: 1,
          drawingColor: "#059669",
          outlineColor: "#9ca3af",
          highlightColor: "#10b981",
          charDataLoader: localHanziCharDataLoader,
        });

        const data = await HanziWriter.loadCharacterData(character.hanzi, {
          charDataLoader: localHanziCharDataLoader,
        });

        if (cancelled) return;

        const totalFromData =
          data && typeof data === "object" && Array.isArray((data as { strokes?: unknown }).strokes)
            ? (data as { strokes: unknown[] }).strokes.length
            : 0;
        if (totalFromData > 0) setStrokeTotal(totalFromData);

        await resetWriterSurface(writer);
        if (cancelled) return;

        writerRef.current = writer;
        setPracticeMode("ready");

        if (!startedRef.current) {
          startedRef.current = true;
          if (mode === "write") {
            await startWriteQuiz(writer);
          } else {
            await startRecognizeAnimation(writer);
          }
        }
      } catch {
        if (!cancelled) setPracticeMode("unavailable");
      }
    }

    void init();

    return () => {
      cancelled = true;
      writerRef.current?.cancelQuiz();
      writerRef.current = null;
    };
  }, [
    character.hanzi,
    character.strokeCount,
    containerId,
    mode,
    resetWriterSurface,
    startRecognizeAnimation,
    startWriteQuiz,
  ]);

  const decomposition = formatComponents(character);
  const totalStrokes = strokeTotal > 0 ? strokeTotal : character.strokeCount ?? 0;
  const showStrokeProgress = mode === "write" && practiceMode === "quiz" && totalStrokes > 0;

  return (
    <div className="bs-char-writer">
      <div className="bs-mizige" aria-label={`${character.hanzi} ${HANZI_WRITING_LABELS.write}`}>
        <MizigeGrid />
        {practiceMode === "loading" ? (
          <p className="bs-mizige-loading">{HANZI_WRITING_LABELS.loading}</p>
        ) : practiceMode === "unavailable" ? (
          <p className="bs-mizige-loading">{HANZI_WRITING_LABELS.unavailable}</p>
        ) : (
          <div id={containerId} className="bs-mizige-canvas" />
        )}
      </div>

      {showStrokeProgress ? (
        <p className="bs-stroke-progress">
          {strokeDone} / {totalStrokes} зураас
        </p>
      ) : null}

      {practiceMode === "success" ? (
        <p className="bs-stroke-success">{HANZI_WRITING_LABELS.success}</p>
      ) : null}

      <dl className="bs-char-meta">
        {character.radical ? (
          <>
            <dt>{HANZI_WRITING_LABELS.radical}</dt>
            <dd>{character.radical}</dd>
          </>
        ) : null}
        {(character.strokeCount ?? totalStrokes) > 0 ? (
          <>
            <dt>{HANZI_WRITING_LABELS.strokeCount}</dt>
            <dd>{character.strokeCount ?? totalStrokes}</dd>
          </>
        ) : null}
        {decomposition ? (
          <>
            <dt>{HANZI_WRITING_LABELS.components}</dt>
            <dd className="bs-char-decomp">{decomposition}</dd>
          </>
        ) : null}
      </dl>

      {practiceMode === "success" && onComplete ? (
        <button type="button" className="bs-cta" onClick={onComplete}>
          {HANZI_WRITING_LABELS.nextCharacter}
        </button>
      ) : null}

      {practiceMode === "unavailable" && onComplete ? (
        <button type="button" className="bs-cta bs-cta-muted" onClick={onComplete}>
          {HANZI_WRITING_LABELS.done}
        </button>
      ) : null}

      {mode === "recognize" && practiceMode === "ready" ? (
        <button
          type="button"
          className="bs-cta bs-cta-muted"
          onClick={() => {
            const writer = writerRef.current;
            if (writer) void startRecognizeAnimation(writer);
          }}
        >
          {HANZI_WRITING_LABELS.watchStrokes}
        </button>
      ) : null}

      {mode === "write" && practiceMode === "success" ? (
        <button
          type="button"
          className="bs-cta bs-cta-muted"
          onClick={() => {
            const writer = writerRef.current;
            if (writer) void startWriteQuiz(writer);
          }}
        >
          {HANZI_WRITING_LABELS.retry}
        </button>
      ) : null}
    </div>
  );
}
