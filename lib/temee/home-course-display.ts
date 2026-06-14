import type { MobileCourseCatalogEntry } from "@/lib/mobile-course-options";

/** Full course heading for home lesson catalog (book-style list). */
export function formatHomeCourseListHeading(
  entry: MobileCourseCatalogEntry
): string {
  const title = entry.title.trim();
  const subtitle = entry.subtitle.trim();

  if (subtitle && subtitle !== "Удахгүй") {
    const titleLower = title.toLowerCase();
    const subLower = subtitle.toLowerCase();
    if (titleLower.includes(subLower) || subLower.includes(titleLower)) {
      return `${title} — ${subtitle}`;
    }
    return `${title} — ${subtitle}`;
  }

  return `${title} номын бүтэн хичээл`;
}
