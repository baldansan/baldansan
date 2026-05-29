import Link from "next/link";
import { HomeContinueSection } from "@/components/home-continue-section";
import { HomeEngagementSection } from "@/components/engagement/home-engagement-section";
import { HomeHeroActions } from "@/components/home-hero-actions";
import { HomeMobileExtras } from "@/components/home-mobile-extras";
import { PublicPageShell } from "@/components/public-page-shell";
import {
  ctaPrimaryClass,
  ctaSecondaryClass,
} from "@/components/ui/cta-button-row";
import { courses } from "@/data/courses";
import { getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const hsk5Lessons = await getPublicLessonsByCourseId("hsk5");
  const hsk5Count = hsk5Lessons.length;
  const lessonIds = hsk5Lessons.map((l) => l.id);

  return (
    <PublicPageShell active="home" showBottomNav>
      <HomeMobileExtras lessonIds={lessonIds} />
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
          Богино видео — Хятад хэл
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Бөөндөө Сурцгаая
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Богино бичлэг, хадмал, үгийн сан, quiz ашиглан Хятад хэлийг өдөр бүр
          бага багаар сур.
        </p>
        <HomeHeroActions />
      </section>

      <HomeContinueSection />

      <HomeEngagementSection />

      <section>
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Яаж ажилладаг вэ?
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "1",
              title: "Богино scene үзнэ",
              desc: "Видео + хадмал, pinyin",
            },
            {
              step: "2",
              title: "Үгсээ ойлгоно",
              desc: "Үгийн сан + HSK түвшин",
            },
            { step: "3", title: "Quiz өгнө", desc: "Сурсан зүйлээ шалгана" },
            {
              step: "4",
              title: "Ахиц хадгалагдана",
              desc: "Account эсвэл төхөөрөмж дээр",
            },
          ].map((item) => (
            <article
              key={item.step}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                {item.step}
              </span>
              <h3 className="mt-3 font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Курсын онцлог
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <article
              key={course.id}
              className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{course.title}</h3>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                  {course.level}
                </span>
              </div>
              <p className="mt-2 flex-1 text-sm text-slate-600">
                {course.description}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                {course.id === "hsk5"
                  ? `${hsk5Count} хичээл бэлэн`
                  : `${course.lessons} хичээл төлөвлөгдсөн`}
              </p>
              {course.href && course.status === "available" ? (
                <Link href={course.href} className={`mt-4 ${ctaPrimaryClass}`}>
                  Үзэх
                </Link>
              ) : (
                <span className="mt-4 inline-flex min-h-[44px] w-fit items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500">
                  Удахгүй
                </span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-emerald-50/60 p-6 ring-1 ring-emerald-100 sm:rounded-3xl sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Яагаад энэ арга?</h2>
        <ul className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <li className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-emerald-100">
            Богино бичлэг — бодит ярианы хурд
          </li>
          <li className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-emerald-100">
            Хадмал + pinyin + Монгол орчуулга
          </li>
          <li className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-emerald-100">
            Үгийн сан — HSK түвшинтэй
          </li>
          <li className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-emerald-100">
            Quiz + ахиц хадгалалт
          </li>
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl">
        <h2 className="text-lg font-semibold text-slate-900">Бэлэн байдал</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            HSK5 хичээлүүд ({hsk5Count} нийтэд)
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
            HSK4, Taobao — удахгүй
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            Account ахиц + guest fallback
          </li>
        </ul>
      </section>

      <section className="rounded-3xl bg-emerald-600 p-6 text-center text-white sm:p-10">
        <h2 className="text-xl font-bold sm:text-2xl">Өнөөдөр эхлээрэй</h2>
        <p className="mt-2 text-sm text-emerald-50 sm:text-base">
          HSK5 богино drama-аар эхний хичээлээ үзээрэй.
        </p>
        <Link href="/courses/hsk5" className={`mt-6 ${ctaSecondaryClass}`}>
          Суралцаж эхлэх
        </Link>
      </section>
    </PublicPageShell>
  );
}
