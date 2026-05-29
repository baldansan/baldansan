import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";

export default function LessonLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AppHeader active="courses" />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-24 pt-2 sm:px-6 md:pb-10">
        <PageLoadingSkeleton rows={4} />
      </main>
      <BottomNav />
    </div>
  );
}
