"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import { localHanziCharDataLoader } from "@/lib/hanzi/character-data-loader";
import { HANZI_WRITING_LABELS } from "@/lib/hanzi/writing-practice";

type PracticeMode = "idle" | "animating" | "quiz" | "success";

type Props = {
  character: string;
  strokeOrderImageUrl?: string;
  onDone?: () => void;
  onNextCharacter?: () => void;
  hasNextCharacter?: boolean;
};

export function HanziWriterPractice({
  character,
  strokeOrderImageUrl,
  onDone,
  onNextCharacter,
  hasNextCharacter = false,
}: Props) {
  const containerId = useId().replace(/:/g, "");
  const writerRef = useRef<HanziWriter | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataAvailable, setDataAvailable] = useState<boolean | null>(null);
  const [mode, setMode] = useState<PracticeMode>("idle");

  const resetWriterSurface = useCallback(async (writer: HanziWriter) => {
    writer.cancelQuiz();
    await writer.hideCharacter({ duration: 0 });
    await writer.showOutline({ duration: 0 });
  }, []);

  useEffect(() => {
    let cancelled = false;
    writerRef.current = null;
    setLoading(true);
    setDataAvailable(null);
    setMode("idle");

    async function init() {
      try {
        await HanziWriter.loadCharacterData(character, {
          charDataLoader: localHanziCharDataLoader,
        });
        if (cancelled) return;

        const mount = document.getElementById(containerId);
        if (!mount) return;
        mount.innerHTML = "";

        const writer = HanziWriter.create(mount, character, {
          width: 280,
          height: 280,
          padding: 20,
          showOutline: true,
          strokeAnimationSpeed: 1,
          drawingColor: "#059669",
          drawingWidth: 10,
          outlineColor: "#d1d5db",
          highlightColor: "#10b981",
          charDataLoader: localHanziCharDataLoader,
        });

        await resetWriterSurface(writer);
        if (cancelled) return;

        writerRef.current = writer;
        setDataAvailable(true);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setDataAvailable(false);
          setLoading(false);
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      writerRef.current?.cancelQuiz();
      writerRef.current = null;
    };
  }, [character, containerId, resetWriterSurface]);

  async function handleWatchStrokes() {
    const writer = writerRef.current;
    if (!writer) return;
    writer.cancelQuiz();
    setMode("animating");
    await writer.animateCharacter({
      onComplete: (result?: { canceled?: boolean }) => {
        if (result?.canceled) return;
        void resetWriterSurface(writer);
        setMode("idle");
      },
    });
  }

  async function handleTraceWrite() {
    const writer = writerRef.current;
    if (!writer) return;
    writer.cancelQuiz();
    await resetWriterSurface(writer);
    setMode("quiz");
    await writer.quiz({
      leniency: 1.3,
      showHintAfterMisses: 2,
      markStrokeCorrectAfterMisses: 5,
      highlightOnComplete: true,
      onComplete: () => setMode("success"),
    });
  }

  async function handleRetry() {
    const writer = writerRef.current;
    if (!writer) return;
    await resetWriterSurface(writer);
    setMode("idle");
  }

  const showFallback = dataAvailable === false;

  return (
    <div>
      {loading ? (
        <p className="py-4 text-center text-sm text-[var(--app-muted)]">
          {HANZI_WRITING_LABELS.loading}
        </p>
      ) : null}

      {showFallback ? (
        <div className="text-center">
        {strokeOrderImageUrl ? (
          <div className="relative mx-auto mb-4 h-64 w-64">
            <Image
              src={strokeOrderImageUrl}
              alt={`${character} ${HANZI_WRITING_LABELS.strokeOrder}`}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        ) : null}
        <p className="text-sm leading-relaxed text-[var(--app-muted)]">
          {HANZI_WRITING_LABELS.unavailable}
        </p>
        {onDone ? (
          <button
            type="button"
            onClick={onDone}
            className="mt-4 min-h-[44px] rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            {HANZI_WRITING_LABELS.done}
          </button>
        ) : null}
        </div>
      ) : null}

      <div style={loading || showFallback ? { display: "none" } : undefined}>
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-emerald-700">
        {HANZI_WRITING_LABELS.strokeOrder}
      </p>
      <div
        id={containerId}
        className="mx-auto flex h-[280px] w-[280px] items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200"
        aria-label={`${character} ${HANZI_WRITING_LABELS.write}`}
      />

      {mode === "success" ? (
        <p className="mt-3 text-center text-base font-bold text-emerald-700">
          {HANZI_WRITING_LABELS.success}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-2">
        {mode !== "success" ? (
          <>
            <button
              type="button"
              onClick={() => void handleWatchStrokes()}
              disabled={mode === "quiz"}
              className="min-h-[44px] rounded-xl bg-violet-100 px-3 py-2 text-sm font-semibold text-violet-900 disabled:opacity-50"
            >
              {HANZI_WRITING_LABELS.watchStrokes}
            </button>
            <button
              type="button"
              onClick={() => void handleTraceWrite()}
              disabled={mode === "animating"}
              className="min-h-[44px] rounded-xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-900 disabled:opacity-50"
            >
              {HANZI_WRITING_LABELS.traceWriteLong}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void handleRetry()}
              className="min-h-[44px] rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900"
            >
              {HANZI_WRITING_LABELS.retry}
            </button>
            {hasNextCharacter && onNextCharacter ? (
              <button
                type="button"
                onClick={onNextCharacter}
                className="min-h-[44px] rounded-xl bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-900"
              >
                {HANZI_WRITING_LABELS.nextCharacter}
              </button>
            ) : null}
          </>
        )}
        <button
          type="button"
          onClick={onDone}
          className="min-h-[44px] rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800"
        >
          {HANZI_WRITING_LABELS.done}
        </button>
      </div>
      </div>
    </div>
  );
}
