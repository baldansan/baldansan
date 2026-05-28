"use client";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminGuard } from "@/components/admin/admin-guard";

export function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AdminHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-16 pt-2 sm:px-6">
        <AdminGuard>{children}</AdminGuard>
      </main>
    </div>
  );
}
