"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getKidModeProfile } from "@/lib/kids/client";
import { KID_STARS_EVENT, getKidDoneMap, getKidStarsMap, stickerForLesson, syncKidStars } from "@/lib/kids/stars";

export type KidsCourseLesson = { id: string; title: string; titleZh: string; imageUrl: string | null };

type Props = {
  courseId: string;
  title: string;
  subtitle: string;
  lessons: KidsCourseLesson[];
};

const CARD = "rounded-[28px] bg-white shadow-[0_10px_30px_rgba(120,80,0,0.10)] ring-1 ring-amber-100";

/** YCT номын нүүр — хүүхдэд зориулсан хичээлийн зам: том карт, од, наалт, том шалгалт, гэрчилгээ. */
export function KidsCourseHome({ courseId, title, subtitle, lessons }: Props) {
  const [stars, setStars] = useState<Record<string, number>>({});
  const [done, setDone] = useState<Record<string, string>>({});
  const [kidName, setKidName] = useState("");
  const [certOpen, setCertOpen] = useState(false);

  useEffect(() => {
    const load = () => {
      setStars(getKidStarsMap());
      setDone(getKidDoneMap());
    };
    const raf = requestAnimationFrame(() => {
      load();
      setKidName(getKidModeProfile()?.displayName ?? "");
    });
    void syncKidStars().then(load);
    window.addEventListener(KID_STARS_EVENT, load);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(KID_STARS_EVENT, load);
    };
  }, []);

  const reviewId = `${courseId}-review`;
  const doneCount = lessons.filter((l) => done[l.id]).length;
  const bookStars = useMemo(
    () => lessons.reduce((n, l) => n + (stars[l.id] ?? 0), 0) + (stars[reviewId] ?? 0),
    [lessons, stars, reviewId]
  );
  const allDone = lessons.length > 0 && doneCount === lessons.length;
  const nextLesson = lessons.find((l) => !done[l.id]) ?? null;
  const bookNo = courseId.replace(/^yct-/, "");
  const today = useMemo(() => {
    const latest = Object.entries(done)
      .filter(([id]) => id.startsWith(`${courseId}-`))
      .map(([, v]) => v)
      .sort()
      .pop();
    return latest ? latest.slice(0, 10) : "";
  }, [done, courseId]);

  return (
    <div className="min-h-screen bg-[#FFF7E6] pb-16">
      <div className="mx-auto flex max-w-xl flex-col gap-5 px-4 pt-4">
        <div className="flex items-center justify-between gap-2 print:hidden">
          <Link href="/home" className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
            ← Нүүр
          </Link>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-extrabold text-amber-900">⭐ {bookStars}</span>
        </div>

        <div className="flex items-center gap-4 print:hidden">
          <img src="/kids/temee.jpg" alt="" className="h-20 w-20 shrink-0 rounded-full object-cover shadow ring-4 ring-white" />
          <div>
            <div className="text-2xl font-extrabold text-[#2b1a05]">{title}</div>
            <div className="text-sm font-bold text-[#6b3f1d]">{subtitle}</div>
          </div>
        </div>

        {/* явц */}
        <div className={`${CARD} p-4 print:hidden`}>
          <div className="flex items-center justify-between text-sm font-extrabold text-[#6b3f1d]">
            <span>
              🎒 {doneCount} / {lessons.length} хичээл
            </span>
            <span>🏅 {doneCount} наалт</span>
          </div>
          <div className="mt-2 h-4 overflow-hidden rounded-full bg-amber-100">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all" style={{ width: `${(100 * doneCount) / Math.max(1, lessons.length)}%` }} />
          </div>
          {nextLesson ? (
            <Link href={`/kids/lesson/${nextLesson.id}`} className="mt-3 flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-lg font-extrabold text-white shadow-md active:scale-95">
              {doneCount === 0 ? "Эхэлье! 🚀" : "Үргэлжлүүлье ➜"}
            </Link>
          ) : null}
        </div>

        {/* хичээлийн зам */}
        <div className="grid grid-cols-2 gap-3 print:hidden">
          {lessons.map((l, i) => {
            const isDone = Boolean(done[l.id]);
            const isNext = nextLesson?.id === l.id;
            return (
              <Link
                key={l.id}
                href={`/kids/lesson/${l.id}`}
                className={`${CARD} relative flex flex-col overflow-hidden active:scale-95 ${isNext ? "ring-4 ring-orange-300" : ""}`}
              >
                <div className="relative aspect-[4/3] w-full bg-amber-50">
                  {l.imageUrl ? (
                    <img src={l.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl">🐫</div>
                  )}
                  <span className="absolute left-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-base font-extrabold text-orange-600 shadow">
                    {i + 1}
                  </span>
                  <span className={`absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-2xl shadow ${isDone ? "bg-white" : "bg-white/70 grayscale"}`}>
                    {isDone ? stickerForLesson(l.id) : "❔"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-0.5 p-3">
                  <div className="text-xl font-extrabold leading-tight text-[#2b1a05]" lang="zh-CN">
                    {l.titleZh}
                  </div>
                  <div className="text-sm font-bold leading-tight text-[#6b3f1d]">{l.title}</div>
                  <div className="mt-auto pt-1 text-xs font-extrabold text-amber-700">{stars[l.id] ? `⭐ ${stars[l.id]}` : isNext ? "👉 Дараагийнх" : " "}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* том шалгалт */}
        <Link href={`/kids/review/${courseId}`} className={`${CARD} flex items-center gap-4 p-5 active:scale-95 print:hidden`}>
          <span className="text-5xl">{done[reviewId] ? "🏆" : "🎯"}</span>
          <span className="flex-1">
            <span className="block text-xl font-extrabold text-[#2b1a05]">Номын том шалгалт</span>
            <span className="block text-sm font-bold text-[#6b3f1d]">Энэ номын бүх үгээр 4 тоглоом{stars[reviewId] ? ` · ⭐ ${stars[reviewId]}` : ""}</span>
          </span>
        </Link>

        {/* наалтын цомог */}
        <div className={`${CARD} p-4 print:hidden`}>
          <div className="mb-2 text-lg font-extrabold text-[#2b1a05]">🏅 Наалтын цомог</div>
          <div className="grid grid-cols-6 gap-2">
            {lessons.map((l, i) => (
              <span
                key={l.id}
                className={`flex aspect-square items-center justify-center rounded-2xl text-2xl ${done[l.id] ? "bg-amber-50" : "border-2 border-dashed border-amber-200 text-sm font-bold text-amber-300"}`}
                title={l.title}
              >
                {done[l.id] ? stickerForLesson(l.id) : i + 1}
              </span>
            ))}
          </div>
          {allDone ? (
            <button type="button" onClick={() => setCertOpen(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-lg font-extrabold text-white shadow-md active:scale-95">
              🎓 Гэрчилгээгээ авах
            </button>
          ) : (
            <p className="mt-3 text-center text-sm font-bold text-amber-800">Бүх наалтыг цуглуулбал гэрчилгээ авна!</p>
          )}
        </div>

        <Link href={`/courses/${courseId}?view=list`} className="text-center text-xs font-semibold text-amber-700 underline print:hidden">
          Багш, эцэг эхэд: хичээлийн дэлгэрэнгүй жагсаалт
        </Link>

        {/* гэрчилгээ */}
        {certOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:static print:bg-white print:p-0">
            <div className="w-full max-w-md rounded-[28px] border-8 border-double border-amber-400 bg-[#FFFDF5] p-6 text-center shadow-2xl">
              <div className="text-5xl">🎓</div>
              <div className="mt-2 text-sm font-extrabold uppercase tracking-widest text-orange-500">Гэрчилгээ · 证书</div>
              <div className="mt-3 text-2xl font-extrabold text-[#2b1a05]">{kidName || "Мундаг сурагч"}</div>
              <p className="mt-2 text-base font-bold leading-7 text-[#6b3f1d]">
                «YCT {bookNo}» номын {lessons.length} хичээлийг бүгдийг дуусгаж, {bookStars} од цуглууллаа.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-1 text-2xl">
                {lessons.map((l) => (
                  <span key={l.id}>{stickerForLesson(l.id)}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center gap-3">
                <img src="/kids/temee.jpg" alt="" className="h-12 w-12 rounded-full object-cover" />
                <div className="text-left text-xs font-bold text-amber-800">
                  Тэмээ багш
                  <br />
                  Бөөндөө Сурцгаая{today ? ` · ${today}` : ""}
                </div>
              </div>
              <div className="mt-4 flex justify-center gap-3 print:hidden">
                <button type="button" onClick={() => window.print()} className="rounded-full bg-orange-500 px-5 py-2 text-base font-extrabold text-white">
                  🖨 Хэвлэх
                </button>
                <button type="button" onClick={() => setCertOpen(false)} className="rounded-full bg-amber-100 px-5 py-2 text-base font-extrabold text-amber-900">
                  Хаах
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
