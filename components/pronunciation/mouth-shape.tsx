import type { MouthShapeKind } from "@/lib/pronunciation/pinyin-course";

/**
 * Уруулын энгийн зураг (SVG): дугуй (o/u/ü), татсан (i), нээлттэй (a), энгийн.
 * Хүүхдэд зориулсан — том, цөөн шугамтай.
 */
export function MouthShape({ shape, size = 120, className }: { shape: MouthShapeKind; size?: number; className?: string }) {
  const lip = "#e11d48";
  const inner = "#7f1d1d";
  const tooth = "#fff";
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden>
      {/* нүүр */}
      <circle cx="60" cy="60" r="56" fill="#fde68a" stroke="#f59e0b" strokeWidth="3" />
      {/* нүд */}
      <circle cx="42" cy="44" r="5" fill="#1f2937" />
      <circle cx="78" cy="44" r="5" fill="#1f2937" />
      {shape === "round" ? (
        <>
          <ellipse cx="60" cy="80" rx="15" ry="16" fill={inner} stroke={lip} strokeWidth="6" />
          <ellipse cx="60" cy="80" rx="7" ry="8" fill="#111827" />
        </>
      ) : null}
      {shape === "spread" ? (
        <>
          <path d="M28 78 Q60 96 92 78 Q60 84 28 78 Z" fill={inner} stroke={lip} strokeWidth="5" strokeLinejoin="round" />
          <path d="M34 79 Q60 86 86 79" stroke={tooth} strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : null}
      {shape === "open" ? (
        <>
          <ellipse cx="60" cy="82" rx="22" ry="20" fill={inner} stroke={lip} strokeWidth="5" />
          <rect x="44" y="66" width="32" height="6" rx="2" fill={tooth} />
          <ellipse cx="60" cy="96" rx="12" ry="6" fill="#f43f5e" />
        </>
      ) : null}
      {shape === "neutral" ? (
        <>
          <path d="M36 80 Q60 90 84 80" stroke={lip} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M40 80 Q60 76 80 80" stroke={lip} strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  );
}
