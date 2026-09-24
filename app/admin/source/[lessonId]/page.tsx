import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HskSourceLessonView } from "@/components/admin/source/hsk-source-lesson-view";
import { fetchHskSourceLesson } from "@/lib/admin/hsk-source-fetch";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lessonId: string }> };

export async function generateMetadata({ params }: Props) {
  const { lessonId } = await params;
  return { title: `Эх сурвалж · ${lessonId}` };
}

export default async function AdminSourceLessonPage({ params }: Props) {
  const { lessonId } = await params;
  const result = await fetchHskSourceLesson(lessonId);
  if (!result) notFound();
  const { row, payload } = result;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${row.book} · ${row.lesson}-р хичээл — ${row.title_zh}`}
        description="Номд байгаа агуулга, хэлбэрээрээ. Энэ хуудас юуг ч орчуулдаггүй, зохиодоггүй — хичээл үйлдвэрлэхийн эх сурвалж."
        actions={
          <Link href="/admin/source" className="admin-btn-secondary">
            ← Жагсаалт
          </Link>
        }
      />
      <HskSourceLessonView data={payload} />
    </div>
  );
}
