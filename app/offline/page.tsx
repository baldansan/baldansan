import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata = {
  title: "Офлайн",
  description: "Интернэт холболтгүй байна.",
};

export default function OfflinePage() {
  return (
    <PublicPageShell active="home" showBottomNav>
      <section className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:p-10">
        <h1 className="text-2xl font-bold text-slate-900">
          Интернэт холболтгүй байна
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Холболтоо шалгаад дахин оролдоорой. Өмнө нээсэн зарим хуудас browser
          cache дээр харагдаж магадгүй.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/"
            className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Try again — Home
          </Link>
          <Link
            href="/courses"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800"
          >
            Courses
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
