"use client";

import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { PageHelpStrip } from "@/components/workspace/page-help-strip";
import { ScheduleRunner } from "@/components/workspace/schedule-runner";
import { WorkspaceContext } from "@/components/workspace/workspace-context";

/**
 * Ажлын талбарын хүрээ: зүүн цэс + дээд мөр + «Энэ хуудсанд» тайлбар.
 * /admin/* дээр админ эрх шалгана (guard); /teacher/* дээр хуудас бүр өөрөө
 * нэвтрэлтээ шалгадаг тул guard-гүй.
 */
export function AdminLayoutShell({
  children,
  guard = true,
}: {
  children: React.ReactNode;
  guard?: boolean;
}) {
  const body = (
    <>
      <PageHelpStrip />
      <ScheduleRunner />
      {children}
    </>
  );
  return (
    <WorkspaceContext.Provider value={true}>
      <div className="admin-layout flex min-h-screen">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <main className="admin-main flex-1 overflow-x-hidden">
            {guard ? <AdminGuard>{body}</AdminGuard> : body}
          </main>
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}
