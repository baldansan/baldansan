/**
 * Пиньинь үе + аялгын дугаар → аялгын тэмдэгтэй бичлэг ("ma", 3 → "mǎ").
 * Урвуу: тэмдэгтэй үеийг үндсэн үе (тэмдэггүй) болгоно ("mǎ" → "ma").
 */

const MARKS: Record<string, string> = {
  a: "āáǎà",
  e: "ēéěè",
  i: "īíǐì",
  o: "ōóǒò",
  u: "ūúǔù",
  ü: "ǖǘǚǜ",
};

/** "ma" + 3 → "mǎ"; tone 0/5 → "ma". Стандарт дүрэм: a/e → тэр; ou → o; бусад → сүүлийн эгшиг. */
export function toneMark(syllable: string, tone: number): string {
  const s = syllable.replace("u:", "ü").replace("v", "ü");
  if (tone < 1 || tone > 4) return s;
  let i = -1;
  if (s.includes("a")) i = s.indexOf("a");
  else if (s.includes("e")) i = s.indexOf("e");
  else if (s.includes("ou")) i = s.indexOf("o");
  else {
    for (const v of ["i", "o", "u", "ü"]) i = Math.max(i, s.lastIndexOf(v));
  }
  if (i < 0) return s;
  return s.slice(0, i) + MARKS[s[i]][tone - 1] + s.slice(i + 1);
}

/** "mǎ" → "ma", "nǚ" → "nü" (ü хадгална), "ma3" → "ma". */
export function stripToneMark(syllable: string): string {
  return syllable
    .normalize("NFD")
    // macron, acute, caron, grave — аялгын тэмдгүүд; diaeresis (ü) үлдээнэ
    .replace(/[̄́̌̀]/g, "")
    .normalize("NFC")
    .replace(/[1-5]$/, "")
    .toLowerCase();
}

export const TONE_GLYPH: Record<number, string> = { 1: "ˉ", 2: "ˊ", 3: "ˇ", 4: "ˋ", 0: "·" };
