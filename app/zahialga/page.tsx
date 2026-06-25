import Link from "next/link";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";

export const metadata = {
  title: "Захиалгын сургалт — Бөөндөө Сурцгаая",
  description:
    "Хятад, Солонгос, Америкаас онлайн захиалахыг эхнээс нь зааж байна. Taobao бүртгэл, бараа хайх заавар.",
};

export default function ZahialgaPage() {
  return (
    <MobileAppShell
      showBottomNav={false}
      immersive
      mainClassName="mx-auto w-full max-w-[480px]"
    >
      <div className="relative h-[100dvh] w-full">
        <div className="absolute inset-x-0 top-0 z-10 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Link
            href="/home"
            className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--app-border)] bg-white/95 px-3.5 py-1.5 text-sm font-bold text-[var(--app-text)] shadow-sm backdrop-blur-sm active:bg-slate-50"
            aria-label="Буцах"
          >
            ← Буцах
          </Link>
        </div>
        <iframe
          src="/zahialga.html"
          title="Захиалгын сургалт"
          className="h-[100dvh] w-full border-0"
        />
      </div>
    </MobileAppShell>
  );
}
