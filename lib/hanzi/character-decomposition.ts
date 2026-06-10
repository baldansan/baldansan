import {
  getCharBreakdownView,
  hasCharBreakdown,
  resolveBreakdownCharsForText,
  type CharBreakdownView,
} from "@/lib/hanzi/char-breakdown-data";

export type DecompositionComponent = {
  c: string;
  name: string;
  icon: string;
};

export {
  getCharBreakdownView,
  hasCharBreakdown,
  resolveBreakdownCharsForText,
  type CharBreakdownView,
};

/** @deprecated Use resolveBreakdownCharsForText — kept for import compatibility. */
export function resolveDecompositionCharacters(
  zh: string,
  _lessonCharacters: unknown[] = []
): CharBreakdownView[] {
  return resolveBreakdownCharsForText(zh);
}
