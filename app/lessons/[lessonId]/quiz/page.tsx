import { notFound } from "next/navigation";
import { getLessonById } from "@/lib/content";
import { LessonQuizClient } from "./quiz-client";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonQuizPage({ params }: PageProps) {
  const { lessonId } = await params;
  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    notFound();
  }

  return <LessonQuizClient lesson={lesson} />;
}
