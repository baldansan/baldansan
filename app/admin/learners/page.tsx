import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LearnerGradeBoardView } from "@/components/admin/learner-grade-board";
import { getLearnerGradeBoard } from "@/lib/supabase/admin-learner-grades";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Суралцагчдын үнэлгээ — Удирдлагын хэсэг",
};

export default async function AdminLearnersPage() {
  const board = await getLearnerGradeBoard();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Суралцагчдын үнэлгээ"
        description="Бүх суралцагчийг A–F үнэлгээгээр нь бүлэглэж, бүлэг тус бүрд онооны дарааллаар жагсаав."
      />
      <LearnerGradeBoardView board={board} />
    </div>
  );
}
