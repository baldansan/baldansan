import { resolveComponentIcon } from "@/lib/hanzi/component-icon-map";
import type { HskCharacter } from "@/types/hsk-lesson-package";

export type DecompositionComponent = {
  c: string;
  name: string;
  icon: string;
};

export function componentDisplayName(
  comp: NonNullable<HskCharacter["components"]>[number]
): string {
  return comp.meaning_mn?.trim() || comp.meaning_en?.trim() || "";
}

export function characterDecomposition(
  character: HskCharacter
): DecompositionComponent[] | null {
  const components = character.components;
  if (!components?.length) return null;

  const rows = components
    .map((comp) => {
      const c = comp.c?.trim();
      if (!c) return null;
      const name = componentDisplayName(comp);
      if (!name) return null;
      return {
        c,
        name,
        icon: resolveComponentIcon(c, comp.icon),
      };
    })
    .filter((row): row is DecompositionComponent => row !== null);

  return rows.length > 0 ? rows : null;
}

export function characterEtymologyMn(character: HskCharacter): string | null {
  const text = character.etymology_mn?.trim() || character.etymologyMn?.trim();
  return text || null;
}

export function hasDecompositionHint(character: HskCharacter): boolean {
  return (
    characterDecomposition(character) !== null ||
    characterEtymologyMn(character) !== null
  );
}

/** Match lesson characters.json rows for a vocabulary zh string. */
export function resolveDecompositionCharacters(
  zh: string,
  characters: HskCharacter[]
): HskCharacter[] {
  const text = zh.trim();
  if (!text || characters.length === 0) return [];

  const byHanzi = new Map(characters.map((row) => [row.hanzi, row]));
  const full = byHanzi.get(text);
  if (full && hasDecompositionHint(full)) return [full];

  const singles: HskCharacter[] = [];
  for (const glyph of [...text]) {
    const row = byHanzi.get(glyph);
    if (row && hasDecompositionHint(row)) singles.push(row);
  }
  return singles;
}
