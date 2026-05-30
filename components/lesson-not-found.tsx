import Link from "next/link";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { EmptyState } from "@/components/empty-state";

export function LessonNotFound() {
  return (
    <MobileAppShell activeTab="study" mainClassName="max-w-[390px] mx-auto w-full">
      <MobileCard className="mt-8 text-center !py-10">
        <EmptyState
          title="Хичээл олдсонгүй"
          description="Энэ хичээл байхгүй эсвэл одоогоор бэлэн биш байна."
          action={
            <Link
              href="/home"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Нүүр хуудас
            </Link>
          }
        />
      </MobileCard>
    </MobileAppShell>
  );
}
