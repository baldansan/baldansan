import { tr } from "@/lib/i18n/translate";
import type { UiLocale } from "@/lib/i18n/locale-types";

/** «Сүүлд идэвхтэй» огноог ойлгомжтой хэлбэрээр: Өнөөдөр / Өчигдөр / N өдрийн өмнө. */
export function formatKidLastActive(locale: UiLocale, iso: string | null): string {
  if (!iso) return tr(locale, "Хараахан хичээл хийгээгүй");
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return tr(locale, "Хараахан хичээл хийгээгүй");
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfThen = new Date(then);
  startOfThen.setHours(0, 0, 0, 0);
  const days = Math.round((startOfToday.getTime() - startOfThen.getTime()) / 86_400_000);
  if (days <= 0) return tr(locale, "Өнөөдөр идэвхтэй");
  if (days === 1) return tr(locale, "Өчигдөр идэвхтэй");
  return `${days} ${tr(locale, "өдрийн өмнө идэвхтэй")}`;
}
