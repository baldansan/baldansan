"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import {
  lessonPath,
  lessonQuizPath,
  lessonWatchPath,
} from "@/lib/content";
import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyFilter } from "@/types/lesson";

const allFilters: { id: VocabularyFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "HSK1", label: "HSK1" },
  { id: "HSK2", label: "HSK2" },
  { id: "HSK3", label: "HSK3" },
  { id: "HSK4", label: "HSK4" },
  { id: "HSK5", label: "HSK5" },
];

type Props = {
  lesson: LessonContent;
};

export function LessonVocabularyClient({ lesson }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<VocabularyFilter>("all");
  const [learned, setLearned] = useState<Set<string>>(new Set());

  const visibleFilters = useMemo(() => {
    const levels = new Set(lesson.vocabulary.map((word) => word.hskLevel));
    return allFilters.filter(
      (item) => item.id === "all" || levels.has(item.id)
    );
  }, [lesson.vocabulary]);

  const filteredWords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return lesson.vocabulary.filter((word) => {
      const matchesFilter = filter === "all" || word.hskLevel === filter;
      if (!matchesFilter) return false;
      if (!query) return true;
      return (
        word.chinese.toLowerCase().includes(query) ||
        word.pinyin.toLowerCase().includes(query) ||
        word.mongolian.toLowerCase().includes(query)
      );
    });
  }, [lesson, search, filter]);

  function toggleLearned(id: string) {
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-2 sm:gap-8 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={lessonPath(lesson.id)}
            className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
          >
            ← Lesson detail
          </Link>
          <Link
            href={lessonWatchPath(lesson.id)}
            className="inline-flex w-fit items-center text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-600"
          >
            Watch lesson →
          </Link>
        </div>

        <section>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Vocabulary — {lesson.title} {lesson.chineseTitle}
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Үг бүрийг pinyin, Монгол утга, жишээ өгүүлбэртэй сур.
          </p>
          <p className="mt-3 text-sm font-medium text-emerald-700">
            Learned: {learned.size} / {lesson.vocabulary.length}
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <label htmlFor="vocab-search" className="sr-only">
            Search vocabulary
          </label>
          <input
            id="vocab-search"
            type="search"
            placeholder="Үг хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-emerald-500 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleFilters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={
                  filter === item.id
                    ? "rounded-full bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
                    : "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          {filteredWords.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
              Үг олдсонгүй.
            </p>
          ) : (
            filteredWords.map((word) => {
              const isLearned = learned.has(word.id);
              return (
                <article
                  key={word.id}
                  className={
                    isLearned
                      ? "rounded-2xl bg-emerald-50/80 p-5 ring-2 ring-emerald-300 sm:p-6"
                      : "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-3xl font-bold text-slate-900">
                      {word.chinese}
                    </p>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                      {word.hskLevel}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-emerald-700">{word.pinyin}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {word.mongolian}
                  </p>

                  <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <p className="text-sm text-slate-900">{word.exampleChinese}</p>
                    <p className="text-sm text-slate-600">{word.exampleMongolian}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleLearned(word.id)}
                    className={
                      isLearned
                        ? "mt-4 w-full rounded-full border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                        : "mt-4 w-full rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                    }
                  >
                    {isLearned ? "Learned ✓" : "Mark as learned"}
                  </button>
                </article>
              );
            })
          )}
        </section>

        <section className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={lessonWatchPath(lesson.id)}
            className="flex-1 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-center text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            Watch lesson
          </Link>
          <Link
            href={lessonQuizPath(lesson.id)}
            className="flex-1 rounded-full bg-emerald-500 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Quiz
          </Link>
        </section>
      </main>
    </div>
  );
}
