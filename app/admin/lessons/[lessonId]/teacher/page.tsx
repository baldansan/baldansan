import { AdminEditLessonNotFound } from "@/components/admin/admin-edit-lesson-not-found";
import { LessonTeacherOverlayEditor } from "@/components/admin/lesson-teacher-overlay-editor";
import { getAdminLessonById } from "@/lib/admin/lesson-fetch";
import { extractTeacherOverlayFromSourceNote } from "@/lib/lesson/teacher-overlay-admin";
import { normalizeLessonRouteId } from "@/lib/lesson-id";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lessonId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { lessonId } = await params;
  return { title: `Багшийн давхарга — ${lessonId} — Admin` };
}

export default async function AdminLessonTeacherOverlayPage({ params }: Props) {
  const { lessonId } = await params;
  const normalizedId = normalizeLessonRouteId(lessonId);
  const lesson = await getAdminLessonById(normalizedId);

  if (!lesson) {
    return <AdminEditLessonNotFound lessonId={normalizedId} />;
  }

  const initial = extractTeacherOverlayFromSourceNote(lesson.sourceNote);

  return (
    <LessonTeacherOverlayEditor lesson={lesson} initial={initial} />
  );
}
