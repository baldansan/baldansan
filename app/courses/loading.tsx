import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";

export default function CoursesLoading() {
  return (
    <MobileAppShell activeTab="study">
      <PageLoadingSkeleton rows={3} />
    </MobileAppShell>
  );
}
