import { getPublicLessonById } from "@/lib/content";
import { lookupWritingText } from "@/lib/writing/lookup";

/**
 * GET ?lessonId= → { items } — хичээлийн үгсийн сангийн ханзнуудыг
 * «Бичих дэвтэр»-ийн хэлбэрээр (lookup логикоор) буцаана.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId")?.trim() || "";
  if (!lessonId) {
    return Response.json({ error: "lessonId required", items: [] }, { status: 400 });
  }
  try {
    const lesson = await getPublicLessonById(lessonId);
    if (!lesson) {
      return Response.json({ error: "Lesson not found", items: [] }, { status: 404 });
    }
    const text = lesson.vocabulary
      .map((w) => w.chinese?.trim())
      .filter(Boolean)
      .join(" ");
    const { items } = await lookupWritingText(text);
    return Response.json({ lessonId: lesson.id, title: lesson.title, items });
  } catch (error) {
    console.warn("[writing] lesson words failed", error);
    return Response.json({ error: "Lesson words failed", items: [] }, { status: 500 });
  }
}
