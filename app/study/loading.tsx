import { MobileAppShell } from "@/components/mobile/mobile-app-shell";

export default function StudyLoading() {
  return (
    <MobileAppShell activeTab="study" mainClassName="mx-auto w-full max-w-[390px]">
      <p className="py-16 text-center text-sm text-[var(--app-muted)]">
        Хичээл ачаалж байна...
      </p>
    </MobileAppShell>
  );
}
