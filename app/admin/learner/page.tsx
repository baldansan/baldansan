import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LearnerDetailView } from "@/components/admin/learner-detail-view";
import {
  getLearnerDetail,
  listLearnerOptions,
} from "@/lib/supabase/admin-learner";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Суралцагч — Admin",
};

type Props = {
  searchParams: Promise<{ user?: string }>;
};

export default async function AdminLearnerPage({ searchParams }: Props) {
  const params = await searchParams;
  const [learners, detail] = await Promise.all([
    listLearnerOptions(),
    getLearnerDetail(params.user ?? null),
  ]);

  if (!detail) {
    return (
      <div className="admin-panel p-6 text-sm text-slate-600">
        Supabase тохируулагдаагүй эсвэл өгөгдөл ачаалахад алдаа гарлаа.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Суралцагчийн дэлгэрэнгүй"
        description="Нэг идэвхтэй beta tester-ийн жинхэнэ туршлага — оролдлого, гацсан цэг, feedback."
      />
      <Suspense fallback={<p className="text-sm text-slate-500">Ачаалж байна…</p>}>
        <LearnerDetailView learners={learners} detail={detail} />
      </Suspense>
    </div>
  );
}
