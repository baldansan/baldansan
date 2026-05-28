import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base"
        >
          Buunduu Surtsgaay
        </Link>
        <nav className="flex items-center gap-3 text-xs text-slate-600 sm:gap-5 sm:text-sm">
          <Link href="/courses" className="transition-colors hover:text-emerald-600">
            Courses
          </Link>
          <Link href="/lessons/1" className="transition-colors hover:text-emerald-600">
            Demo
          </Link>
          <a href="#" className="transition-colors hover:text-emerald-600">
            Profile
          </a>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-2 sm:gap-8 sm:px-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="mb-2 text-sm font-medium text-emerald-600">
            Buunduu Surtsgaay
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Хятад хэлийг богино бичлэгээр сур
          </h1>
          <p className="mt-3 max-w-xl text-base text-slate-600 sm:text-lg">
            Үзээд сур. Сонсоод давт. Үг бүрийг ойлго.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/courses"
              className="w-full rounded-full bg-emerald-500 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Эхлэх
            </Link>
            <Link
              href="/lessons/1"
              className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-center text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Demo lesson үзэх
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Богино бичлэг</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Хятад хадмал, Монгол орчуулгатай хичээлүүд
            </p>
          </article>

          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Үгсийн сан</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              HSK түвшин, pinyin, жишээ өгүүлбэртэй
            </p>
          </article>

          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Quiz &amp; progress
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Сурсан үгээ шалгаж, ахицаа хадгална
            </p>
          </article>
        </section>

        <Link
          href="/lessons/1"
          className="block rounded-2xl bg-white p-6 shadow-sm ring-1 ring-emerald-200 transition-colors hover:bg-emerald-50/30 sm:p-7"
        >
          <p className="text-sm font-medium text-emerald-700">Demo lesson</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            HSK5 Lesson 1 - 爱的细节
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <p className="rounded-xl bg-emerald-50 px-3 py-2">Video lesson</p>
            <p className="rounded-xl bg-emerald-50 px-3 py-2">20 vocabulary</p>
            <p className="rounded-xl bg-emerald-50 px-3 py-2">10 quiz questions</p>
            <p className="rounded-xl bg-emerald-50 px-3 py-2">Shadowing practice</p>
          </div>
        </Link>
      </main>
    </div>
  );
}
