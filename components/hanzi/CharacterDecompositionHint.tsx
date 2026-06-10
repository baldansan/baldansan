import { getCharBreakdownView } from "@/lib/hanzi/char-breakdown-data";

type Props = {
  char: string;
  /** Show hanzi prefix when multiple rows appear under one vocab card. */
  showCharLabel?: boolean;
};

export function CharacterDecompositionHint({
  char,
  showCharLabel = false,
}: Props) {
  const breakdown = getCharBreakdownView(char);
  if (!breakdown) return null;

  const { parts, etymology_mn: etymology } = breakdown;
  if (parts.length === 0 && !etymology) return null;

  return (
    <div className="bs-decomp-hint">
      <p className="bs-decomp-hint-label">
        {showCharLabel ? (
          <>
            <span className="bs-decomp-hint-char">{char}</span> · Бүрдэл
          </>
        ) : (
          "Бүрдэл"
        )}
      </p>
      {parts.length > 0 ? (
        <div className="bs-decomp-hint-row">
          {parts.map((part, index) => (
            <span key={`${part.c}-${index}`} className="bs-decomp-chip">
              <span className="bs-decomp-chip-icon" aria-hidden>
                {part.icon}
              </span>
              <span className="bs-decomp-chip-glyph">{part.c}</span>
              <span className="bs-decomp-chip-name">{part.name}</span>
            </span>
          ))}
        </div>
      ) : null}
      {etymology ? <p className="bs-decomp-etym">{etymology}</p> : null}
    </div>
  );
}
