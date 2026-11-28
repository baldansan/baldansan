"use client";

/**
 * Нэг зурлагын самбар («Зурлагын үндэс» хичээлд).
 * Жишээ ханзыг бүдгээр, тухайн зурлагыг тодоор үзүүлж, эхлэх цэг ба чиглэлийн
 * сумыг зурна. mode="watch" бол зурлагыг хөдөлгөөнөөр үзүүлнэ, "trace" бол
 * сурагч өөрөө дагаж зурна (hanzi-writer-т ганц зураастай «ханз» болгож өгнө).
 */
import { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { loadHanziCharData, type HanziCharData } from "@/lib/hanzi/character-data-loader";

type Props = {
  ch: string;
  idx: number;
  mode: "watch" | "trace";
  /** Солигдох бүрд хөдөлгөөн/дасгал дахин эхэлнэ. */
  runKey: number;
  onDone: (result: { mistakes: number }) => void;
  maxSize?: number;
};

export function StrokePad({ ch, idx, mode, runKey, onDone, maxSize = 300 }: Props) {
  const locale = useUiLocale();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(maxSize);
  const [data, setData] = useState<HanziCharData | null>(null);
  const [failed, setFailed] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measured = box.clientWidth;
    setSize(measured > 80 ? Math.min(measured, maxSize) : Math.min(260, maxSize));
  }, [maxSize]);

  useEffect(() => {
    let alive = true;
    setData(null);
    setFailed(false);
    loadHanziCharData(ch)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [ch]);

  const padding = Math.round(size * 0.07);
  const scale = (size - padding * 2) / 1024;
  const transform = `translate(${padding}, ${size - padding - 124 * scale}) scale(${scale}, ${-scale})`;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !data || !data.strokes[idx]) return;
    let cancelled = false;
    mount.innerHTML = "";
    const one = { strokes: [data.strokes[idx]!], medians: [data.medians[idx]!] };
    let mistakes = 0;
    const writer = HanziWriter.create(mount, ch, {
      width: size,
      height: size,
      padding,
      showCharacter: false,
      showOutline: true,
      strokeAnimationSpeed: 0.7,
      delayBetweenStrokes: 200,
      strokeColor: "#7C4DDB",
      drawingColor: "#7C4DDB",
      drawingWidth: 10,
      outlineColor: "#C9B8EF",
      highlightColor: "#8B5FE3",
      charDataLoader: (_c, onLoad) => {
        onLoad(one as Parameters<typeof onLoad>[0]);
      },
      onLoadCharDataSuccess: () => {
        if (cancelled) return;
        if (mode === "watch") {
          void writer.animateCharacter({
            onComplete: (res?: { canceled?: boolean }) => {
              if (!cancelled && !res?.canceled) onDoneRef.current({ mistakes: 0 });
            },
          });
        } else {
          void writer.quiz({
            leniency: 1.8,
            showHintAfterMisses: 1,
            markStrokeCorrectAfterMisses: 4,
            highlightOnComplete: true,
            onMistake: () => {
              mistakes += 1;
            },
            onComplete: () => {
              if (!cancelled) onDoneRef.current({ mistakes });
            },
          });
        }
      },
    });
    return () => {
      cancelled = true;
      try {
        writer.cancelQuiz();
      } catch {
        // already torn down
      }
      mount.innerHTML = "";
    };
  }, [ch, idx, mode, runKey, size, padding, data]);

  const median = data?.medians[idx] ?? null;
  const start = median?.[0] ?? null;
  const end = median?.[median.length - 1] ?? null;
  const prev = median && median.length > 1 ? median[median.length - 2]! : null;
  const angle = end && prev ? (Math.atan2(end[1]! - prev[1]!, end[0]! - prev[0]!) * 180) / Math.PI : 0;

  return (
    <div ref={boxRef} className="w-full">
      <div className="wn-pad" style={{ width: size, height: size }} translate="no">
        <svg className="wn-pad-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <rect x="0.5" y="0.5" width="99" height="99" fill="none" stroke="currentColor" strokeWidth="1" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" />
        </svg>
        {data ? (
          <svg className="wn-stroke-layer" width={size} height={size} aria-hidden>
            <g transform={transform}>
              {data.strokes.map((d, i) => (i === idx ? null : <path key={i} d={d} className="wn-glyph-ghost" />))}
            </g>
          </svg>
        ) : null}
        <div ref={mountRef} className="wn-pad-canvas" />
        {data && start && end ? (
          <svg className="wn-stroke-layer wn-stroke-top" width={size} height={size} aria-hidden>
            <g transform={transform}>
              <circle cx={start[0]} cy={start[1]} r={30} className="wn-stroke-start" />
              <g transform={`translate(${end[0]},${end[1]}) rotate(${angle})`}>
                <path d="M-6,-46 L62,0 L-6,46 Z" className="wn-stroke-start" />
              </g>
            </g>
          </svg>
        ) : null}
        {!data && !failed ? <p className="wn-pad-overlay">{tr(locale, "Ачааллаж байна…")}</p> : null}
        {failed ? (
          <p className="wn-pad-overlay">{tr(locale, "Зурлагын өгөгдөл ачаалсангүй. Интернэтээ шалгаад дахин оролдоорой.")}</p>
        ) : null}
      </div>
    </div>
  );
}
