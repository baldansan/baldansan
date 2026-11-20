import { WritingLessonStartClient } from "@/components/writing/writing-lesson-start-client";

export const metadata = {
  title: "Хичээлийн ханз — Ханзны дэвтэр | Бөөндөө Сурцгаая",
};

/** Хичээлийн ханзаар дэвтэр үүсгээд (эсвэл өмнөхийг нь олоод) шууд бичих дасгал руу оруулна. */
export default async function WritingLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  return <WritingLessonStartClient lessonId={decodeURIComponent(lessonId)} />;
}
