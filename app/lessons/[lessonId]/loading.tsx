import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";

export default function LessonLoading() {
  return (
    <MobileAppShell activeTab="study" mainClassName="max-w-[390px] mx-auto w-full">
      <PageLoadingSkeleton rows={4} />
    </MobileAppShell>
  );
}
