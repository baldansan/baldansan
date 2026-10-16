import {
  buildFazhanCourseCatalog,
  buildHomeCourseCatalog,
  defaultFazhanChipId,
  defaultHomeChipId,
  FAZHAN_HOME_LEVELS,
  type HskHomeLevelId,
  type MobileCourseCatalogEntry,
} from "@/lib/mobile-course-options";
import { koreanChipTitle } from "@/lib/course-display";
import {
  getCourseContentById,
  getPublicLessonSummariesByCourseId,
} from "@/lib/content";
import { getStories } from "@/lib/library/data";
import type { LibraryPreviewItem } from "@/components/mobile/library-preview-row";
import { fetchVideoSeriesCatalogCached } from "@/lib/supabase/videos-server";

/** Нүүрний «Өнөөдрийн бичлэг» — үргэлжлүүлэх бичлэггүй үед санал болгох цуврал. */
export type BichlegSuggestion = {
  href: string;
  title: string;
  subtitle: string;
};

export type MobileHomeData = {
  catalog: MobileCourseCatalogEntry[];
  defaultChipId: string;
  fazhanCatalog: MobileCourseCatalogEntry[];
  fazhanDefaultChipId: string;
  libraryPreview: LibraryPreviewItem[];
  bichlegSuggestion: BichlegSuggestion | null;
};

type KoreanLoadResult = {
  courseId: string;
  title: string;
  subtitle: string;
  lessons: Awaited<ReturnType<typeof getPublicLessonSummariesByCourseId>>;
} | null;

const HSK_LEVEL_IDS: HskHomeLevelId[] = [
  "hsk1",
  "hsk2",
  "hsk3",
  "hsk4",
  "hsk5",
  "hsk6",
];

async function loadKoreanCourseForHome(): Promise<KoreanLoadResult> {
  const candidates = ["korean-level-1", "korean-1", "korean-survival"] as const;

  for (const courseId of candidates) {
    const [lessons, course] = await Promise.all([
      loadPublishedSummaries(courseId),
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

/**
 * Home only ever lists lessons a learner can open. The public query is
 * meant to return `available` rows only, but be explicit here so a draft
 * can never be counted toward "N хичээл нээлттэй" on the hero.
 */
async function loadPublishedSummaries(courseId: string) {
  const lessons = await getPublicLessonSummariesByCourseId(courseId);
  return lessons.filter((lesson) => lesson.publishStatus === "available");
}

async function loadHskLevelForHome(courseId: HskHomeLevelId) {
  const [lessons, course] = await Promise.all([
    loadPublishedSummaries(courseId),
    getCourseContentById(courseId),
  ]);

  const defaultTitles: Record<HskHomeLevelId, string> = {
    hsk1: "HSK 1",
    hsk2: "HSK 2",
    hsk3: "HSK 3",
    hsk4: "HSK 4",
    hsk5: "HSK 5",
    hsk6: "HSK 6",
  };

  return {
    title: course?.title ?? defaultTitles[courseId],
    subtitle: course?.subtitle ?? "",
    coverUrl: course?.coverUrl ?? null,
    lessons,
  };
}

async function loadFazhanCourseForHome(courseId: string) {
  const [lessons, course] = await Promise.all([
    loadPublishedSummaries(courseId),
    getCourseContentById(courseId),
  ]);

  return {
    courseId,
    title: course?.title ?? "",
    subtitle: course?.subtitle ?? "",
    coverUrl: course?.coverUrl ?? null,
    lessons,
  };
}

async function loadLibraryPreviewForHome(): Promise<LibraryPreviewItem[]> {
  try {
    const stories = await getStories();
    return stories.slice(0, 8).map((s) => ({
      id: s.id,
      title: s.title,
      titlePinyin: s.title_pinyin,
      cover: s.cover,
      level: s.level,
    }));
  } catch {
    return [];
  }
}

/** Хамгийн доод HSK түвшний, бичлэгтэй цувралыг санал болгоно (кэштэй каталог). */
async function loadBichlegSuggestionForHome(): Promise<BichlegSuggestion | null> {
  try {
    const series = await fetchVideoSeriesCatalogCached();
    const withVideos = series.filter((s) => s.videoCount > 0);
    if (withVideos.length === 0) return null;
    withVideos.sort(
      (a, b) => (a.hsk_level ?? 99) - (b.hsk_level ?? 99) || b.videoCount - a.videoCount
    );
    const pick = withVideos[0]!;
    const title = pick.title_mn ?? pick.title_zh ?? "Бичлэг";
    const level = pick.hsk_level != null ? `HSK ${pick.hsk_level} · ` : "";
    return {
      href: `/bichleg/${encodeURIComponent(pick.id)}`,
      title,
      subtitle: `${level}${pick.videoCount} бичлэг`,
    };
  } catch {
    return null;
  }
}

export async function loadMobileHomeData(): Promise<MobileHomeData> {
  const [hskLevels, korean, fazhanLevels, libraryPreview, bichlegSuggestion] =
    await Promise.all([
      Promise.all(HSK_LEVEL_IDS.map((id) => loadHskLevelForHome(id))),
      loadKoreanCourseForHome(),
      Promise.all(
        FAZHAN_HOME_LEVELS.map((level) => loadFazhanCourseForHome(level.courseId))
      ),
      loadLibraryPreviewForHome(),
      loadBichlegSuggestionForHome(),
    ]);

  const hsk: Partial<
    Record<HskHomeLevelId, Awaited<ReturnType<typeof loadHskLevelForHome>>>
  > = {};
  for (let i = 0; i < HSK_LEVEL_IDS.length; i++) {
    hsk[HSK_LEVEL_IDS[i]!] = hskLevels[i];
  }

  const catalog = buildHomeCourseCatalog(
    hsk,
    korean
      ? {
          courseId: korean.courseId,
          title: korean.title,
          subtitle: korean.subtitle,
          coverUrl: null,
          lessons: korean.lessons,
        }
      : null
  );

  const fazhanByCourseId: Partial<
    Record<string, Awaited<ReturnType<typeof loadFazhanCourseForHome>>>
  > = {};
  for (let i = 0; i < FAZHAN_HOME_LEVELS.length; i++) {
    fazhanByCourseId[FAZHAN_HOME_LEVELS[i]!.courseId] = fazhanLevels[i];
  }
  const fazhanCatalog = buildFazhanCourseCatalog(fazhanByCourseId);

  return {
    catalog,
    defaultChipId: defaultHomeChipId(catalog),
    fazhanCatalog,
    fazhanDefaultChipId: defaultFazhanChipId(fazhanCatalog),
    libraryPreview,
    bichlegSuggestion,
  };
}
