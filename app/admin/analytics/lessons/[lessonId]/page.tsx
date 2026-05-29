import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { LessonAnalyticsDetailView } from "@/components/admin/lesson-analytics-detail-view";
import { getLessonAnalyticsById } from "@/lib/supabase/admin-analytics";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lessonId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { lessonId } = await params;
  return { title: `Lesson ${lessonId} analytics — Admin` };
}

export default async function AdminLessonAnalyticsPage({ params }: Props) {
  const { lessonId } = await params;
  const detail = await getLessonAnalyticsById(lessonId);

  if (!detail) {
    return (
      <EmptyState
        title="Хичээл олдсонгүй"
        description={`"${lessonId}" ID-тай хичээл analytics-д байхгүй.`}
        action={
          <Link
            href="/admin/analytics"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            ← Learning analytics
          </Link>
        }
      />
    );
  }

  return <LessonAnalyticsDetailView detail={detail} />;
}
