import { WritingPracticeClient } from "@/components/writing/writing-practice-client";

export const metadata = {
  title: "Бичих дасгал — Бөөндөө Сурцгаая",
};

export default async function WritingPracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string; again?: string; lesson?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const start = typeof sp.start === "string" && sp.start.trim() ? sp.start.trim() : null;
  const again = sp.again === "1" || sp.again === "true";
  // Хичээлээс орж ирсэн бол буцах товч хичээл рүү аваачна.
  const fromLessonId = sp.lesson?.trim() || null;
  return <WritingPracticeClient listId={id} startChar={start} again={again} fromLessonId={fromLessonId} />;
}
