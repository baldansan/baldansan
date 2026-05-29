import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";

export default function AdminLoading() {
  return (
    <div className="admin-layout flex min-h-screen">
      <div className="hidden w-[240px] shrink-0 bg-slate-900 lg:block" />
      <div className="admin-main flex-1">
        <PageLoadingSkeleton rows={4} />
      </div>
    </div>
  );
}
