import { getPublicLessonSummariesByCourseId } from "@/lib/content";
import { courseDisplayTitle } from "@/lib/course-display-meta";
import {
  defaultCoverUrl,
  FAZHAN_HOME_LEVELS,
  YCT_HOME_LEVELS,
} from "@/lib/mobile-course-options";

/**
 * Ханзны дэвтэр → «Хичээлээс»: эхлээд НОМОО сонгоно, дараа нь тэр номын хичээлээ.
 * - параметргүй → нийтлэгдсэн хичээлтэй номууд (бүлгээр), хичээлийн тоотой.
 * - `?courseId=` → тэр номын нийтлэгдсэн хичээлүүд, номын дарааллаар.
 * Зөвхөн нийтэд нээлттэй гарчиг буцаана (кэштэй жагсаалтаас) — нэвтрэлт шаардлагагүй.
 */
export const dynamic = "force-dynamic";

type BookDef = { courseId: string; label: string; group: string };

const XINHSK = new Set(["xinhsk1", "xinhsk2", "xinhsk3", "xinhsk4a"]);

const BOOKS: BookDef[] = [
  ...FAZHAN_HOME_LEVELS.filter((l) => XINHSK.has(l.courseId)).map((l) => ({
    courseId: l.courseId,
    label: l.chipLabel,
    group: "Шинэ HSK 3.0",
  })),
  ...["hsk1", "hsk2", "hsk3", "hsk4", "hsk5", "hsk6"].map((id) => ({
    courseId: id,
    label: `HSK ${id.slice(3)}`,
    group: "HSK стандарт сурах бичиг",
  })),
  ...FAZHAN_HOME_LEVELS.filter((l) => !XINHSK.has(l.courseId)).map((l) => ({
    courseId: l.courseId,
    label: l.chipLabel,
    group: "Fazhan Hanyu",
  })),
  ...YCT_HOME_LEVELS.map((l) => ({
    courseId: l.courseId,
    label: l.chipLabel,
    group: "YCT (хүүхдийн)",
  })),
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId")?.trim().toLowerCase() || null;

  try {
    if (!courseId) {
      const rows = await Promise.all(
        BOOKS.map(async (b) => ({
          courseId: b.courseId,
          group: b.group,
          title: courseDisplayTitle(b.courseId, null, b.label),
          coverUrl: defaultCoverUrl(b.courseId),
          lessonCount: (await getPublicLessonSummariesByCourseId(b.courseId)).length,
        }))
      );
      return Response.json({ books: rows.filter((r) => r.lessonCount > 0) });
    }

    if (!BOOKS.some((b) => b.courseId === courseId)) {
      return Response.json({ error: "Unknown courseId", lessons: [] }, { status: 400 });
    }
    const lessons = await getPublicLessonSummariesByCourseId(courseId);
    return Response.json({
      courseId,
      lessons: lessons.map((l) => ({
        id: l.id,
        title: l.title,
        chineseTitle: l.chineseTitle?.trim() ? l.chineseTitle : null,
      })),
    });
  } catch (error) {
    console.warn("[writing] book list failed", error);
    return Response.json({ error: "Book list failed", books: [], lessons: [] }, { status: 500 });
  }
}
