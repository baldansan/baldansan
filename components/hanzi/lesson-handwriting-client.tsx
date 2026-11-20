"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";
import { recordWritingCharRemote } from "@/lib/analytics/learner-records";
import { seedLocalWritingSrs } from "@/lib/srs/writing-srs";
import { recordWritingResult } from "@/lib/srs/writing-srs-sync";
import { SpeakerButton } from "@/components/tts/speaker-button";
import "@/components/lesson/lesson-player.css";

/** hanzi-writer самбар — ханз сонгосон үед л татна. */
const CharacterWriter = dynamic(
  () => import("@/components/hanzi/CharacterWriter").then((m) => m.CharacterWriter),
  { ssr: false, loading: () => <p className="bs-srs-stroke-loading">Ачааллаж байна…</p> }
);

/** «Бичих сургалт»-тай нэг түлхүүр — нэг ханзыг хоёр газар давхар бичүүлэхгүй. */
const PROGRESS_KEY = "buunduu-handwriting-progress-v1";
const OPEN_KEY = "buunduu-huh-hot-open-v1";

type LessonWord = { w: string; py: string; mn: string };
type Lesson = { n: number; topic: string; words: LessonWord[]; chars: string[] };
type StoriesData = Record<string, { m: string; story: string }>;
type RecallItem = { char: string; word: LessonWord; masked: string };

function readProgress(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? "[]") as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeProgress(done: Set<string>) {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify([...done]));
  } catch {
    // Санах ой дүүрсэн — зөвхөн энэ удаадаа хадгална.
  }
}

const HANZI_RE = /[一-鿿]/;

/** Хичээлийн үг бүрийн ханзыг дарааллаар нь асуух жагсаалт (үгийн бусад ханз харагдана). */
function buildRecall(lesson: Lesson): RecallItem[] {
  const items: RecallItem[] = [];
  for (const word of lesson.words) {
    const chars = [...word.w];
    chars.forEach((c, i) => {
      if (!HANZI_RE.test(c)) return;
      const masked = chars.map((x, j) => (j === i ? "＿" : x)).join("");
      items.push({ char: c, word, masked });
    });
  }
  return items;
}

export function LessonHandwritingClient() {
  const locale = useUiLocale();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [stories, setStories] = useState<StoriesData>({});
  const [loadError, setLoadError] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [openLesson, setOpenLesson] = useState<number | null>(null);
  const [showWords, setShowWords] = useState(false);
  const [active, setActive] = useState<{ lesson: Lesson; char: string } | null>(null);
  const [recall, setRecall] = useState<{ items: RecallItem[]; index: number } | null>(null);

  useActivityTracker("writing", "huh-hot");

  useEffect(() => {
    let cancelled = false;
    fetch("/data/xinhsk3_lessons.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((json: Lesson[]) => {
        if (cancelled) return;
        setLessons(json);
        const progress = readProgress();
        setDone(progress);
        // Сүүлд нээсэн хичээл; байхгүй бол бүрэн бичээгүй эхний хичээл.
        let saved: number | null = null;
        try {
          saved = Number(window.localStorage.getItem(OPEN_KEY)) || null;
        } catch {
          saved = null;
        }
        const firstOpen =
          json.find((l) => l.n === saved) ??
          json.find((l) => l.chars.some((c) => !progress.has(c))) ??
          json[0];
        setOpenLesson(firstOpen?.n ?? null);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    fetch("/data/hsk30_stories.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then((json: StoriesData) => {
        if (!cancelled) setStories(json ?? {});
      })
      .catch(() => {
        // Түүх бол нэмэлт — түүнгүйгээр бичих дасгал ажиллана.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    const all = new Set<string>();
    for (const l of lessons ?? []) for (const c of l.chars) all.add(c);
    let written = 0;
    for (const c of all) if (done.has(c)) written += 1;
    return { all: all.size, written };
  }, [lessons, done]);

  function toggleLesson(n: number) {
    setShowWords(false);
    setOpenLesson((prev) => {
      const next = prev === n ? null : n;
      try {
        if (next != null) window.localStorage.setItem(OPEN_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function addDone(char: string) {
    setDone((prev) => {
      const next = new Set(prev);
      next.add(char);
      writeProgress(next);
      return next;
    });
  }

  function wordsWith(lesson: Lesson, char: string): LessonWord[] {
    return lesson.words.filter((w) => w.w.includes(char));
  }

  function markDone(lesson: Lesson, char: string) {
    recordWritingCharRemote(char);
    const meaning = stories[char]?.m ?? wordsWith(lesson, char)[0]?.mn ?? null;
    // Бичсэн ханз «Бичих» давталтад маргааш давтахаар орно (байвал өөрчлөхгүй).
    seedLocalWritingSrs({ key: char, meaning });
    addDone(char);
    const idx = lesson.chars.indexOf(char);
    const nextChar =
      lesson.chars.slice(idx + 1).find((c) => !done.has(c)) ??
      lesson.chars.find((c) => !done.has(c) && c !== char) ??
      null;
    setActive(nextChar ? { lesson, char: nextChar } : null);
  }

  return (
    <div className="pb-6">
      <h1 className="bs-rv-title">{tr(locale, "Хөх хотынхонд")}</h1>
      <p className="mb-3 text-sm leading-6 text-[var(--app-muted)]">
        {tr(locale, "HSK 3-ын номын хичээл эхлэхээс өмнө шинэ үгээ таньж, ханз бүрийг зурлагаар нь бичиж бэлдээрэй.")}
      </p>

      <div className="mb-4 rounded-2xl bg-[var(--app-card)] p-4 shadow-[var(--app-shadow)] ring-1 ring-[var(--app-border)]">
        <p className="text-sm font-extrabold text-[var(--app-text)]">{tr(locale, "Яаж хийх вэ")}</p>
        <ol className="mt-2 space-y-1 text-sm leading-6 text-[var(--app-text)]">
          <li>1. {tr(locale, "Маргаашийн хичээлээ сонго.")}</li>
          <li>2. {tr(locale, "«Шинэ үг»-ийг нээж, үг бүрийг сонсоод утгыг нь унш.")}</li>
          <li>3. {tr(locale, "Ханз бүр дээр дарж бич: эхлээд дагаж, дараа нь санаж.")}</li>
          <li>4. {tr(locale, "Бүгдийг бичээд «Санаж бичих сорил»-оор өөрийгөө шалга.")}</li>
        </ol>
        {lessons ? (
          <>
            <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[var(--app-muted)]">
              <span>
                {totals.written}/{totals.all} {tr(locale, "ханз бичсэн")}
              </span>
              <span>{totals.all > 0 ? Math.round((totals.written / totals.all) * 100) : 0}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${totals.all > 0 ? (totals.written / totals.all) * 100 : 0}%` }}
              />
            </div>
          </>
        ) : null}
      </div>

      {loadError ? (
        <p className="text-sm text-[var(--app-muted)]">
          {tr(locale, "Өгөгдөл ачаалагдсангүй. Сүлжээгээ шалгаад дахин оролдоно уу.")}
        </p>
      ) : lessons == null ? (
        <p className="text-sm text-[var(--app-muted)]">{tr(locale, "Ачаалж байна…")}</p>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const isOpen = openLesson === lesson.n;
            const written = lesson.chars.filter((c) => done.has(c)).length;
            const complete = written === lesson.chars.length;
            return (
              <section
                key={lesson.n}
                className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200"
              >
                <button
                  type="button"
                  onClick={() => toggleLesson(lesson.n)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[var(--app-text)]">
                      {lesson.n}-{tr(locale, "р хичээл")} · {lesson.topic}
                    </span>
                    <span
                      className={`block text-xs font-semibold ${
                        complete ? "text-emerald-600" : "text-[var(--app-muted)]"
                      }`}
                    >
                      {written}/{lesson.chars.length} {tr(locale, "ханз")} · {lesson.words.length}{" "}
                      {tr(locale, "үг")}
                      {complete ? " ✓" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-[var(--app-muted)]">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen ? (
                  <>
                    <div className="px-3 pb-2">
                      <button
                        type="button"
                        onClick={() => setShowWords((v) => !v)}
                        aria-expanded={showWords}
                        className="w-full rounded-xl bg-slate-50 px-3 py-2.5 text-left text-sm font-bold text-[var(--app-text)] ring-1 ring-slate-200"
                      >
                        {tr(locale, "Шинэ үг")} ({lesson.words.length}) {showWords ? "▲" : "▼"}
                      </button>
                      {showWords ? (
                        <ul className="mt-2 divide-y divide-slate-100">
                          {lesson.words.map((word) => (
                            <li key={word.w} className="flex items-center gap-2 py-2">
                              <SpeakerButton
                                text={word.w}
                                lang="zh"
                                size="sm"
                                label={tr(locale, "Дуудлага сонсох")}
                                showInlineError={false}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block text-base font-semibold text-[var(--app-text)]" translate="no">
                                  {word.w}{" "}
                                  <span className="text-xs font-medium text-[var(--app-muted)]">{word.py}</span>
                                </span>
                                <span className="block text-sm text-[var(--app-muted)]">{word.mn}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-6 gap-1.5 px-3 pb-3 sm:grid-cols-8">
                      {lesson.chars.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setActive({ lesson, char: c })}
                          translate="no"
                          className={`flex aspect-square items-center justify-center rounded-xl text-xl font-semibold transition-colors ${
                            done.has(c)
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-50 text-[var(--app-text)] ring-1 ring-slate-200 active:bg-emerald-50"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    <div className="px-3 pb-3">
                      <button
                        type="button"
                        onClick={() => setRecall({ items: buildRecall(lesson), index: 0 })}
                        className="w-full rounded-xl bg-amber-100 px-3 py-2.5 text-sm font-bold text-amber-800 ring-1 ring-amber-200"
                      >
                        🧠 {tr(locale, "Санаж бичих сорил")}
                      </button>
                    </div>
                  </>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      {active ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 p-3"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-[var(--app-text)]">
                  <span translate="no">{active.char}</span> · {tr(locale, "Бичих дасгал")}
                </p>
                <SpeakerButton
                  text={active.char}
                  lang="zh"
                  size="sm"
                  label={tr(locale, "Дуудлага сонсох")}
                  showInlineError={false}
                />
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                {tr(locale, "Хаах")}
              </button>
            </div>

            <div className="mb-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                {tr(locale, "Энэ хичээлийн үгэнд")}
              </p>
              {wordsWith(active.lesson, active.char).map((word) => (
                <p key={word.w} className="mt-1 text-sm leading-6 text-[var(--app-text)]">
                  <span className="text-base font-semibold" translate="no">{word.w}</span>{" "}
                  <span className="text-xs text-[var(--app-muted)]" translate="no">{word.py}</span> — {word.mn}
                </p>
              ))}
            </div>

            {stories[active.char] ? (
              <div className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  {tr(locale, "🧠 Толгойдоо ургуулж бод")}
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-900" translate="no">
                  {stories[active.char]!.story}
                </p>
              </div>
            ) : null}

            <CharacterWriter
              key={active.char}
              character={{ hanzi: active.char, pinyin: [], practice: "write" }}
              mode="write"
              onComplete={() => markDone(active.lesson, active.char)}
            />
          </div>
        </div>
      ) : null}

      {recall && recall.items[recall.index] ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 p-3"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-[var(--app-text)]">
                🧠 {tr(locale, "Санаж бичих сорил")} · {recall.index + 1}/{recall.items.length}
              </p>
              <button
                type="button"
                onClick={() => setRecall(null)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                {tr(locale, "Хаах")}
              </button>
            </div>
            {(() => {
              const item = recall.items[recall.index]!;
              return (
                <>
                  <div className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 text-center ring-1 ring-amber-200">
                    <p className="text-base font-bold text-amber-900">{item.word.mn}</p>
                    <div className="mt-1 flex items-center justify-center gap-2">
                      <span className="text-xl font-semibold text-amber-900" translate="no">
                        {item.masked}
                      </span>
                      <span className="text-sm text-amber-700" translate="no">{item.word.py}</span>
                      <SpeakerButton
                        text={item.word.w}
                        lang="zh"
                        size="sm"
                        label={tr(locale, "Дуудлага сонсох")}
                        showInlineError={false}
                      />
                    </div>
                    <p className="mt-1 text-xs text-amber-700">
                      {tr(locale, "Зураастай ханзыг цээжээрээ бич")}
                    </p>
                  </div>
                  <CharacterWriter
                    key={`recall-${recall.index}-${item.char}`}
                    character={{ hanzi: item.char, pinyin: [], practice: "write" }}
                    mode="recall"
                    onResult={(result) =>
                      recordWritingResult({ key: item.char, meaning: item.word.mn }, result)
                    }
                    onComplete={() => {
                      recordWritingCharRemote(item.char);
                      addDone(item.char);
                      if (recall.index >= recall.items.length - 1) setRecall(null);
                      else setRecall({ items: recall.items, index: recall.index + 1 });
                    }}
                  />
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
