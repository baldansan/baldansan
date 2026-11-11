import { FazhanCoursePage } from "@/components/courses/fazhan-course-page";
import { KidsCourseHome } from "@/components/kids/kids-course-home";
import { getCourseContentById, getPublicLessonSummariesByCourseId } from "@/lib/content";
import { courseSeriesMeta } from "@/lib/lesson/course-series-label";

type Props = { courseId: string; searchParams: Promise<{ view?: string }> };

/**
 * YCT номын хуудас. Анхдагч нь хүүхдийн нүүр (том карт, од, наалт);
 * `?view=list` бол багш/эцэг эхийн ердийн жагсаалт.
 */
export async function YctCoursePage({ courseId, searchParams }: Props) {
  const { view } = await searchParams;
  if (view === "list") return <FazhanCoursePage courseId={courseId} />;

  const meta = courseSeriesMeta(courseId);
  const [course, lessons] = await Promise.all([getCourseContentById(courseId), getPublicLessonSummariesByCourseId(courseId)]);
  if (!lessons.length) return <FazhanCoursePage courseId={courseId} />;

  return (
    <KidsCourseHome
      courseId={courseId}
      title={course?.title ?? meta?.title ?? courseId}
      subtitle={course?.subtitle ?? meta?.subtitle ?? ""}
      lessons={lessons.map((l) => ({
        id: l.id,
        title: l.title.replace(/^.*—\s*/, ""),
        titleZh: l.chineseTitle ?? "",
        imageUrl: l.imageUrl ?? l.thumbnailUrl ?? null,
      }))}
    />
  );
}
