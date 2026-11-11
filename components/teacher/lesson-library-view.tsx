"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { useWorkspaceRole } from "@/components/workspace/workspace-context";
import {
  courseShelf,
  courseSortKey,
  prettyCourseTitle,
} from "@/lib/classroom/course-label";
import {
  getSupabaseAssignableLessons,
  type AssignableLesson,
} from "@/lib/supabase/content";

type Book = {
  courseId: string;
  title: string;
  lessons: AssignableLesson[];
};

type Shelf = { key: string; label: string; hint: string; books: Book[] };

function bookEmoji(courseId: string): string {
  const id = courseId.toLowerCase();
  if (/^yct/.test(id)) return "🧒";
  if (/^hsk/.test(id)) return "📘";
  if (/^fazhan/.test(id)) return "📙";
  return "📗";
}

export function LessonLibraryView() {
  const role = useWorkspaceRole();
  const isAdmin = role === "admin";
  const [lessons, setLessons] = useState<AssignableLesson[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openBook, setOpenBook] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getSupabaseAssignableLessons()
      .then((list) => {
        if (alive) setLessons(list);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setLessons([]);
        setError(err instanceof Error ? err.message : "Хичээлийн жагсаалтыг татаж чадсангүй.");
      });
    return () => {
      alive = false;
    };
  }, []);

  const q = query.trim().toLowerCase();

  const shelves = useMemo<Shelf[]>(() => {
    const books = new Map<string, Book>();
    for (const l of lessons ?? []) {
      if (q && !`${l.title} ${prettyCourseTitle(l.courseId, l.courseTitle)} ${l.id}`.toLowerCase().includes(q)) continue;
      const b = books.get(l.courseId);
      if (b) b.lessons.push(l);
      else
        books.set(l.courseId, {
          courseId: l.courseId,
          title: prettyCourseTitle(l.courseId, l.courseTitle),
          lessons: [l],
        });
    }
    const map = new Map<string, Shelf & { order: number }>();
    for (const b of books.values()) {
      const s = courseShelf(b.courseId);
      const cur = map.get(s.key);
      if (cur) cur.books.push(b);
      else map.set(s.key, { ...s, books: [b] });
    }
    return [...map.values()]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        ...s,
        books: s.books.sort((a, b) =>
          courseSortKey(a.courseId).localeCompare(courseSortKey(b.courseId), "en", {
            numeric: true,
          })
        ),
      }));
  }, [lessons, q]);

  const total = lessons?.length ?? 0;

  return (
    <TeacherShell active="help" showBottomNav={false}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Хичээлүүд</h1>
          <p className="text-sm text-slate-600">
            Сурагчдад нээлттэй {total} бэлэн хичээл — номоор нь бүлэглэсэн.
          </p>
        </div>
        {isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/lessons"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              ✏️ Засварын жагсаалт (ноорогтой)
            </Link>
            <Link
              href="/admin/import"
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              ➕ Шинээр оруулах
            </Link>
          </div>
        ) : null}
      </header>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Хичээл хайх… (жишээ: HSK 2, 时间, 5-р хичээл)"
        className="w-full max-w-md rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
      />

      {lessons === null ? (
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : shelves.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 ring-1 ring-slate-200">
          «{query}» гэсэн хичээл олдсонгүй.
        </p>
      ) : (
        shelves.map((shelf) => (
          <section key={shelf.key}>
            <h2 className="text-base font-bold text-slate-900">{shelf.label}</h2>
            <p className="mb-3 text-xs text-slate-500">{shelf.hint}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shelf.books.map((book) => {
                const open = openBook === book.courseId || Boolean(q);
                return (
                  <article
                    key={book.courseId}
                    className={`rounded-2xl bg-white ring-1 ring-slate-200 ${
                      open ? "sm:col-span-2 lg:col-span-3" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenBook(open && !q ? null : book.courseId)}
                      aria-expanded={open}
                      className="flex w-full items-center gap-3 p-4 text-left"
                    >
                      <span className="text-3xl" aria-hidden>
                        {bookEmoji(book.courseId)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-bold text-slate-900">
                          {book.title}
                        </span>
                        <span className="text-xs text-slate-500">
                          {book.lessons.length} хичээл
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-emerald-700">
                        {open ? "Хаах ▴" : "Нээх ▾"}
                      </span>
                    </button>
                    {open ? (
                      <ul className="grid gap-x-4 border-t border-slate-100 p-2 md:grid-cols-2">
                        {book.lessons.map((l, i) => (
                          <li
                            key={l.id}
                            className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-slate-50"
                          >
                            <span className="w-7 shrink-0 text-right text-xs tabular-nums text-slate-400">
                              {i + 1}.
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                              {l.title}
                              {l.status === "draft" ? (
                                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                  Ноорог
                                </span>
                              ) : null}
                            </span>
                            <a
                              href={`/lessons/${l.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-white"
                            >
                              Үзэх ↗
                            </a>
                            {isAdmin ? (
                              <Link
                                href={`/admin/lessons/${l.id}/edit`}
                                className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-white"
                              >
                                Засах
                              </Link>
                            ) : null}
                            {l.status === "draft" ? null : (
                              <Link
                                href={`/teacher/assignments/new?lesson=${l.id}`}
                                className="shrink-0 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Ангид өгөх
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </TeacherShell>
  );
}
