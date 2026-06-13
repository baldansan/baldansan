export type MnGrammarTermEntry = {
  id: string;
  /** Popup title */
  title: string;
  description: string;
  examples: string[];
  /** Substrings to link in Mongolian lesson copy (longest match wins). */
  matches: string[];
};

export const MN_GRAMMAR_TERMS: MnGrammarTermEntry[] = [
  {
    id: "noun",
    title: "нэр үг",
    description: "Хэн? Юу? гэсэн асуултад хариулдаг үг.",
    examples: ["ном", "хүн", "ус", "хайр"],
    matches: ["нэр үг"],
  },
  {
    id: "verb",
    title: "үйл үг",
    description: "Юу хийж байгааг заадаг үг.",
    examples: ["явах", "идэх", "ярих", "гомдоллох"],
    matches: ["үйл үг"],
  },
  {
    id: "adjective",
    title: "тэмдэг нэр",
    description: "Ямар? гэсэн асуултад хариулж, юмыг тодотгодог үг.",
    examples: ["том", "улаан", "сайхан"],
    matches: ["тэмдэг нэр"],
  },
  {
    id: "object",
    title: "тусагдахуун",
    description:
      "Үйлдэл хэнд/юунд хандаж байгааг заана. «Юуг? Хэнийг?»",
    examples: ["«Би НОМ уншина» — ном бол тусагдахуун"],
    matches: ["тусагдахуун"],
  },
  {
    id: "subject",
    title: "эзэн",
    description: "Үйлдлийг хийж буй нэг нь. «Хэн? Юу?»",
    examples: ["«БАГШ хичээл заана» — багш бол эзэн"],
    matches: ["эзэн"],
  },
  {
    id: "attributive",
    title: "тодотгол",
    description: "Нэр үгийн ӨМНӨ орж, ямар болохыг тодотгоно.",
    examples: ["«УЛААН ном»", "«МИНИЙ найз»"],
    matches: ["тодотгол"],
  },
  {
    id: "headword",
    title: "төв үг",
    description: "Хослолын гол үг. Бусад үг үүнийг тодотгоно.",
    examples: ["«улаан НОМ» дотор ном нь төв үг"],
    matches: ["төв үг"],
  },
  {
    id: "adverbial",
    title: "байц",
    description: "Үйл үгийн өмнө орж, хэзээ/хаана/яаж болохыг заана.",
    examples: ["«ӨЧИГДӨР ирсэн»", "«ХУРДАН гүйх»"],
    matches: ["байц"],
  },
  {
    id: "complement",
    title: "гүйцээгч",
    description: "Үйл үгийн дараа орж, үр дүн/чиглэлийг гүйцээж заана.",
    examples: ["«гүйж ГАРАХ»", "«ойлгож АВАХ»"],
    matches: ["гүйцээгч"],
  },
];

const TERM_BY_ID = new Map(MN_GRAMMAR_TERMS.map((t) => [t.id, t]));

export function getMnGrammarTerm(id: string): MnGrammarTermEntry | undefined {
  return TERM_BY_ID.get(id);
}

type MatchPattern = { phrase: string; termId: string };

let cachedPatterns: MatchPattern[] | null = null;

function buildMatchPatterns(): MatchPattern[] {
  if (cachedPatterns) return cachedPatterns;
  const patterns: MatchPattern[] = [];
  for (const term of MN_GRAMMAR_TERMS) {
    for (const phrase of term.matches) {
      const trimmed = phrase.trim();
      if (!trimmed) continue;
      patterns.push({ phrase: trimmed, termId: term.id });
    }
  }
  patterns.sort((a, b) => b.phrase.length - a.phrase.length);
  cachedPatterns = patterns;
  return patterns;
}

export type MnGrammarTermSegment =
  | { kind: "text"; value: string }
  | { kind: "term"; value: string; termId: string };

/** Split Mongolian copy into plain text and linkable grammar-term spans. */
export function splitMnGrammarTerms(text: string): MnGrammarTermSegment[] {
  if (!text) return [];

  const patterns = buildMatchPatterns();
  const segments: MnGrammarTermSegment[] = [];
  let pos = 0;

  while (pos < text.length) {
    let matched: MatchPattern | null = null;
    for (const pattern of patterns) {
      if (text.startsWith(pattern.phrase, pos)) {
        matched = pattern;
        break;
      }
    }

    if (matched) {
      segments.push({
        kind: "term",
        value: matched.phrase,
        termId: matched.termId,
      });
      pos += matched.phrase.length;
      continue;
    }

    let next = text.length;
    for (const pattern of patterns) {
      const idx = text.indexOf(pattern.phrase, pos + 1);
      if (idx >= 0 && idx < next) next = idx;
    }

    segments.push({ kind: "text", value: text.slice(pos, next) });
    pos = next;
  }

  return segments.filter((seg) => seg.value.length > 0);
}
