"use client";

import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { PageHelpStrip } from "@/components/workspace/page-help-strip";
import { ScheduleRunner } from "@/components/workspace/schedule-runner";
import { WorkspaceBottomNav } from "@/components/workspace/workspace-bottom-nav";
import { TeacherPortalChrome } from "@/components/workspace/teacher-portal-chrome";
import {
  useWorkspaceRole,
  WorkspaceContext,
} from "@/components/workspace/workspace-context";

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
  const role = useWorkspaceRole();
  // Багш / сургалтын төвийн хүн (админ биш) бол тусдаа, цайвар «Багшийн самбар»
  // хүрээгээр харуулна — зөвхөн өөрт нь хамаатай зүйлс. Админ өөрийн хүрээг харна.
  if (!guard && role === "unknown") {
    // Эрх тодорхой болтол аль ч хүрээг гаргахгүй — багшид админы харагдац,
    // админд багшийн харагдац хоромхон ч анивчихгүй.
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Ачаалж байна…
      </div>
    );
  }
  if (!guard && role !== "admin") {
    return (
      <WorkspaceContext.Provider value={true}>
        <TeacherPortalChrome>{body}</TeacherPortalChrome>
        <WorkspaceBottomNav />
      </WorkspaceContext.Provider>
    );
  }

  return (
    <WorkspaceContext.Provider value={true}>
      <div className="admin-layout flex min-h-screen">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <main className="admin-main flex-1 overflow-x-hidden pb-24 lg:pb-6">
            {guard ? <AdminGuard>{body}</AdminGuard> : body}
          </main>
        </div>
        <WorkspaceBottomNav />
      </div>
    </WorkspaceContext.Provider>
  );
}
