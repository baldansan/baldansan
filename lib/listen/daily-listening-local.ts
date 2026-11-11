/**
 * «Өнөөдрийн сонсгол»-ын дүнг локалд хадгалах — нүүрний картад «✓ 8/10»
 * харуулахад л зориулсан (нэвтрээгүй ч ажиллана). Жинхэнэ бүртгэл нь
 * question_attempts-д (record-question-attempt) хийгддэг.
 */

const KEY = "bs:daily-listen:v1";

export type DailyListeningResult = {
  dateKey: string;
  level: number;
  correct: number;
  total: number;
};

export function saveDailyListeningResult(r: DailyListeningResult): void {
  try {
    const raw = localStorage.getItem(KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, DailyListeningResult>) : {};
    all[`${r.dateKey}:${r.level}`] = r;
    // Хуучин өдрүүдийг хаяна (сүүлийн 14 бичлэг).
    const keys = Object.keys(all).sort();
    while (keys.length > 14) delete all[keys.shift() as string];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* localStorage байхгүй/хаалттай — чимээгүй */
  }
}

export function readDailyListeningResult(
  dateKey: string,
  level: number
): DailyListeningResult | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, DailyListeningResult>;
    return all[`${dateKey}:${level}`] ?? null;
  } catch {
    return null;
  }
}

/** Улаанбаатарын (UTC+8) өнөөдөр — серверийн ulaanbaatarDateKey-тэй ижил. */
export function todayKeyUB(): string {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}
