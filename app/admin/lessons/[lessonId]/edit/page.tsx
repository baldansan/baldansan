import Link from "next/link";
import { AdminAuthGate } from "@/components/admin/admin-auth-gate";
import { LessonEditForm } from "@/components/admin/lesson-edit-form";
import { EmptyState } from "@/components/empty-state";
import { getLessonById } from "@/lib/content";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lessonId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { lessonId } = await params;
  return { title: `Edit lesson ${lessonId} — Admin` };
}

export default async function AdminEditLessonPage({ params }: Props) {
  const { lessonId } = await params;
  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    return (
      <EmptyState
          title="Хичээл олдсонгүй"
          description={`"${lessonId}" ID-тай хичээл байхгүй. Supabase эсвэл local fallback шалгана уу.`}
          action={
            <Link
              href="/admin/lessons"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              ← Хичээл удирдах
            </Link>
          }
        />
    );
  }

  return (
    <AdminAuthGate>
      <LessonEditForm lesson={lesson} />
    </AdminAuthGate>
  );
}
