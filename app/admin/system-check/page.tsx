import { SystemCheckView } from "@/components/admin/system-check-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "System check — Admin",
};

export default function AdminSystemCheckPage() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          System check
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Read-only production readiness checks for Supabase env, auth, admin
          access, content reads, tasks, activity log, and storage.
        </p>
      </section>
      <SystemCheckView />
    </div>
  );
}
