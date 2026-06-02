import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";

export const metadata = {
  title: "Богино бичлэг — Бөөндөө Сурцгаая",
};

export default function ClipsPage() {
  return (
    <MobileAppShell activeTab="clips" mainClassName="max-w-[390px] mx-auto w-full">
      <div className="flex flex-col items-center gap-4 pb-2 pt-8 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--app-primary-light)] text-3xl"
          aria-hidden
        >
          ▶
        </div>
        <h1 className="text-xl font-bold text-[var(--app-text)]">Богино бичлэг</h1>
        <MobileCard padding="lg" className="w-full">
          <p className="text-base font-semibold text-[var(--app-text)]">
            Удахгүй нэмэгдэнэ
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
            Богино видео хичээлүүд бэлэн болмогц энд харагдана.
          </p>
        </MobileCard>
      </div>
    </MobileAppShell>
  );
}
