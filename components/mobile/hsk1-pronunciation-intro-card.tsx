"use client";

import Link from "next/link";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import {
  PINYIN_COURSE,
  PINYIN_COURSE_STORAGE_KEY,
  type CourseProgress,
} from "@/lib/pronunciation/pinyin-course";
import { useStoredJson } from "@/lib/pronunciation/use-stored-json";

const EMPTY: CourseProgress = {};

/**
 * HSK1 хичээлийн жагсаалтын хамгийн дээр гарах «Дуудлагын үндэс» урамшуулах карт.
 * Хятад хэл дээр ханз/үг цээжлэхээсээ өмнө b p m f гэх мэт үндсэн авиануудыг
 * ам, уруулын хэлбэр + дагаж хэлэх дадлагаар зөв тавьж сурахыг санал болгоно.
 * Бүх нэгж дууссан бол давхар сануулахгүйн тулд алга болно.
 */
export function Hsk1PronunciationIntroCard() {
  const locale = useUiLocale();
  const progress = useStoredJson<CourseProgress>(PINYIN_COURSE_STORAGE_KEY, EMPTY);

  const doneCount = PINYIN_COURSE.filter((u) => progress[u.id]?.done).length;
  const anyStarted = PINYIN_COURSE.some((u) => {
    const p = progress[u.id];
    return p && (p.done || p.listened.length > 0 || p.testScore != null);
  });
  const firstOpen = PINYIN_COURSE.findIndex((u) => !progress[u.id]?.done);
  const allDone = firstOpen === -1;

  if (allDone) return null;

  const current = PINYIN_COURSE[firstOpen];

  return (
    <div className="app-card app-course-card-premium mb-4 p-4">
      <div className="flex items-start gap-2.5">
        <span className="text-2xl leading-none" aria-hidden>
          🔤
        </span>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[var(--app-text)]">
            {tr(locale, "Дуудлагын үндэс — эхлээд үүнийг сур")}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-[var(--app-muted)]">
            {tr(
              locale,
              "Ханз, үг цээжлэхээсээ өмнө амаа зөв тавьж дуудахыг сур. Ам, уруулын хэлбэрийг хараад дагаж хэл."
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <span
            className="block h-full bg-emerald-500"
            style={{ width: `${Math.round((100 * doneCount) / PINYIN_COURSE.length)}%` }}
          />
        </span>
        <span className="text-[11px] font-bold text-[var(--app-muted)]">
          {doneCount}/{PINYIN_COURSE.length}
        </span>
      </div>

      <Link
        href={`/pronunciation/basics/${current.id}`}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-base font-extrabold text-white active:bg-emerald-700"
      >
        ▶ {anyStarted ? tr(locale, "Үргэлжлүүлэх") : tr(locale, "Эхлэх")}
        <span className="text-sm font-bold opacity-80" translate="no">
          · {current.order}. {locale === "zh" ? current.titleZh : current.title}
        </span>
      </Link>
    </div>
  );
}
