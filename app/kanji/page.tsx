import { KanjiAppView } from "@/components/mobile/kanji-app-view";
import { aggregateKanjiFromLessons } from "@/lib/mobile-app-vocab";
import { getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ханз — Бөөндөө Сурцгаая",
};

export default async function KanjiPage() {
  const lessons = await getPublicLessonsByCourseId("hsk5");
  const entries = aggregateKanjiFromLessons(lessons);
  const lessonVocab = lessons.map((lesson) => ({
    lessonId: lesson.id,
    vocabulary: lesson.vocabulary,
  }));

  return <KanjiAppView entries={entries} lessonVocab={lessonVocab} />;
}
