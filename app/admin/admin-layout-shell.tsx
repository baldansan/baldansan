"use client";

import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout flex min-h-screen">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="admin-main flex-1 overflow-x-hidden">
          <AdminGuard>{children}</AdminGuard>
        </main>
      </div>
    </div>
  );
}
