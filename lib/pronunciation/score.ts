/**
 * Дуудлагын үнэлгээ: таних системээс ирсэн текстийг зорилтот текстэй
 * ханз тус бүрээр харьцуулна (Levenshtein alignment), дараа нь пиньинь/хөг.
 *
 * Санаа: таних систем ТЕКСТ буцаадаг тул ижил дуудлагатай өөр ханз (омоним)
 * гарч ирвэл дуудлага ЗӨВ гэсэн үг — үүнийг «homophone» гэж ялгаж ногоон
 * тооцно. Үндэс нь ижил, хөг нь зөрвөл «tone» (шар), бусад нь «wrong» (улаан).
 */

import { alignToneUnits, isCjkChar, toneOfSyllable, type Tone } from "@/lib/pinyin/tone";

export type CharStatus =
  | "ok" // яг ижил ханз
  | "homophone" // өөр ханз, ижил дуудлага
  | "tone" // ижил үндэс, хөг зөрсөн
  | "wrong" // огт өөр авиа
  | "missing"; // хэлээгүй / танигдаагүй

export type CharResult = {
  /** Зорилтот ханз */
  hanzi: string;
  /** Зорилтот пиньинь (хөгийн тэмдэгтэй, байвал) */
  pinyin: string;
  status: CharStatus;
  /** Танигдсан ханз (ok биш үед) */
  heard?: string;
  /** Танигдсан пиньинь (тоон хөгтэй, ж: hao3) */
  heardPinyin?: string;
  targetTone?: Tone;
  heardTone?: Tone;
};

export type PronunciationScore = {
  /** 0–100 */
  percent: number;
  chars: CharResult[];
  /** Хамгийн сайн таарсан танилт */
  heard: string;
  /** Хөгийн зөрүүтэй ханзын тоо */
  toneErrors: number;
  /** Зорилтод байхгүй, илүү танигдсан ханзын тоо */
  extra: number;
};

type Syl = { base: string; tone: Tone };

const MARK_TO_PLAIN: Record<string, string> = {
  ā: "a", á: "a", ǎ: "a", à: "a",
  ē: "e", é: "e", ě: "e", è: "e",
  ī: "i", í: "i", ǐ: "i", ì: "i",
  ō: "o", ó: "o", ǒ: "o", ò: "o",
  ū: "u", ú: "u", ǔ: "u", ù: "u",
  ǖ: "ü", ǘ: "ü", ǚ: "ü", ǜ: "ü",
  ê: "e",
};

/** «hǎo» | «hao3» | «hao» → {base:"hao", tone} */
export function normalizeSyllable(raw: string): Syl {
  const s = raw.normalize("NFC").trim().toLowerCase();
  const tone = toneOfSyllable(s);
  let base = "";
  for (const ch of s) {
    if (/[1-5]/.test(ch)) continue;
    base += MARK_TO_PLAIN[ch] ?? ch;
  }
  base = base.replace(/v/g, "ü").replace(/[^a-zü]/g, "");
  return { base, tone };
}

function cjkChars(text: string): string[] {
  return Array.from(text).filter(isCjkChar);
}

/** Levenshtein alignment: зорилтот ханз бүрд → таарсан танигдсан ханзны индекс (эсвэл null). */
export function alignHanzi(
  target: string[],
  heard: string[]
): { pairs: (number | null)[]; extra: number } {
  const n = target.length;
  const m = heard.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i]![0] = i;
  for (let j = 0; j <= m; j++) dp[0]![j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = target[i - 1] === heard[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost
      );
    }
  }
  const pairs: (number | null)[] = new Array(n).fill(null);
  let extra = 0;
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const cost = target[i - 1] === heard[j - 1] ? 0 : 1;
      if (dp[i]![j] === dp[i - 1]![j - 1]! + cost) {
        pairs[i - 1] = j - 1;
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && dp[i]![j] === dp[i - 1]![j]! + 1) {
      pairs[i - 1] = null;
      i--;
      continue;
    }
    // heard-д илүү ханз
    extra++;
    j--;
  }
  return { pairs, extra };
}

/** Хөг зөрүү тооцохгүй ханзууд (sandhi: 不 bù/bú, 一 yī/yí/yì). */
const TONE_LENIENT = new Set(["不", "一"]);

function tonesMatch(hanzi: string, a: Tone, b: Tone): boolean {
  if (a === b) return true;
  if (a === 0 || b === 0) return true; // 轻声 хувилбар
  if (TONE_LENIENT.has(hanzi)) return true;
  return false;
}

type PinyinFn = (
  text: string,
  opts: { type: "array"; toneType: "num"; nonZh: "removed" }
) => string[];

let pinyinFnPromise: Promise<PinyinFn> | null = null;
/** pinyin-pro-г хэрэг болох үед л ачаална (~500KB). */
function loadPinyinFn(): Promise<PinyinFn> {
  if (!pinyinFnPromise) {
    pinyinFnPromise = import("pinyin-pro").then((m) => m.pinyin as unknown as PinyinFn);
  }
  return pinyinFnPromise;
}

function sylsFor(chars: string[], pinyinOf: PinyinFn): Syl[] {
  if (chars.length === 0) return [];
  const arr = pinyinOf(chars.join(""), { type: "array", toneType: "num", nonZh: "removed" });
  return chars.map((_, k) => normalizeSyllable(arr[k] ?? ""));
}

/** Зорилтот пиньинь: эхлээд хичээлийн өгөгдлөөс (alignToneUnits), таарахгүй бол pinyin-pro. */
function targetSyllables(
  chars: string[],
  targetText: string,
  targetPinyin: string | null | undefined,
  pinyinOf: PinyinFn
): { syl: Syl; display: string }[] {
  const units = alignToneUnits(targetText, targetPinyin);
  if (units) {
    const cjkUnits = units.filter((u) => isCjkChar(u.hanzi));
    if (cjkUnits.length === chars.length) {
      return cjkUnits.map((u) => ({ syl: normalizeSyllable(u.pinyin), display: u.pinyin }));
    }
  }
  return sylsFor(chars, pinyinOf).map((syl) => ({
    syl,
    display: syl.base + (syl.tone ? String(syl.tone) : ""),
  }));
}

function scoreOne(
  targetText: string,
  targetPinyin: string | null | undefined,
  heardText: string,
  pinyinOf: PinyinFn
): PronunciationScore {
  const tChars = cjkChars(targetText);
  const hChars = cjkChars(heardText);
  const tSyl = targetSyllables(tChars, targetText, targetPinyin, pinyinOf);
  const hSylAll = sylsFor(hChars, pinyinOf);

  const { pairs, extra } = alignHanzi(tChars, hChars);

  let sum = 0;
  let toneErrors = 0;
  const chars: CharResult[] = tChars.map((hanzi, i) => {
    const t = tSyl[i]!;
    const hi = pairs[i];
    if (hi == null) {
      return { hanzi, pinyin: t.display, status: "missing", targetTone: t.syl.tone };
    }
    const heard = hChars[hi]!;
    const h = hSylAll[hi] ?? normalizeSyllable("");
    const heardPinyin = h.base + (h.tone ? String(h.tone) : "");
    if (heard === hanzi) {
      sum += 1;
      return { hanzi, pinyin: t.display, status: "ok", targetTone: t.syl.tone };
    }
    if (h.base && h.base === t.syl.base) {
      if (tonesMatch(hanzi, t.syl.tone, h.tone)) {
        sum += 1;
        return {
          hanzi, pinyin: t.display, status: "homophone", heard, heardPinyin,
          targetTone: t.syl.tone, heardTone: h.tone,
        };
      }
      sum += 0.5;
      toneErrors++;
      return {
        hanzi, pinyin: t.display, status: "tone", heard, heardPinyin,
        targetTone: t.syl.tone, heardTone: h.tone,
      };
    }
    return {
      hanzi, pinyin: t.display, status: "wrong", heard, heardPinyin,
      targetTone: t.syl.tone, heardTone: h.tone,
    };
  });

  const n = tChars.length || 1;
  // Илүү ханз бага зэрэг хасна (нэг бүрд 5%, дээд тал нь 20%)
  const penalty = Math.min(0.2, extra * 0.05);
  const percent = Math.max(0, Math.round((sum / n - penalty) * 100));
  return { percent, chars, heard: heardText, toneErrors, extra };
}

/**
 * Таних системийн бүх хувилбараас хамгийн өндөр оноотойг сонгоно.
 */
export async function scorePronunciation(
  targetText: string,
  targetPinyin: string | null | undefined,
  alternatives: string[]
): Promise<PronunciationScore> {
  const pinyinOf = await loadPinyinFn();
  const alts = alternatives.length ? alternatives : [""];
  let best: PronunciationScore | null = null;
  for (const alt of alts) {
    const s = scoreOne(targetText, targetPinyin, alt, pinyinOf);
    if (!best || s.percent > best.percent) best = s;
    if (best.percent >= 100) break;
  }
  return best!;
}

/** 80%+ → оноо (points «game» эх сурвалж, дээд тал 30). */
export function pronunciationPoints(percent: number): number {
  if (percent >= 100) return 20;
  if (percent >= 90) return 15;
  if (percent >= 80) return 10;
  return 0;
}

export function scoreVerdictMn(percent: number): string {
  if (percent >= 100) return "Төгс! 🎉";
  if (percent >= 90) return "Маш сайн!";
  if (percent >= 80) return "Сайн байна";
  if (percent >= 50) return "Ойрхон — дахин оролдоорой";
  return "Дахин сонсоод давтаарай";
}
