"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

/**
 * Гараар зурж ханз таних панел (HanziLookupJS, GPL — /vendor/hanzilookup/).
 * Скрипт + өгөгдлийг эхний нээлтэд л ачаална (~800KB, дараа нь кэштэй).
 */

type HanziLookupMatch = { character: string; score: number };

type HanziLookupGlobal = {
  init: (name: string, url: string, done: (ok: boolean) => void) => void;
  AnalyzedCharacter: new (strokes: number[][][]) => object;
  Matcher: new (name: string) => {
    match: (
      analyzed: object,
      limit: number,
      cb: (matches: HanziLookupMatch[]) => void
    ) => void;
  };
};

declare global {
  interface Window {
    HanziLookup?: HanziLookupGlobal;
  }
}

let loaderPromise: Promise<boolean> | null = null;

function loadHanziLookup(): Promise<boolean> {
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    const start = () => {
      const hl = window.HanziLookup;
      if (!hl) {
        resolve(false);
        return;
      }
      hl.init("mmah", "/vendor/hanzilookup/mmah.json", (ok) => resolve(ok));
    };
    if (window.HanziLookup) {
      start();
      return;
    }
    const script = document.createElement("script");
    script.src = "/vendor/hanzilookup/hanzilookup.min.js";
    script.async = true;
    script.onload = start;
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return loaderPromise;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (char: string) => void;
};

const CANVAS_SIZE = 280;

export function DrawInputSheet({ open, onClose, onPick }: Props) {
  const locale = useUiLocale();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<number[][][]>([]);
  const currentStrokeRef = useRef<number[][]>([]);
  const drawingRef = useRef(false);
  const [ready, setReady] = useState<"loading" | "ready" | "failed">("loading");
  const [candidates, setCandidates] = useState<string[]>([]);
  const [strokeCount, setStrokeCount] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void loadHanziLookup().then((ok) => {
      if (!cancelled) setReady(ok ? "ready" : "failed");
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //米字格 маягийн туслах шугам
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Зурсан зураасууд
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const all = [...strokesRef.current];
    if (currentStrokeRef.current.length > 0) all.push(currentStrokeRef.current);
    for (const stroke of all) {
      ctx.beginPath();
      stroke.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x!, y!);
        else ctx.lineTo(x!, y!);
      });
      ctx.stroke();
    }
  }, []);

  const runLookup = useCallback(() => {
    const hl = window.HanziLookup;
    if (!hl || strokesRef.current.length === 0) {
      setCandidates([]);
      return;
    }
    try {
      const analyzed = new hl.AnalyzedCharacter(strokesRef.current);
      const matcher = new hl.Matcher("mmah");
      matcher.match(analyzed, 8, (matches) => {
        setCandidates((matches ?? []).map((m) => m.character));
      });
    } catch {
      setCandidates([]);
    }
  }, []);

  const clearAll = useCallback(() => {
    strokesRef.current = [];
    currentStrokeRef.current = [];
    setCandidates([]);
    setStrokeCount(0);
    redraw();
  }, [redraw]);

  const undoStroke = useCallback(() => {
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokeCount(strokesRef.current.length);
    redraw();
    runLookup();
  }, [redraw, runLookup]);

  useEffect(() => {
    if (open) {
      clearAll();
    }
  }, [open, clearAll]);

  if (!open) return null;

  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>): number[] {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_SIZE;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_SIZE;
    return [Math.round(x), Math.round(y)];
  }

  function handleDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    drawingRef.current = true;
    currentStrokeRef.current = [pointFromEvent(e)];
    canvasRef.current?.setPointerCapture(e.pointerId);
    redraw();
  }

  function handleMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    e.preventDefault();
    currentStrokeRef.current.push(pointFromEvent(e));
    redraw();
  }

  function handleUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    e.preventDefault();
    drawingRef.current = false;
    if (currentStrokeRef.current.length > 1) {
      strokesRef.current = [...strokesRef.current, currentStrokeRef.current];
    }
    currentStrokeRef.current = [];
    setStrokeCount(strokesRef.current.length);
    redraw();
    runLookup();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 p-3"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[430px] rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold text-[var(--app-text)]">
            ✍️ {tr(locale, "Зурж хайх")}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
          >
            {tr(locale, "Хаах")}
          </button>
        </div>

        {ready === "failed" ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
            {tr(locale, "Таних сан ачаалагдсангүй. Сүлжээгээ шалгаад дахин оролдоно уу.")}
          </p>
        ) : null}

        {/* Таамаглал */}
        <div className="mb-2 flex min-h-[44px] flex-wrap items-center gap-1.5">
          {ready === "loading" ? (
            <span className="text-xs text-[var(--app-muted)]">
              {tr(locale, "Таних сан ачаалж байна…")}
            </span>
          ) : candidates.length > 0 ? (
            candidates.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onPick(c);
                  clearAll();
                }}
                className="min-h-[40px] min-w-[40px] rounded-xl bg-emerald-50 px-2 text-2xl ring-1 ring-emerald-200"
              >
                {c}
              </button>
            ))
          ) : (
            <span className="text-xs text-[var(--app-muted)]">
              {tr(locale, "Ханзаа доор зураарай — таамаглалууд энд гарна")}
            </span>
          )}
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          className="mx-auto block aspect-square w-full max-w-[300px] touch-none rounded-2xl bg-slate-50 ring-1 ring-slate-200"
        />

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={undoStroke}
            disabled={strokeCount === 0}
            className="min-h-[44px] flex-1 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 disabled:opacity-40"
          >
            ↩️ {tr(locale, "Зураас буцаах")}
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={strokeCount === 0}
            className="min-h-[44px] flex-1 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 disabled:opacity-40"
          >
            🗑 {tr(locale, "Арилгах")}
          </button>
        </div>
      </div>
    </div>
  );
}
