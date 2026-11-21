"use client";

/**
 * Шинэ хэрэглэгчийн эхлэл: түвшнээ өөрөө сонгоно (мэдэхгүй / HSK 1–9) → ном →
 * «энэ номыг үзэж байсан уу, хэддүгээр хичээл дээр яваа вэ» → өдрийн төлөвлөгөө.
 * Сонголт бүрийг дармагц дараагийн алхам руу шууд шилжинэ.
 */
import Image from "next/image";
import { useMemo, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type { MobileCourseCatalogEntry } from "@/lib/mobile-course-options";

export type StartWizardResult = {
  /** 0 = мэдэгдэхүүн байхгүй, 1–9 = HSK түвшин. */
  level: number;
  series: "standard" | "fazhan";
  chipId: string;
  courseId: string;
  /** Үзэж байсан бол яваа хичээл; эхнээс нь бол null. */
  startLessonId: string | null;
};

type Props = {
  catalog: MobileCourseCatalogEntry[];
  fazhanCatalog: MobileCourseCatalogEntry[];
  onDone: (result: StartWizardResult) => void;
  /** Дахин тохируулахаар нээсэн үед хаах товч гарна. */
  onClose?: () => void;
};

type Phase = "know" | "level" | "book" | "studied" | "lesson" | "plan";
type BookChoice = { series: "standard" | "fazhan"; entry: MobileCourseCatalogEntry };

/** Түвшин → 发展汉语-ийн боть (ангийн нүүртэй ижил харгалзаа). */
const FAZHAN_BY_LEVEL: Record<number, string> = {
  1: "fazhan-chuji1",
  2: "fazhan-chuji1",
  3: "fazhan-chuji2",
  4: "fazhan-zhongji1",
  5: "fazhan-zhongji2",
  6: "fazhan-gaoji1",
};

const LEVEL_HINTS: Record<number, string> = {
  1: "150 орчим үг",
  2: "300 орчим үг",
  3: "600 орчим үг",
  4: "1200 орчим үг",
  5: "2500 орчим үг",
  6: "5000 орчим үг",
  7: "Ахисан",
  8: "Ахисан",
  9: "Ахисан",
};

export function StartWizard({ catalog, fazhanCatalog, onDone, onClose }: Props) {
  const locale = useUiLocale();
  const [phase, setPhase] = useState<Phase>("know");
  const [level, setLevel] = useState(0);
  const [book, setBook] = useState<BookChoice | null>(null);
  const [startLessonId, setStartLessonId] = useState<string | null>(null);

  /** Түвшинд тохирох номууд. 7–9-д өөрийн ном байхгүй тул HSK 6-ийн ном. */
  const books = useMemo<BookChoice[]>(() => {
    const bookLevel = Math.min(6, Math.max(1, level));
    const list: BookChoice[] = [];
    const std = catalog.find((e) => e.courseId === `hsk${bookLevel}` && e.available && e.lessons.length > 0);
    if (std) list.push({ series: "standard", entry: std });
    const fz = fazhanCatalog.find(
      (e) => e.courseId === FAZHAN_BY_LEVEL[bookLevel] && e.available && e.lessons.length > 0
    );
    if (fz) list.push({ series: "fazhan", entry: fz });
    return list;
  }, [catalog, fazhanCatalog, level]);

  function chooseLevel(next: number) {
    setLevel(next);
    setBook(null);
    setStartLessonId(null);
    setPhase("book");
  }

  function chooseBook(choice: BookChoice) {
    setBook(choice);
    setStartLessonId(null);
    // Огт мэдэхгүй хүн номыг үзээгүй нь тодорхой — асуулгүй эхнээс нь.
    setPhase(level === 0 ? "plan" : "studied");
  }

  function back() {
    if (phase === "level") setPhase("know");
    else if (phase === "book") setPhase(level === 0 ? "know" : "level");
    else if (phase === "studied") setPhase("book");
    else if (phase === "lesson") setPhase("studied");
    else if (phase === "plan") setPhase(level === 0 ? "book" : startLessonId ? "lesson" : "studied");
  }

  function finish() {
    if (!book) return;
    onDone({
      level,
      series: book.series,
      chipId: book.entry.chipId,
      courseId: book.entry.courseId,
      startLessonId,
    });
  }

  const steps: Phase[] = ["know", "book", "studied", "plan"];
  const stepIndex = phase === "level" ? 0 : phase === "lesson" ? 2 : steps.indexOf(phase);
  const startLesson = book?.entry.lessons.find((l) => l.id === startLessonId) ?? book?.entry.lessons[0] ?? null;
  const startNumber = book && startLesson ? book.entry.lessons.indexOf(startLesson) + 1 : 1;

  const optionClass =
    "flex w-full items-center gap-3 rounded-[20px] border border-[var(--app-border)] bg-[var(--app-card)] p-4 text-left shadow-[var(--app-shadow)] transition-transform active:scale-[0.985]";

  return (
    <div className="bs-start" role="dialog" aria-modal="true" aria-label={tr(locale, "Эхлэх тохиргоо")}>
      <div className="bs-start-inner">
        <div className="mb-4 flex items-center gap-3">
          {phase !== "know" ? (
            <button type="button" onClick={back} className="text-sm font-semibold text-[var(--app-muted)]">
              ← {tr(locale, "Буцах")}
            </button>
          ) : null}
          <div className="flex flex-1 gap-1.5" aria-hidden>
            {steps.map((s, i) => (
              <span
                key={s}
                className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-[#7C4DDB]" : "bg-[var(--app-border)]"}`}
              />
            ))}
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label={tr(locale, "Хаах")}
              className="text-xl leading-none text-[var(--app-muted)]"
            >
              ×
            </button>
          ) : null}
        </div>

        {phase === "know" ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              <Image src="/temee/v2/wave.webp" alt="" width={84} height={84} className="h-[84px] w-[84px] object-contain" />
              <div>
                <h1 className="text-[22px] font-black leading-tight text-[var(--app-text)]">
                  {tr(locale, "Сайн уу! Хятад хэлний мэдлэг чинь хэр вэ?")}
                </h1>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  {tr(locale, "Өөрөө сонго — чамд тохирсон төлөвлөгөө гаргаж өгнө.")}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button type="button" className={optionClass} onClick={() => chooseLevel(0)}>
                <span className="text-3xl" aria-hidden>🌱</span>
                <span className="flex-1">
                  <span className="block text-base font-extrabold text-[var(--app-text)]">
                    {tr(locale, "Мэдэгдэхүүн байхгүй")}
                  </span>
                  <span className="block text-sm text-[var(--app-muted)]">{tr(locale, "Эхнээс нь, HSK 1-ээс эхэлнэ")}</span>
                </span>
                <span className="text-[var(--app-muted)]">›</span>
              </button>
              <button type="button" className={optionClass} onClick={() => setPhase("level")}>
                <span className="text-3xl" aria-hidden>📚</span>
                <span className="flex-1">
                  <span className="block text-base font-extrabold text-[var(--app-text)]">
                    {tr(locale, "Мэдлэгтэй — түвшнээ сонгоно")}
                  </span>
                  <span className="block text-sm text-[var(--app-muted)]">HSK 1 – 9</span>
                </span>
                <span className="text-[var(--app-muted)]">›</span>
              </button>
            </div>
          </>
        ) : null}

        {phase === "level" ? (
          <>
            <h1 className="text-[22px] font-black leading-tight text-[var(--app-text)]">
              {tr(locale, "Одоо аль түвшинд яваа вэ?")}
            </h1>
            <p className="mb-4 mt-1 text-sm text-[var(--app-muted)]">
              {tr(locale, "Одоо сурч байгаа түвшнээ сонго. Дараа нь хэдийд ч сольж болно.")}
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => chooseLevel(n)}
                  className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-card)] px-2 py-4 text-center shadow-[var(--app-shadow)] active:scale-95"
                >
                  <span className="block text-lg font-black text-[var(--app-text)]">HSK {n}</span>
                  <span className="block text-[11px] font-semibold text-[var(--app-muted)]">
                    {tr(locale, LEVEL_HINTS[n] ?? "")}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {phase === "book" ? (
          <>
            <h1 className="text-[22px] font-black leading-tight text-[var(--app-text)]">
              {tr(locale, "Аль номоор сурах вэ?")}
            </h1>
            <p className="mb-4 mt-1 text-sm text-[var(--app-muted)]">
              {level >= 7
                ? tr(locale, "HSK 7–9-ийн ном одоогоор аппд байхгүй. HSK 6-ийн номоор бататгаад, «Давтах» дахь шалгалтын дасгалаар бэлдээрэй.")
                : level === 0
                  ? tr(locale, "HSK 1-ийн ном. Өдөрт нэг хичээлээр явна.")
                  : `HSK ${level} — ${tr(locale, "энэ түвшний номууд. Өдөрт нэг хичээлээр явна.")}`}
            </p>
            <div className="flex flex-col gap-3">
              {books.map((choice) => (
                <button
                  key={`${choice.series}:${choice.entry.chipId}`}
                  type="button"
                  className={optionClass}
                  onClick={() => chooseBook(choice)}
                >
                  {choice.entry.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={choice.entry.coverUrl}
                      alt=""
                      className="h-[72px] w-[54px] shrink-0 rounded-lg object-cover ring-1 ring-black/10"
                    />
                  ) : (
                    <span className="text-3xl" aria-hidden>📘</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-extrabold text-[var(--app-text)]" translate="no">
                      {choice.series === "fazhan" ? `发展汉语 · ${choice.entry.chipLabel}` : `HSK 标准教程 · ${choice.entry.chipLabel}`}
                    </span>
                    <span className="block text-sm text-[var(--app-muted)]">
                      {choice.entry.lessons.length} {tr(locale, "хичээл")}
                      {choice.series === "fazhan" ? ` · ${tr(locale, "Хөх хотын бэлтгэл ангийн ном")}` : ""}
                    </span>
                  </span>
                  <span className="text-[var(--app-muted)]">›</span>
                </button>
              ))}
              {books.length === 0 ? (
                <p className="text-sm text-[var(--app-muted)]">
                  {tr(locale, "Энэ түвшний ном одоогоор нээгдээгүй байна. Өөр түвшин сонгоно уу.")}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {phase === "studied" && book ? (
          <>
            <h1 className="text-[22px] font-black leading-tight text-[var(--app-text)]">
              {tr(locale, "Энэ номыг үзэж байсан уу?")}
            </h1>
            <p className="mb-4 mt-1 text-sm text-[var(--app-muted)]" translate="no">
              {book.series === "fazhan" ? `发展汉语 · ${book.entry.chipLabel}` : `HSK 标准教程 · ${book.entry.chipLabel}`}
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                className={optionClass}
                onClick={() => {
                  setStartLessonId(null);
                  setPhase("plan");
                }}
              >
                <span className="text-3xl" aria-hidden>🆕</span>
                <span className="flex-1">
                  <span className="block text-base font-extrabold text-[var(--app-text)]">
                    {tr(locale, "Үзээгүй — эхнээс нь")}
                  </span>
                  <span className="block text-sm text-[var(--app-muted)]">{tr(locale, "1-р хичээлээс эхэлнэ")}</span>
                </span>
                <span className="text-[var(--app-muted)]">›</span>
              </button>
              <button type="button" className={optionClass} onClick={() => setPhase("lesson")}>
                <span className="text-3xl" aria-hidden>📖</span>
                <span className="flex-1">
                  <span className="block text-base font-extrabold text-[var(--app-text)]">
                    {tr(locale, "Үзэж байсан")}
                  </span>
                  <span className="block text-sm text-[var(--app-muted)]">
                    {tr(locale, "Хэддүгээр хичээл дээр яваагаа сонгоно")}
                  </span>
                </span>
                <span className="text-[var(--app-muted)]">›</span>
              </button>
            </div>
          </>
        ) : null}

        {phase === "lesson" && book ? (
          <>
            <h1 className="text-[22px] font-black leading-tight text-[var(--app-text)]">
              {tr(locale, "Хэддүгээр хичээл дээр яваа вэ?")}
            </h1>
            <p className="mb-4 mt-1 text-sm text-[var(--app-muted)]">
              {tr(locale, "Одоо үзэх ёстой хичээлээ дар. Тэндээс үргэлжлүүлнэ.")}
            </p>
            <ol className="flex flex-col gap-2">
              {book.entry.lessons.map((lesson, index) => (
                <li key={lesson.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-2.5 text-left active:scale-[0.985]"
                    onClick={() => {
                      setStartLessonId(lesson.id);
                      setPhase("plan");
                    }}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--app-bg)] text-sm font-black text-[#7C4DDB]">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold text-[var(--app-text)]" translate="no">
                        {lesson.chineseTitle || lesson.title}
                      </span>
                      {lesson.chineseTitle && lesson.title ? (
                        <span className="block truncate text-xs text-[var(--app-muted)]">{lesson.title}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </>
        ) : null}

        {phase === "plan" && book ? (
          <>
            <h1 className="text-[22px] font-black leading-tight text-[var(--app-text)]">
              {tr(locale, "Чиний өдрийн төлөвлөгөө бэлэн")}
            </h1>
            <p className="mb-4 mt-1 text-sm text-[var(--app-muted)]">
              <span translate="no">
                {book.series === "fazhan" ? `发展汉语 · ${book.entry.chipLabel}` : `HSK 标准教程 · ${book.entry.chipLabel}`}
              </span>{" "}
              · {startNumber}-{tr(locale, "р хичээлээс")}
            </p>
            <ol className="mb-4 flex flex-col gap-2">
              {[
                { icon: "📘", title: "Нэг бүтэн хичээл", body: "Үг, эх, дүрэм, номын бүх даалгавар, сорил" },
                { icon: "✍️", title: "Ханзаа дэвтэрт бичих", body: "2, 2-оор нь дагаж зураад, санаж бичнэ. Мэддэг бол алгасна" },
                { icon: "🔤", title: "Үгээ давтах", body: "Аппын өгсөн өдрийн давталт" },
                { icon: "👂", title: "Сонсголын богино сорил", body: "10 асуулт, 3 минут" },
              ].map((row, i) => (
                <li
                  key={row.title}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-3"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--app-bg)] text-xl" aria-hidden>
                    {row.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-extrabold text-[var(--app-text)]">
                      {i + 1}. {tr(locale, row.title)}
                    </span>
                    <span className="block text-xs text-[var(--app-muted)]">{tr(locale, row.body)}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              ⭐ {tr(locale, "Дөрвүүланг нь хийвэл өнөөдөр бүтэн оноо.")}{" "}
              {tr(locale, "Орой нь, эсвэл маргааш апп нээхэд цээжилснийг чинь шалгана.")}
            </div>
            <button type="button" className="app-btn-primary w-full" onClick={finish}>
              {tr(locale, "Эхэлье")} →
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
