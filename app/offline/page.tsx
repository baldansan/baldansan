import Link from "next/link";
import { OfflineStatusClient } from "./offline-status-client";

export const metadata = {
  title: "Офлайн",
  description: "Интернэт холболтгүй байна.",
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <section className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:p-10">
        <h1 className="text-2xl font-bold text-slate-900">
          Интернэт холболтгүй байна
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Browser-ийн <code className="text-xs">navigator.onLine</code> offline
          гэж мэдээлсэн үед л энэ хуудас харагдана. Серверийн алдаа, Supabase
          тохиргоо, эсвэл хичээл олдохгүй бол энэ хуудас биш — тухайн алдааны
          тайлбар гарна.
        </p>
        <OfflineStatusClient />
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/"
            className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Try again — Home
          </Link>
          <Link
            href="/debug/local-health"
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700"
          >
            Local health debug
          </Link>
        </div>
      </section>
    </main>
  );
}
