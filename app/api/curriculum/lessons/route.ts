import { getPublicLessonSummariesByCourseId } from "@/lib/content";
import {
  CURRICULUM_COURSE_IDS,
  isCurriculumCourseId,
  type CurriculumLessonOption,
} from "@/lib/classroom/types";

/**
 * Ангийн заавал хөтөлбөрт сонгох хичээлүүд (багшийн хуудас client component тул).
 * - `?courseId=hsk1` → тухайн түвшний нийтлэгдсэн хичээлүүд, курсын дарааллаар.
 * - `courseId` өгөөгүй → түвшин бүрийн нийтлэгдсэн хичээлийн тоо (хоосон түвшнийг идэвхгүй болгоход).
 * Зөвхөн нийтэд нээлттэй хичээлийн гарчиг буцаана — нэвтрэлт шаардлагагүй.
 */
export const dynamic = "force-dynamic";

function toOption(lesson: {
  id: string;
  title: string;
  chineseTitle?: string | null;
}): CurriculumLessonOption {
  return {
    id: lesson.id,
    title: lesson.title,
    chineseTitle: lesson.chineseTitle?.trim() ? lesson.chineseTitle : null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId")?.trim().toLowerCase() || null;

  try {
    if (!courseId) {
      const levels = await Promise.all(
        CURRICULUM_COURSE_IDS.map(async (id) => ({
          courseId: id,
          lessonCount: (await getPublicLessonSummariesByCourseId(id)).length,
        }))
      );
      return Response.json({ levels });
    }

    if (!isCurriculumCourseId(courseId)) {
      return Response.json({ error: "Unknown courseId", lessons: [] }, { status: 400 });
    }

    const lessons = await getPublicLessonSummariesByCourseId(courseId);
    return Response.json({ courseId, lessons: lessons.map(toOption) });
  } catch (error) {
    console.warn("[curriculum] lesson list failed", error);
    return Response.json({ error: "Lesson list failed", lessons: [] }, { status: 500 });
  }
}
