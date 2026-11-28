"use client";

/**
 * Ханзыг зурлагын өгөгдлөөс нь хөдөлгөөнгүй SVG-ээр зурна.
 * `highlight` дэх зураасууд тод, бусад нь бүдэг. `only` өгвөл зөвхөн тэр зураас.
 */
import { useEffect, useState } from "react";
import { loadHanziCharData, type HanziCharData } from "@/lib/hanzi/character-data-loader";

type Props = {
  ch: string;
  size: number;
  highlight?: number[];
  only?: number;
  className?: string;
};

export function HanziGlyph({ ch, size, highlight, only, className }: Props) {
  const [data, setData] = useState<HanziCharData | null>(null);
  useEffect(() => {
    let alive = true;
    setData(null);
    loadHanziCharData(ch)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ch]);

  return (
    <svg
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className={className}
      aria-hidden
      style={{ flex: "none" }}
    >
      {data ? (
        <g transform="scale(1,-1) translate(0,-900)">
          {data.strokes.map((d, i) => {
            if (only != null && i !== only) return null;
            const on = only != null || !highlight || highlight.includes(i);
            return <path key={i} d={d} className={on ? "wn-glyph-on" : "wn-glyph-dim"} />;
          })}
        </g>
      ) : null}
    </svg>
  );
}
