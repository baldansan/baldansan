"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { lessonPath } from "@/lib/content";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type { MobileCourseCatalogEntry } from "@/lib/mobile-course-options";
import type { LessonStatus } from "@/lib/progress";
import type { MyClassroomSummary } from "@/lib/supabase/classrooms";

/** HSK түвшин → тэр түвшинд тохирох 发展汉语 дэвтэр. */
const FAZHAN_BY_LEVEL: Record<number, string> = {
  1: "fazhan-chuji1",
  2: "fazhan-chuji1",
  3: "fazhan-chuji2",
  4: "fazhan-zhongji1",
  5: "fazhan-zhongji2",
  6: "fazhan-gaoji1",
};

type Props = {
  loggedIn: boolean;
  catalog: MobileCourseCatalogEntry[];
  fazhanCatalog: MobileCourseCatalogEntry[];
};

type BookState = {
  entry: MobileCourseCatalogEntry;
  label: string;
  done: number;
  total: number;
  started: boolean;
  nextLessonId: string | null;
  nextLessonTitle: string | null;
};

/**
 * Ангид элссэн сурагчийн Нүүрийн дээд хэсэг: бүх зүйл ангийнх нь HSK түвшинд түгжигдэнэ.
 * Ангигүй хүнд юу ч харагдахгүй.
 */
export function ClassHomeCard({ loggedIn, catalog, fazhanCatalog }: Props) {
  const locale = useUiLocale();
  const [classroom, setClassroom] = useState<MyClassroomSummary | null>(null);
  const [status, setStatus] = useState<Record<string, LessonStatus>>({});

  useEffect(() => {
    if (!loggedIn) return;
    let alive = true;
    void (async () => {
      try {
        const { getMyClassroomSummary } = await import("@/lib/supabase/classrooms");
        const mine = await getMyClassroomSummary();
        if (alive) setClassroom(mine);
      } catch {
        // Алдаа гарвал хэсгийг чимээгүй нууна.
      }
    })();
    return () => {
      alive = false;
    };
  }, [loggedIn]);

  const level = classroom?.hskLevel ?? null;

  const bookEntries = useMemo(() => {
    if (level == null) return [];
    const standard = catalog.find((e) => e.courseId === `hsk${level}` && e.lessons.length > 0);
    const fazhan = fazhanCatalog.find(
      (e) => e.courseId === FAZHAN_BY_LEVEL[level] && e.lessons.length > 0
    );
    const list: { entry: MobileCourseCatalogEntry; label: string }[] = [];
    if (standard) list.push({ entry: standard, label: `HSK标准教程 ${level}` });
    if (fazhan) list.push({ entry: fazhan, label: `发展汉语 · ${fazhan.chipLabel}` });
    return list;
  }, [level, catalog, fazhanCatalog]);

  useEffect(() => {
    const ids = bookEntries.flatMap((b) => b.entry.lessons.map((l) => l.id));
    if (ids.length === 0) return;
    let alive = true;
    void (async () => {
      try {
        const { getLessonProgressMapSmart } = await import("@/lib/progress");
        const { byLesson } = await getLessonProgressMapSmart(ids);
        if (alive) setStatus(byLesson as Record<string, LessonStatus>);
      } catch {
        // Явц уншигдаагүй бол «эхлээгүй» гэж харуулна.
      }
    })();
    return () => {
      alive = false;
    };
  }, [bookEntries]);

  if (!classroom || level == null) return null;

  const books: BookState[] = bookEntries.map(({ entry, label }) => {
    const lessons = entry.lessons;
    const done = lessons.filter((l) => status[l.id] === "completed").length;
    const started = lessons.some((l) => (status[l.id] ?? "not_started") !== "not_started");
    const next = lessons.find((l) => status[l.id] !== "completed") ?? null;
    return {
      entry,
      label,
      done,
      total: lessons.length,
      started,
      nextLessonId: next?.id ?? null,
      nextLessonTitle: next?.title ?? null,
    };
  });

  const row =
    "flex items-center gap-3 border-t border-[var(--app-border)] py-3 text-left first:border-t-0";
  const num =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--app-border)] text-xs font-extrabold text-[var(--app-primary-dark)]";

  return (
    <section className="bs-page-in mb-4">
      <div className="rounded-[22px] bg-[var(--app-primary)] px-5 py-4 text-white">
        <p className="text-[11px] font-extrabold uppercase tracking-wide opacity-90">
          {tr(locale, "Миний анги")}
        </p>
        <p className="mt-0.5 text-xl font-black" translate="no">
          {new RegExp(`hsk\\s*-?\\s*${level}`, "i").test(classroom.name)
            ? classroom.name
            : `HSK ${level} · ${classroom.name}`}
        </p>
        <p className="mt-1 text-xs font-semibold opacity-95">
          {tr(locale, "Доорх бүх зүйл чиний ангийн түвшинд тохирсон.")}
        </p>
      </div>

      <div className="mt-3 rounded-[22px] border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-1 shadow-[var(--app-shadow)]">
        <Link href={`/review/memorize?level=${level}`} className={row}>
          <span className={num}>1</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-[var(--app-text)]">
              {tr(locale, "Үгээ ялга")}
            </span>
            <span className="block text-xs font-semibold text-[var(--app-muted)]">
              HSK {level}-{tr(locale, "ийн үгсээс мэддэг, мэдэхгүйгээ өөрөө ялгаарай")}
            </span>
          </span>
          <span className="text-[var(--app-muted)]" aria-hidden>›</span>
        </Link>

        {books.map((book, i) => {
          const finished = book.total > 0 && book.done === book.total;
          const hint = finished
            ? tr(locale, "Энэ номыг дуусгасан ✓")
            : !book.started
              ? tr(locale, "Энэ номыг үзээгүй байна. Эхнээс нь дуусгаарай.")
              : `${tr(locale, "Дараагийнх")}: ${book.nextLessonTitle ?? ""}`;
          const href = book.nextLessonId
            ? lessonPath(book.nextLessonId)
            : (book.entry.allLessonsHref ?? "/nom");
          return (
            <Link key={book.entry.courseId} href={href} className={row}>
              <span className={num}>{i + 2}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-extrabold text-[var(--app-text)]" translate="no">
                    {tr(locale, "Ном")}: {book.label}
                  </span>
                  <span className="shrink-0 text-xs font-extrabold text-[var(--app-primary-dark)]">
                    {book.done}/{book.total}
                  </span>
                </span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[var(--app-primary-light)]">
                  <span
                    className="block h-full rounded-full bg-[var(--app-primary)]"
                    style={{ width: `${book.total > 0 ? (book.done / book.total) * 100 : 0}%` }}
                  />
                </span>
                <span
                  className={`mt-1 block truncate text-xs font-semibold ${
                    !book.started && !finished ? "text-rose-600" : "text-[var(--app-muted)]"
                  }`}
                >
                  {hint}
                </span>
              </span>
              <span className="text-[var(--app-muted)]" aria-hidden>›</span>
            </Link>
          );
        })}

        <Link href={`/review/practice?level=${level}`} className={row}>
          <span className={num}>{books.length + 2}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-[var(--app-text)]">
              {tr(locale, "Жинхэнэ шалгалтын дасгал")}
            </span>
            <span className="block text-xs font-semibold text-[var(--app-muted)]">
              HSK {level} · {tr(locale, "хийнгээ сурна; мэдэхгүй үг дээрээ дарж цээжлэх рүү нэмнэ")}
            </span>
          </span>
          <span className="text-[var(--app-muted)]" aria-hidden>›</span>
        </Link>
      </div>
    </section>
  );
}
