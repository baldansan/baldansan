import { MobileAppShell } from "@/components/mobile/mobile-app-shell";

export default function LessonTrainingLoading() {
  return (
    <MobileAppShell activeTab="study" showBottomNav={false}>
      <p className="py-16 text-center text-sm text-[var(--app-muted)]">
        Хичээл ачаалж байна...
      </p>
    </MobileAppShell>
  );
}
