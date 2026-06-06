import radicalGameData from "@/data/radical_game_data.json";

export type RadicalGameComponent = {
  c: string;
  name: string;
  icon: string;
};

export type RadicalGameEntry = {
  char: string;
  pinyin: string;
  meaning_mn: string;
  answer: string[];
  structure: string;
  etymology_mn: string;
  options: string[];
  components: RadicalGameComponent[];
  breakdown: RadicalGameComponent[];
};

const ORDER_HINTS: Record<string, string> = {
  "\u2ff0": "зүүн → баруун",
  "\u2ff1": "дээр → доор",
  "\u2ff2": "зүүн → дунд → баруун",
  "\u2ff3": "дээр → дунд → доор",
  "\u2ff5": "гадна → дотор",
};

export function getRadicalGameEntries(): RadicalGameEntry[] {
  return radicalGameData as RadicalGameEntry[];
}

export function orderHintFromStructure(structure: string): string {
  for (const [key, label] of Object.entries(ORDER_HINTS)) {
    if (structure.includes(key)) return label;
  }
  return "зөв дарааллаар";
}

export function isAnswerCorrect(
  selected: string[],
  answer: string[]
): boolean {
  return (
    selected.length === answer.length &&
    selected.every((part, i) => part === answer[i])
  );
}

export function scoreForAttempt(firstTry: boolean): number {
  return firstTry ? 15 : 8;
}
