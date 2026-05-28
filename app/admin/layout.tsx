import { AdminHeader } from "@/components/admin/admin-header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AdminHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-16 pt-2 sm:px-6">
        {children}
      </main>
    </div>
  );
}
