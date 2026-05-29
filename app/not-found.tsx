import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";

export default function NotFound() {
  return (
    <PublicPageShell active="home">
      <section className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:p-12">
        <p className="text-sm font-semibold text-emerald-600">404</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Хуудас олдсонгүй
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Хайсан хуудас байхгүй эсвэл шилжсөн байж магадгүй.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Home
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
