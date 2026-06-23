import { StudyPlanContent } from "@/components/engagement/study-plan-content";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { loadStudyPlanData } from "@/lib/study-plan/study-plan-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Сургалтын төлөвлөгөө — Бөөндөө Сурцгаая",
  description: "Өдрийн зорилго, долоо хоногийн төлөвлөгөө — нэг дэлгэцэд.",
};

export default async function StudyPlanPage() {
  const data = await loadStudyPlanData();

  return (
    <MobileAppShell activeTab="home" mainClassName={SHELL_MAIN_NARROW}>
      <StudyPlanContent data={data} />
    </MobileAppShell>
  );
}
