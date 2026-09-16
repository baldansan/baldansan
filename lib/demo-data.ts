/**
 * Marking example data apart from real data.
 *
 * `supabase/demo/seed-training-center.sql` fills a demonstration training
 * centre — twelve classes, teachers, students and results — so the product can
 * be shown with something in it. Those rows live in the same tables as real
 * users, so every admin screen that counts learners has to be able to say
 * which is which. Months from now, a number that silently mixed the two would
 * be worse than no number at all.
 *
 * The seed gives every row it creates an id under one prefix, which is all the
 * signal needed here.
 */

export const DEMO_ID_PREFIX = "d0000000-0000-4000-8000-";

export const DEMO_BADGE_LABEL = "Жишээ";

export const DEMO_DATA_NOTE =
  "«Жишээ» тэмдэгтэй мөрүүд нь үзүүлэх зорилгоор үүсгэсэн өгөгдөл — жинхэнэ хэрэглэгч биш.";

/** True when this id was created by the demo seed script. */
export function isDemoId(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.toLowerCase().startsWith(DEMO_ID_PREFIX);
}

/** Split any id-bearing rows into real and example, preserving order. */
export function partitionDemoRows<T>(
  rows: readonly T[],
  getId: (row: T) => string | null | undefined
): { real: T[]; demo: T[] } {
  const real: T[] = [];
  const demo: T[] = [];
  for (const row of rows) {
    if (isDemoId(getId(row))) demo.push(row);
    else real.push(row);
  }
  return { real, demo };
}
