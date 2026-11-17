import { BooksTabClient, type BooksTabEntry } from "@/components/books/books-tab-client";
import { loadMobileHomeData } from "@/lib/mobile-home-data";
import type { MobileCourseCatalogEntry } from "@/lib/mobile-course-options";

export const revalidate = 120;

export const metadata = {
  title: "Ном — Бөөндөө Сурцгаая",
  description: "HSK, 发展汉语, YCT — сурах номоо сонго.",
};

function slim(
  entries: MobileCourseCatalogEntry[],
  series: BooksTabEntry["series"]
): BooksTabEntry[] {
  return entries.map((entry) => ({
    key: `${series}:${entry.chipId}`,
    chipId: entry.chipId,
    series,
    label: entry.chipLabel,
    title: entry.title,
    coverUrl: entry.coverUrl ?? null,
    available: entry.available,
    lessonCount: entry.lessons.length,
    href: entry.allLessonsHref ?? `/courses/${entry.courseId}`,
  }));
}

/** «Ном» таб — бүх сурах бичиг нэг дор. Ном дээр дарахад хичээлийн жагсаалт нь нээгдэнэ. */
export default async function BooksTabPage() {
  const { catalog, fazhanCatalog, yctCatalog } = await loadMobileHomeData();
  return (
    <BooksTabClient
      standard={slim(catalog, "standard")}
      fazhan={slim(fazhanCatalog, "fazhan")}
      yct={slim(yctCatalog, "yct")}
    />
  );
}
