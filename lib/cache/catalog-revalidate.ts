import { revalidateTag } from "next/cache";
import { CATALOG_TAG, lessonCacheTag } from "./catalog-cache";

/** Admin бичлэг/импорт амжилттай болсны дараа дуудна (зөвхөн server route/action). */
export function revalidateCatalog(
  tags: (keyof typeof CATALOG_TAG)[] = ["lessons", "courses", "mockTests", "videos"]
) {
  for (const key of tags) {
    try {
      revalidateTag(CATALOG_TAG[key], "max");
    } catch {
      // Алдаа гарвал кэш 120с-д өөрөө хуучирна.
    }
  }
}

/**
 * Нэг хичээлийн бүтэн агуулгын кэш (`getPublicLessonById` → tag `lesson:<id>`) + жагсаалтын
 * кэшийг хуучруулна. Хичээлийн мөр/хүүхэд мөр засагдсан бүрт server талаас дуудна.
 */
export function revalidateLesson(lessonId: string) {
  try {
    revalidateTag(lessonCacheTag(lessonId), "max");
  } catch {
    // Алдаа гарвал кэш 120с-д өөрөө хуучирна.
  }
  revalidateCatalog(["lessons"]);
}
