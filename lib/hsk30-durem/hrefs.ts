/**
 * HSK 3.0 дүрмийн замууд — JSON-гүй (hsk30-durem.json 474KB) тул client компонентод аюулгүй.
 * load-course.ts-ээс дахин экспортолдог; client файлууд ЭНД-ээс импортол.
 */
export const HSK30_DUREM_COURSE_ID = "hsk30-durem";
export const HSK30_REVIEW_BASE = "/review/grammar/hsk30";

export function hsk30LevelHref(levelId: string): string {
  return `${HSK30_REVIEW_BASE}/${levelId}`;
}

export function hsk30PointHref(levelId: string, pointId: string): string {
  return `${HSK30_REVIEW_BASE}/${levelId}/${pointId}`;
}
