/**
 * Пиньинь үеүдийг задалж аялгын дугаар (1-4, 0=саармаг) гаргана.
 * Аялгын жишиг муруйг Chao-гийн 5 шатлалаар өгнө (1=нам, 5=өндөр).
 */

export type PinyinSyllable = {
  syllable: string;
  tone: number; // 0 = саармаг (轻声)
};

const TONE_MARKS: Record<string, { base: string; tone: number }> = {
  ā: { base: "a", tone: 1 },
  á: { base: "a", tone: 2 },
  ǎ: { base: "a", tone: 3 },
  à: { base: "a", tone: 4 },
  ē: { base: "e", tone: 1 },
  é: { base: "e", tone: 2 },
  ě: { base: "e", tone: 3 },
  è: { base: "e", tone: 4 },
  ī: { base: "i", tone: 1 },
  í: { base: "i", tone: 2 },
  ǐ: { base: "i", tone: 3 },
  ì: { base: "i", tone: 4 },
  ō: { base: "o", tone: 1 },
  ó: { base: "o", tone: 2 },
  ǒ: { base: "o", tone: 3 },
  ò: { base: "o", tone: 4 },
  ū: { base: "u", tone: 1 },
  ú: { base: "u", tone: 2 },
  ǔ: { base: "u", tone: 3 },
  ù: { base: "u", tone: 4 },
  ǖ: { base: "ü", tone: 1 },
  ǘ: { base: "ü", tone: 2 },
  ǚ: { base: "ü", tone: 3 },
  ǜ: { base: "ü", tone: 4 },
  ḿ: { base: "m", tone: 2 },
  ń: { base: "n", tone: 2 },
  ň: { base: "n", tone: 3 },
  ǹ: { base: "n", tone: 4 },
};

/** "ài qíng" → [{syllable:"ài",tone:4},{syllable:"qíng",tone:2}] */
export function parsePinyinSyllables(pinyin: string): PinyinSyllable[] {
  const parts = pinyin
    .normalize("NFC")
    .split(/[\s'’·,，]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return parts.map((part) => {
    let tone = 0;
    // "ma3" маягийн тоон тэмдэглэгээ
    const numMatch = part.match(/([1-5])$/);
    if (numMatch) {
      const n = Number(numMatch[1]);
      return { syllable: part, tone: n === 5 ? 0 : n };
    }
    for (const ch of part) {
      const mark = TONE_MARKS[ch];
      if (mark) {
        tone = mark.tone;
        break;
      }
    }
    return { syllable: part, tone };
  });
}

/**
 * Аялгын жишиг муруй — Chao-гийн шатлал (1 нам … 5 өндөр).
 * T1: 55 (өндөр шулуун), T2: 35 (өгсөх), T3: 214 (хотгор), T4: 51 (уруудах).
 */
export function toneContour(tone: number): number[] {
  switch (tone) {
    case 1:
      return [5, 5, 5];
    case 2:
      return [3, 3.6, 5];
    case 3:
      return [2.2, 1, 1.2, 3.8];
    case 4:
      return [5, 3.5, 1];
    default:
      return [3, 3]; // саармаг — богино дунд өндөр
  }
}

export const TONE_LABELS_MN: Record<number, string> = {
  1: "1-р аялга — өндөр шулуун (ˉ)",
  2: "2-р аялга — өгсөх (ˊ)",
  3: "3-р аялга — хотгор (ˇ)",
  4: "4-р аялга — уруудах (ˋ)",
  0: "саармаг аялга",
};
