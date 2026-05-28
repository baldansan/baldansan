import { notFound } from "next/navigation";
import {
  findNextLessonId,
  getLessonById,
  getLessonsByCourseId,
} from "@/lib/content";
import { LessonQuizClient } from "./quiz-client";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export const dynamic = "force-dynamic";

export default async function LessonQuizPage({ params }: PageProps) {
  const { lessonId } = await params;
  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    notFound();
  }

  const courseLessons = await getLessonsByCourseId(lesson.courseId);
  const nextLessonId = findNextLessonId(lessonId, courseLessons);

  return <LessonQuizClient lesson={lesson} nextLessonId={nextLessonId} />;
}
