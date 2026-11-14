import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";

export default function NotFound() {
  return (
    <PublicPageShell active="home">
      <section className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:p-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/temee/v2/lost.webp" alt="" width={176} height={176} className="mx-auto h-44 w-44 object-contain" />
        <p className="mt-2 text-sm font-semibold text-emerald-600">404</p>
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
            Нүүр хуудас
          </Link>
          <Link
            href="/courses"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800"
          >
            Хичээлүүд
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
