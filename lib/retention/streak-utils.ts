export function toLocalDateKey(iso: string | Date = new Date()): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return toLocalDateKey(date);
}

export function getActiveDatesFromLog(
  log: { date: string; activities: unknown[] }[]
): string[] {
  return log
    .filter((entry) => entry.activities.length > 0)
    .map((entry) => entry.date);
}

export function computeCurrentStreak(
  activeDates: string[],
  referenceDate = toLocalDateKey()
): number {
  const set = new Set(activeDates);
  if (set.size === 0) return 0;

  let cursor = referenceDate;
  if (!set.has(cursor)) {
    cursor = addDays(referenceDate, -1);
    if (!set.has(cursor)) return 0;
  }

  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Streak хамгаалалт (freeze): сард автоматаар хэрэглэгдэх дээд тоо. */
export const STREAK_FREEZES_PER_MONTH = 2;

export type StreakWithFreeze = {
  streak: number;
  /** Энэ сард хэрэглэгдсэн хамгаалалтын тоо. */
  freezesUsedThisMonth: number;
  /** Сарын нийт хамгаалалт (STREAK_FREEZES_PER_MONTH). */
  freezesTotal: number;
};

/**
 * Streak-ийг «хамгаалалттай» тооцно: 1 өдөр алгассан ч streak тасрахгүй.
 * Хамгаалалт нь зөвхөн ГАНЦ өдрийн цоорхойг нөхнө (2 өдөр дараалж алгасвал
 * тасарна) ба алгассан өдрийн сар бүрд хамгийн ихдээ
 * STREAK_FREEZES_PER_MONTH удаа автоматаар хэрэглэгдэнэ.
 */
export function computeStreakWithFreeze(
  activeDates: string[],
  referenceDate = toLocalDateKey(),
  freezesPerMonth = STREAK_FREEZES_PER_MONTH
): StreakWithFreeze {
  const currentMonth = referenceDate.slice(0, 7);
  const set = new Set(activeDates);
  if (set.size === 0) {
    return { streak: 0, freezesUsedThisMonth: 0, freezesTotal: freezesPerMonth };
  }

  // Өнөөдөр идэвхгүй байх нь алдаа биш — өдөр дуусаагүй тул өчигдрөөс эхэлнэ.
  let cursor = referenceDate;
  if (!set.has(cursor)) {
    cursor = addDays(referenceDate, -1);
  }

  const freezeByMonth = new Map<string, number>();
  let streak = 0;

  for (;;) {
    if (set.has(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
      continue;
    }
    // Цоорхой: өмнөх өдөр нь идэвхтэй бөгөөд тухайн сарын хамгаалалт
    // дуусаагүй бол freeze хэрэглэж үргэлжлүүлнэ.
    const prev = addDays(cursor, -1);
    const month = cursor.slice(0, 7);
    const used = freezeByMonth.get(month) ?? 0;
    if (set.has(prev) && used < freezesPerMonth) {
      freezeByMonth.set(month, used + 1);
      cursor = prev;
      continue;
    }
    break;
  }

  return {
    streak,
    freezesUsedThisMonth: freezeByMonth.get(currentMonth) ?? 0,
    freezesTotal: freezesPerMonth,
  };
}

export function computeLongestStreak(activeDates: string[]): number {
  if (activeDates.length === 0) return 0;

  const sorted = [...new Set(activeDates)].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    if (addDays(prev, 1) === next) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

export function getWeekActivity(
  activeDates: string[],
  referenceDate = toLocalDateKey()
) {
  const set = new Set(activeDates);
  const weekActivity: boolean[] = [];
  let activeDaysThisWeek = 0;

  for (let offset = 6; offset >= 0; offset -= 1) {
    const dateKey = addDays(referenceDate, -offset);
    const active = set.has(dateKey);
    weekActivity.push(active);
    if (active) activeDaysThisWeek += 1;
  }

  return { weekActivity, activeDaysThisWeek };
}

export function getLastActiveDate(activeDates: string[]): string | null {
  if (activeDates.length === 0) return null;
  return [...activeDates].sort().at(-1) ?? null;
}

export function getActiveDatesFromSupabaseRows(
  rows: { activity_date: string; count: number }[]
): string[] {
  const dates = new Set<string>();
  for (const row of rows) {
    if (row.count > 0) {
      dates.add(row.activity_date);
    }
  }
  return [...dates];
}
