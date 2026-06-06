import {
  characterDecomposition,
  characterEtymologyMn,
  hasDecompositionHint,
} from "@/lib/hanzi/character-decomposition";
import type { HskCharacter } from "@/types/hsk-lesson-package";

type Props = {
  character: HskCharacter;
  /** Show hanzi prefix when multiple rows appear under one vocab card. */
  showCharLabel?: boolean;
};

export function CharacterDecompositionHint({
  character,
  showCharLabel = false,
}: Props) {
  if (!hasDecompositionHint(character)) return null;

  const parts = characterDecomposition(character);
  const etymology = characterEtymologyMn(character);

  return (
    <div className="bs-decomp-hint">
      <p className="bs-decomp-hint-label">
        {showCharLabel ? (
          <>
            <span className="bs-decomp-hint-char">{character.hanzi}</span> · Бүрдэл
          </>
        ) : (
          "Бүрдэл"
        )}
      </p>
      {parts && parts.length > 0 ? (
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
