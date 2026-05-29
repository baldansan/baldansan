import {
  buildHomeCourseCatalog,
  defaultHomeChipId,
  type MobileCourseCatalogEntry,
} from "@/lib/mobile-course-options";
import { koreanChipTitle } from "@/lib/course-display";
import { getCourseContentById, getPublicLessonsByCourseId } from "@/lib/content";

export type MobileHomeData = {
  catalog: MobileCourseCatalogEntry[];
  defaultChipId: string;
};

type KoreanLoadResult = {
  courseId: string;
  title: string;
  subtitle: string;
  lessons: Awaited<ReturnType<typeof getPublicLessonsByCourseId>>;
} | null;

async function loadKoreanCourseForHome(): Promise<KoreanLoadResult> {
  const candidates = ["korean-level-1", "korean-1", "korean-survival"] as const;

  for (const courseId of candidates) {
    const [lessons, course] = await Promise.all([
      getPublicLessonsByCourseId(courseId),
      getCourseContentById(courseId),
    ]);

    if (course || lessons.length > 0) {
      return {
        courseId,
        title: course?.title ?? koreanChipTitle(),
        subtitle:
          course?.subtitle ??
          "Солонгос үсэг, үндсэн үг, ажил амьдралд хэрэгтэй хэллэг",
        lessons,
      };
    }
  }

  return null;
}

export async function loadMobileHomeData(): Promise<MobileHomeData> {
  const [hsk5Lessons, hsk5Course, korean] = await Promise.all([
    getPublicLessonsByCourseId("hsk5"),
    getCourseContentById("hsk5"),
    loadKoreanCourseForHome(),
  ]);

  const catalog = buildHomeCourseCatalog(
    {
      title: hsk5Course?.title ?? "HSK5 Short Drama Chinese",
      subtitle: hsk5Course?.subtitle ?? "Богино бичлэг, үгийн сан, quiz",
      lessons: hsk5Lessons,
    },
    korean
      ? {
          courseId: korean.courseId,
          title: korean.title,
          subtitle: korean.subtitle,
          lessons: korean.lessons,
        }
      : null
  );

  return {
    catalog,
    defaultChipId: defaultHomeChipId(catalog),
  };
}
