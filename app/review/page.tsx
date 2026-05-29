import { getPublicLessonsByCourseId } from "@/lib/content";
import { ReviewDashboard } from "./review-dashboard";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const lessons = await getPublicLessonsByCourseId("hsk5");

  const lessonSnapshots = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    chineseTitle: lesson.chineseTitle,
    vocabulary: lesson.vocabulary,
  }));

  return <ReviewDashboard lessons={lessonSnapshots} lessonIds={lessons.map((l) => l.id)} />;
}
