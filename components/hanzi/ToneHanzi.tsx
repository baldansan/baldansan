"use client";

import { alignToneUnits, type Tone } from "@/lib/pinyin/tone";
import { useToneColors } from "@/lib/pinyin/tone-pref";

type Size = "xl" | "lg" | "md" | "sm";

type Props = {
  word: string;
  pinyin?: string | null;
  size?: Size;
  showPinyin?: boolean;
  colorHanzi?: boolean;
  className?: string;
};

const tcls = (t: Tone, on: boolean) => (on ? `bs-tone-${t}` : "");

export function ToneHanzi({
  word,
  pinyin,
  size = "lg",
  showPinyin = true,
  colorHanzi = true,
  className = "",
}: Props) {
  const colors = useToneColors();
  const units = alignToneUnits(word, pinyin);
  const cls = `bs-tone-word bs-tone-${size} ${className}`.trim();

  if (!units) {
    // Fallback: бүх pinyin-ийг үгийн дээр
    return (
      <span className={`${cls} bs-tone-word--plain`} translate="no">
        {showPinyin && pinyin ? (
          <span className="bs-tone-py bs-tone-py--whole">{pinyin}</span>
        ) : null}
        <span className="bs-tone-zh hanzi">{word}</span>
      </span>
    );
  }

  return (
    <span className={cls} translate="no" lang="zh-CN">
      {units.map((u, i) => (
        <span key={`${u.hanzi}-${i}`} className="bs-tone-unit">
          {showPinyin ? (
            <span className={`bs-tone-py ${tcls(u.tone, colors)}`}>
              {u.pinyin || " "}
            </span>
          ) : null}
          <span className={`bs-tone-zh hanzi ${colorHanzi ? tcls(u.tone, colors) : ""}`}>
            {u.hanzi}
          </span>
        </span>
      ))}
    </span>
  );
}

const LEGEND: { tone: Tone; mark: string; label: string }[] = [
  { tone: 1, mark: "ˉ", label: "1-р хөг" },
  { tone: 2, mark: "ˊ", label: "2-р" },
  { tone: 3, mark: "ˇ", label: "3-р" },
  { tone: 4, mark: "ˋ", label: "4-р" },
  { tone: 0, mark: "", label: "хөггүй" },
];

export function ToneLegend({ className = "" }: { className?: string }) {
  const colors = useToneColors();
  if (!colors) return null;
  return (
    <p className={`bs-tone-legend ${className}`.trim()} translate="no">
      {LEGEND.map((l) => (
        <span key={l.tone} className={`bs-tone-legend-item bs-tone-${l.tone}`}>
          <span className="bs-tone-legend-dot" />
          {l.label} {l.mark}
        </span>
      ))}
    </p>
  );
}
