import { notFound } from "next/navigation";
import { KanjiDetailClient } from "@/components/mobile/kanji-detail-client";
import { getPublicLessonsByCourseId } from "@/lib/content";
import type { VocabularyWord } from "@/types/lesson";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ vocabId: string }>;
  searchParams: Promise<{ lessonId?: string }>;
};

function findVocabInLessons(
  vocabId: string,
  lessons: Awaited<ReturnType<typeof getPublicLessonsByCourseId>>
): { word: VocabularyWord; lessonId: string } | null {
  const decoded = decodeURIComponent(vocabId);
  for (const lesson of lessons) {
    for (const word of lesson.vocabulary) {
      if (
        word.id === decoded ||
        word.id === vocabId ||
        word.chinese === decoded
      ) {
        return { word, lessonId: lesson.id };
      }
    }
  }
  return null;
}

export async function generateMetadata({ params }: PageProps) {
  const { vocabId } = await params;
  const decoded = decodeURIComponent(vocabId);
  return { title: `${decoded} — Ханз` };
}

export default async function KanjiDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { vocabId } = await params;
  const { lessonId: preferredLessonId } = await searchParams;
  const lessons = await getPublicLessonsByCourseId("hsk5");
  const found = findVocabInLessons(vocabId, lessons);

  if (!found) {
    notFound();
  }

  const lessonId =
    preferredLessonId && lessons.some((l) => l.id === preferredLessonId)
      ? preferredLessonId
      : found.lessonId;

  return (
    <KanjiDetailClient
      word={found.word}
      lessonId={lessonId}
      taskCount={lessons.filter((l) =>
        l.vocabulary.some(
          (w) =>
            w.chinese === found.word.chinese ||
            w.id === found.word.id
        )
      ).length}
    />
  );
}
