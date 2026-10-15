/**
 * Нийтийн каталогийн кэшийн tag-ууд (unstable_cache). Root layout cookies() уншдаг тул
 * бүх хуудас dynamic — ISR ажиллахгүй. Тиймээс DB-ийн нийтийн хэсгийг (хичээлийн жагсаалт,
 * курс, mock test, бичлэгийн цуврал) энэ tag-уудаар Data Cache-д 120с хадгална.
 *
 * Энэ файл client bundle-д ч орж болно (lib/content.ts-ээр) тул next/cache импортлохгүй —
 * хуучруулах функц `catalog-revalidate.ts`-д (зөвхөн server route).
 */
export const CATALOG_TAG = {
  lessons: "catalog:lessons",
  courses: "catalog:courses",
  mockTests: "catalog:mock-tests",
  videos: "catalog:videos",
} as const;

export const CATALOG_REVALIDATE_SECONDS = 120;
