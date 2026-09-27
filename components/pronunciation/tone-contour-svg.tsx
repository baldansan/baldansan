"use client";

import { useEffect, useRef } from "react";
import { toneContour } from "@/lib/speech/pinyin-tones";

/** Chao муруйг SVG path болгоно (viewBox 0 0 W H). */
export function contourPath(points: number[], w: number, h: number, pad = 3): string {
  if (points.length === 0) return "";
  const x0 = pad;
  const x1 = w - pad;
  const y = (v: number) => pad + (h - pad * 2) * (1 - (v - 1) / 4);
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(x0 + ((x1 - x0) * i) / (points.length - 1)).toFixed(1)} ${y(p).toFixed(1)}`)
    .join(" ");
}

type Props = {
  tone: number;
  /** Дуу тоглох үед цэг муруйн дагуу гүйнэ (~0.6 с). Утга солигдох бүрд дахин гүйнэ. */
  playKey?: number;
  durationMs?: number;
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
};

/** Нэг аялгын жижиг Chao муруй + дуу тоглох үед гүйх цэг. */
export function ToneContourSvg({
  tone,
  playKey = 0,
  durationMs = 600,
  width = 72,
  height = 40,
  stroke = "#059669",
  className,
}: Props) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const dotRef = useRef<SVGCircleElement | null>(null);
  const d = contourPath(toneContour(tone), width, height);

  useEffect(() => {
    if (!playKey) return;
    const path = pathRef.current;
    const dot = dotRef.current;
    if (!path || !dot) return;
    const total = path.getTotalLength();
    let raf = 0;
    const start = performance.now();
    dot.style.opacity = "1";
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / durationMs);
      const p = path.getPointAtLength(total * k);
      dot.setAttribute("cx", p.x.toFixed(1));
      dot.setAttribute("cy", p.y.toFixed(1));
      if (k < 1) raf = requestAnimationFrame(tick);
      else dot.style.opacity = "0";
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playKey, durationMs, d]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={className} aria-hidden>
      {[1, 2, 3, 4, 5].map((v) => {
        const y = 3 + (height - 6) * (1 - (v - 1) / 4);
        return <line key={v} x1={3} x2={width - 3} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={1} />;
      })}
      <path ref={pathRef} d={d} fill="none" stroke={stroke} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <circle ref={dotRef} r={4} fill={stroke} style={{ opacity: 0 }} />
    </svg>
  );
}

/** Хоёр үеийн аялгын хэв (12 → ˉˊ) — жижиг дүрс. */
export function TonePairIcon({
  t1,
  t2,
  width = 56,
  height = 28,
  inverted = false,
}: {
  t1: number;
  t2: number;
  width?: number;
  height?: number;
  /** Ногоон дэвсгэр дээр — цагаанаар */
  inverted?: boolean;
}) {
  const half = width / 2;
  const c1 = inverted ? "#ffffff" : "#059669";
  const c2 = inverted ? "rgba(255,255,255,0.75)" : t2 === 0 ? "#94a3b8" : "#0ea5e9";
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden>
      <path d={contourPath(toneContour(t1), half, height, 3)} fill="none" stroke={c1} strokeWidth={2.5} strokeLinecap="round" />
      <g transform={`translate(${half} 0)`}>
        <path d={contourPath(toneContour(t2), half, height, 3)} fill="none" stroke={c2} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    </svg>
  );
}
