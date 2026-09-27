"use client";

/**
 * Бичих самбар — hanzi-writer-ийн нимгэн wrapper («Бичих дэвтэр»-т).
 * phase:
 *   watch  = зураасны дарааллыг үзүүлнэ (автоматаар тоглоно, «Дахин үзэх»)
 *   trace  = outline харуулж дагаж бичүүлнэ
 *   memory = outline-гүй санаж бичүүлнэ (сануулга авч болно)
 * Бичилт дуусахад onDone({ mistakes, usedHint }) дуудна.
 * CharacterWriter-ээс ялгаа: дагаж бичих дууссаны дараа санаж бичих рүү
 * автоматаар ОРОХГҮЙ — дэвтрийн давталтын тоог эцэг компонент удирдана.
 */
import { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { localHanziCharDataLoader } from "@/lib/hanzi/character-data-loader";

export type WritingPadPhase = "watch" | "trace" | "memory";

export type WritingPadResult = { mistakes: number; usedHint: boolean };

type Props = {
  char: string;
  phase: WritingPadPhase;
  onDone: (result: WritingPadResult) => void;
  /** Самбарын дээд хэмжээ (px). Контейнерээс жижиг бол контейнерээр. */
  maxSize?: number;
  /** Зураас бүрд дуудна — гадна талд тоолуур харуулахад. */
  onStroke?: (done: number, total: number) => void;
};

type PadState = "loading" | "animating" | "quiz" | "success" | "unavailable";

function MizigeGrid() {
  return (
    <svg className="wn-pad-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <rect x="0.5" y="0.5" width="99" height="99" fill="none" stroke="currentColor" strokeWidth="1" />
      <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" />
      <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2.5 3" opacity="0.65" />
      <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2.5 3" opacity="0.65" />
    </svg>
  );
}

export function WritingPad({ char, phase, onDone, maxSize = 340, onStroke }: Props) {
  const locale = useUiLocale();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const actionsRef = useRef<{ animate: () => void; hint: () => void; retry: () => void } | null>(
    null
  );
  const [state, setState] = useState<PadState>("loading");
  const [strokeDone, setStrokeDone] = useState(0);
  const [strokeTotal, setStrokeTotal] = useState(0);
  const [size, setSize] = useState(maxSize);
  const onDoneRef = useRef(onDone);
  const onStrokeRef = useRef(onStroke);
  useEffect(() => {
    onDoneRef.current = onDone;
    onStrokeRef.current = onStroke;
  });

  // Контейнерийн өргөнөөр хэмжээг тогтооно (max = maxSize).
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measured = box.clientWidth;
    setSize(measured > 80 ? Math.min(measured, maxSize) : Math.min(260, maxSize));
  }, [maxSize]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let cancelled = false;
    mount.innerHTML = "";
    setState("loading");
    setStrokeDone(0);
    setStrokeTotal(0);

    const mistakes = { count: 0 };
    const usedHint = { value: false };
    let writer: HanziWriter | null = null;

    function startQuiz() {
      if (!writer || cancelled) return;
      const w = writer;
      const memory = phase === "memory";
      w.cancelQuiz();
      void w.hideCharacter({ duration: 0 });
      if (memory) void w.hideOutline({ duration: 0 });
      else void w.showOutline({ duration: 0 });
      setStrokeDone(0);
      setState("quiz");
      void w.quiz({
        leniency: memory ? 1.4 : 1.3,
        showHintAfterMisses: memory ? 3 : 2,
        markStrokeCorrectAfterMisses: memory ? 6 : 5,
        highlightOnComplete: true,
        onMistake: () => {
          if (typeof navigator !== "undefined") navigator.vibrate?.(40);
          mistakes.count += 1;
        },
        onCorrectStroke: (data) => {
          if (cancelled) return;
          const done = data.strokeNum + 1;
          setStrokeDone(done);
          onStrokeRef.current?.(done, done + data.strokesRemaining);
        },
        onComplete: () => {
          if (cancelled) return;
          setState("success");
          onDoneRef.current({ mistakes: mistakes.count, usedHint: usedHint.value });
        },
      });
    }

    function startAnimation() {
      if (!writer || cancelled) return;
      const w = writer;
      w.cancelQuiz();
      setState("animating");
      void w.hideCharacter({ duration: 0 });
      void w.animateCharacter({
        onComplete: (result?: { canceled?: boolean }) => {
          if (cancelled || result?.canceled) return;
          setState("success");
          onDoneRef.current({ mistakes: 0, usedHint: false });
        },
      });
    }

    writer = HanziWriter.create(mount, char, {
      width: size,
      height: size,
      padding: Math.round(size * 0.07),
      showCharacter: false,
      showOutline: phase !== "memory",
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
        if (phase === "watch") startAnimation();
        else startQuiz();
      },
      onLoadCharDataError: () => {
        if (!cancelled) setState("unavailable");
      },
    });

    actionsRef.current = {
      animate: startAnimation,
      retry: () => {
        mistakes.count = 0;
        usedHint.value = false;
        startQuiz();
      },
      hint: () => {
        if (!writer || cancelled) return;
        usedHint.value = true;
        const w = writer;
        void w.showOutline({ duration: 150 });
        window.setTimeout(() => {
          if (!cancelled) void w.hideOutline({ duration: 300 });
        }, 1600);
      },
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
  }, [char, phase, size]);

  return (
    <div ref={boxRef} className="w-full">
      <div className="wn-pad" style={{ width: size, height: size }} translate="no">
        <MizigeGrid />
        {strokeTotal > 0 && state !== "loading" ? (
          <span className="wn-pad-badge">
            {tr(locale, "зураас")} {strokeDone}/{strokeTotal}
          </span>
        ) : null}
        {state === "loading" ? (
          <p className="wn-pad-overlay">{tr(locale, "Ачааллаж байна…")}</p>
        ) : null}
        {state === "unavailable" ? (
          <p className="wn-pad-overlay">
            {tr(locale, "Энэ ханзны зураасны өгөгдөл алга — дараагийн ханз руу шилжээрэй.")}
          </p>
        ) : null}
        <div
          ref={mountRef}
          className="wn-pad-canvas"
          style={state === "loading" || state === "unavailable" ? { visibility: "hidden" } : undefined}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {phase === "watch" && (state === "success" || state === "animating") ? (
          <button
            type="button"
            className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200"
            onClick={() => actionsRef.current?.animate()}
          >
            {tr(locale, "Дахин үзэх")}
          </button>
        ) : null}
        {phase === "memory" && state === "quiz" ? (
          <button
            type="button"
            className="rounded-full bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200"
            onClick={() => actionsRef.current?.hint()}
          >
            {tr(locale, "💡 Сануулга харах")}
          </button>
        ) : null}
        {state === "unavailable" ? (
          <button
            type="button"
            className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200"
            onClick={() => onDoneRef.current({ mistakes: 0, usedHint: false })}
          >
            {tr(locale, "Алгасах")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
