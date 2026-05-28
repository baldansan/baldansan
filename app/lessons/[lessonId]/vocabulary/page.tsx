import { notFound } from "next/navigation";
import { getLessonById } from "@/lib/content";
import { LessonVocabularyClient } from "./vocabulary-client";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonVocabularyPage({ params }: PageProps) {
  const { lessonId } = await params;
  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    notFound();
  }

  return <LessonVocabularyClient lesson={lesson} />;
}
