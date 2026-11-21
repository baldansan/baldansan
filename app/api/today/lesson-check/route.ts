import { getPublicLessonById } from "@/lib/content";

/**
 * GET ?lessonId= → { title, words:[{zh,pinyin,mn}] } — «Оройн шалгалт / өчигдрийнхөө шалгалт»-д
 * хичээлийн үгсийг буцаана.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId")?.trim() || "";
  if (!lessonId) {
    return Response.json({ error: "lessonId required", words: [] }, { status: 400 });
  }
  try {
    const lesson = await getPublicLessonById(lessonId);
    if (!lesson) {
      return Response.json({ error: "Lesson not found", words: [] }, { status: 404 });
    }
    const seen = new Set<string>();
    const words = lesson.vocabulary
      .map((w) => ({
        zh: w.chinese?.trim() ?? "",
        pinyin: w.pinyin?.trim() ?? "",
        mn: w.mongolian?.trim() ?? "",
      }))
      .filter((w) => {
        if (!w.zh || !w.mn || seen.has(w.zh)) return false;
        seen.add(w.zh);
        return true;
      });
    return Response.json({
      lessonId: lesson.id,
      title: lesson.chineseTitle || lesson.title,
      words,
    });
  } catch (error) {
    console.warn("[today] lesson check failed", error);
    return Response.json({ error: "Lesson check failed", words: [] }, { status: 500 });
  }
}
