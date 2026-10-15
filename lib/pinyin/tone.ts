/**
 * Pinyin → тоон (хөг) задлагч. Нэг ханзанд нэг үелж таардаг.
 * Таарахгүй бол null буцаана (дуудагч нь бүх pinyin-ийг ханзны дээр харуулна).
 */

export type Tone = 0 | 1 | 2 | 3 | 4;

export type ToneUnit = {
  hanzi: string;
  pinyin: string;
  tone: Tone;
};

const CJK_RE = /[㐀-鿿豈-﫿]/;

export function isCjkChar(ch: string): boolean {
  return CJK_RE.test(ch);
}

const TONE_MARKS: Record<string, Tone> = {
  ā: 1, ē: 1, ī: 1, ō: 1, ū: 1, ǖ: 1,
  á: 2, é: 2, í: 2, ó: 2, ú: 2, ǘ: 2,
  ǎ: 3, ě: 3, ǐ: 3, ǒ: 3, ǔ: 3, ǚ: 3,
  à: 4, è: 4, ì: 4, ò: 4, ù: 4, ǜ: 4,
};

const VOWELS = "aeiouüvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜêAEIOUÜ";

/** Нэг үелжийн хөгийг тодорхойлно (тэмдэг эсвэл төгсгөлийн тоо). */
export function toneOfSyllable(syllable: string): Tone {
  for (const ch of syllable.normalize("NFC")) {
    const t = TONE_MARKS[ch.toLowerCase()];
    if (t) return t;
  }
  const m = syllable.match(/([1-5])$/);
  if (m) {
    const n = Number(m[1]);
    return (n === 5 ? 0 : n) as Tone;
  }
  return 0;
}

const INITIAL_RE = /^(?:zh|ch|sh|[bpmfdtnlgkhjqxzcsrwy])/;

/** Нэг үгчилсэн (зайгүй) pinyin-ийг үелж болгон хуваана. */
function splitToken(token: string): string[] | null {
  const out: string[] = [];
  const s = token.normalize("NFC");
  let i = 0;
  const isV = (c: string | undefined) => !!c && VOWELS.includes(c);
  while (i < s.length) {
    let j = i;
    const init = s.slice(i).toLowerCase().match(INITIAL_RE);
    if (init) j += init[0].length;
    const vStart = j;
    while (j < s.length && isV(s[j])) j++;
    if (j === vStart) return null; // эгшиггүй — задлах боломжгүй
    const next = s[j]?.toLowerCase();
    if (next === "n" && s[j + 1]?.toLowerCase() === "g" && !isV(s[j + 2])) j += 2;
    else if (next === "n" && !isV(s[j + 1])) j += 1;
    else if (next === "r" && !isV(s[j + 1])) j += 1;
    // erhua: diǎnr, yìdiǎnr
    if (j > vStart && s[j - 1]?.toLowerCase() !== "r" && s[j]?.toLowerCase() === "r" && !isV(s[j + 1])) j += 1;
    if (/[1-5]/.test(s[j] ?? "")) j += 1; // ni3 хэлбэр
    out.push(s.slice(i, j));
    i = j;
  }
  return out;
}

export function splitPinyinSyllables(pinyin: string): string[] | null {
  // "a / b" гэх мэт хувилбараас эхнийхийг авна
  const first = pinyin.split(/\s*[/;,，；]\s*/)[0] ?? "";
  const tokens = first
    .replace(/[·•]/g, " ")
    .split(/[\s'’‘-]+/)
    .filter(Boolean);
  const all: string[] = [];
  for (const t of tokens) {
    const parts = splitToken(t);
    if (!parts) return null;
    all.push(...parts);
  }
  return all;
}

/**
 * Үг + pinyin → [{hanzi, pinyin, tone}]. CJK бус тэмдэгтүүд (… гэх мэт)
 * pinyin-гүй, tone 0-тэй дамжина. Үелжийн тоо ханзтай таарахгүй бол null.
 */
export function alignToneUnits(
  word: string,
  pinyin: string | null | undefined
): ToneUnit[] | null {
  if (!word || !pinyin?.trim()) return null;
  const chars = Array.from(word.replace(/\s/g, ""));
  const cjkCount = chars.filter(isCjkChar).length;
  if (cjkCount === 0) return null;
  let syl = splitPinyinSyllables(pinyin);
  if (!syl || syl.length === 0) return null;

  let erhuaTail = false;
  // 花儿 huār — "r" нь 儿-д харьяалагдана
  if (
    syl.length === cjkCount - 1 &&
    chars[chars.length - 1] === "儿" &&
    /[^e]r$/i.test(syl[syl.length - 1]!)
  ) {
    const last = syl[syl.length - 1]!;
    syl = [...syl.slice(0, -1), last.slice(0, -1), "r"];
    erhuaTail = true;
  }
  if (syl.length !== cjkCount) return null;

  let k = 0;
  const total = syl.length;
  return chars.map((ch) => {
    if (!isCjkChar(ch)) return { hanzi: ch, pinyin: "", tone: 0 as Tone };
    const p = syl![k++]!;
    const isTail = erhuaTail && k === total;
    return { hanzi: ch, pinyin: p, tone: isTail ? (0 as Tone) : toneOfSyllable(p) };
  });
}
