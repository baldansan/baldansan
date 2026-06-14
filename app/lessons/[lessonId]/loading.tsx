import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";

export default function LessonLoading() {
  return (
    <MobileAppShell activeTab="study" >
      <PageLoadingSkeleton rows={4} />
    </MobileAppShell>
  );
}
