import { notFound } from "next/navigation";
import { getLessonById } from "@/lib/content";
import { LessonWatchClient } from "./watch-client";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonWatchPage({ params }: PageProps) {
  const { lessonId } = await params;
  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    notFound();
  }

  return <LessonWatchClient lesson={lesson} />;
}
