"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type TouchEvent } from "react";
import type { UiLocale } from "@/lib/i18n/locale-types";
import { L } from "@/components/books/book-ui";
import { markStoryFinished, readStoryPage, writeStoryPage } from "@/lib/library/story-progress";

/**
 * Зурагт номын уншигч — нэг удаад нэг хуудас. Контент (хятад, пиньинь, англи, нэрс)
 * бүгд translate="no" root дотор; UI мөрүүд L(locale, zh, mn).
 */

export type ReaderPage = {
  id: string;
  page: number;
  zh: string;
  pinyin: string;
  image?: string;
  audio?: string;
  en?: string;
};

export type ReaderStory = {
  id: string;
  title: string;
  title_pinyin: string;
  title_en?: string;
  cover: string;
  authors: string[];
  illustrators: string[];
  narrator?: string;
  audio_full?: string;
  pages: ReaderPage[];
};

const readProgress = readStoryPage;
const writeProgress = writeStoryPage;

function subscribeStorage(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function StoryReader({ story, locale }: { story: ReaderStory; locale: UiLocale }) {
  const total = story.pages.length;
  // 0 = нүүр, 1..total = хуудас, total+1 = дууссан
  const [idx, setIdx] = useState(0);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showEn, setShowEn] = useState(false);
  const [fullPlaying, setFullPlaying] = useState(false);
  const [pagePlaying, setPagePlaying] = useState(false);

  const pageAudioRef = useRef<HTMLAudioElement | null>(null);
  const fullAudioRef = useRef<HTMLAudioElement | null>(null);
  const touchX = useRef<number | null>(null);

  // Хадгалсан хуудас (localStorage) — сервер дээр 0, клиент дээр уншина.
  const savedPage = useSyncExternalStore(
    subscribeStorage,
    () => readProgress(story.id),
    () => 0,
  );
  const resumeAt = savedPage > 0 && savedPage <= total ? savedPage : 0;

  const stopPageAudio = useCallback(() => {
    const a = pageAudioRef.current;
    if (a) {
      a.pause();
      a.src = "";
      pageAudioRef.current = null;
    }
    setPagePlaying(false);
  }, []);

  const stopFullAudio = useCallback(() => {
    const a = fullAudioRef.current;
    if (a) {
      a.pause();
      a.src = "";
      fullAudioRef.current = null;
    }
    setFullPlaying(false);
  }, []);

  // Unmount үед дууг зогсооно
  useEffect(() => () => {
    stopPageAudio();
    stopFullAudio();
  }, [stopPageAudio, stopFullAudio]);

  const go = useCallback(
    (next: number) => {
      const n = Math.min(Math.max(0, next), total + 1);
      stopPageAudio();
      setIdx(n);
      if (n >= 1 && n <= total) writeProgress(story.id, n);
      else if (n === total + 1) {
        // Дууссан: хуудсыг 0 болгоод (дахин эхнээс нь) «уншиж дууссан» тэмдэг тавина
        writeProgress(story.id, 0);
        markStoryFinished(story.id);
      }
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    },
    [total, story.id, stopPageAudio],
  );

  const prev = useCallback(() => go(idx - 1), [go, idx]);
  const next = useCallback(() => go(idx + 1), [go, idx]);

  // Гарын сумнууд
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const playPage = (url: string) => {
    if (pagePlaying) {
      stopPageAudio();
      return;
    }
    stopPageAudio();
    stopFullAudio();
    const a = new Audio(url);
    pageAudioRef.current = a;
    a.onended = () => setPagePlaying(false);
    a.onerror = () => setPagePlaying(false);
    setPagePlaying(true);
    void a.play().catch(() => setPagePlaying(false));
  };

  const toggleFull = () => {
    if (!story.audio_full) return;
    if (fullPlaying) {
      stopFullAudio();
      return;
    }
    stopPageAudio();
    const a = new Audio(story.audio_full);
    fullAudioRef.current = a;
    a.onended = () => setFullPlaying(false);
    a.onerror = () => setFullPlaying(false);
    setFullPlaying(true);
    void a.play().catch(() => setFullPlaying(false));
  };

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const start = touchX.current;
    touchX.current = null;
    if (start === null) return;
    const end = e.changedTouches[0]?.clientX ?? start;
    const dx = end - start;
    if (dx > 50) prev();
    else if (dx < -50) next();
  };

  const navBtn = "app-btn-secondary min-h-[40px] flex-1 px-3 py-2";

  return (
    <div translate="no" className="select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Дээд мөр: бүтэн ном уншлага + тохиргоо */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {story.audio_full ? (
          <button
            type="button"
            onClick={toggleFull}
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
              fullPlaying ? "bg-amber-500 text-white ring-amber-500" : "bg-white text-[var(--app-text)] ring-slate-200"
            }`}
          >
            {fullPlaying ? L(locale, "⏹ 停止朗读", "⏹ Зогсоох") : L(locale, "🔊 整本朗读", "🔊 Бүтэн уншлага")}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setShowPinyin((v) => !v)}
          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
            showPinyin ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-[var(--app-text)] ring-slate-200"
          }`}
        >
          {L(locale, "拼音", "Пиньинь")}
        </button>
        {story.pages.some((p) => p.en) ? (
          <button
            type="button"
            onClick={() => setShowEn((v) => !v)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
              showEn ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-[var(--app-text)] ring-slate-200"
            }`}
          >
            {L(locale, "英文", "Англи")}
          </button>
        ) : null}
        {idx >= 1 && idx <= total ? (
          <span className="ml-auto text-xs font-semibold text-[var(--app-muted)]">
            {idx} / {total}
          </span>
        ) : null}
      </div>

      {idx === 0 ? (
        <Cover
          story={story}
          locale={locale}
          resumeAt={resumeAt}
          onStart={() => go(1)}
          onResume={() => go(resumeAt)}
        />
      ) : idx > total ? (
        <div className="app-card p-6 text-center">
          <p className="text-2xl font-bold text-[var(--app-text)]">{L(locale, "读完了 🎉", "Уншиж дууслаа 🎉")}</p>
          <div className="mt-5 flex flex-col gap-2">
            <button type="button" onClick={() => go(1)} className="app-btn-primary">
              {L(locale, "再读一遍", "Дахин унших")}
            </button>
            <Link href="/library/books" className="app-btn-secondary">
              {L(locale, "返回书库", "Номын сан руу буцах")}
            </Link>
          </div>
        </div>
      ) : (
        <PageView
          page={story.pages[idx - 1]}
          showPinyin={showPinyin}
          showEn={showEn}
          playing={pagePlaying}
          onPlay={playPage}
        />
      )}

      {/* Өмнөх / дараах */}
      {idx >= 1 && idx <= total ? (
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={prev} className={navBtn}>
            ‹ {L(locale, "上一页", "Өмнөх")}
          </button>
          <button type="button" onClick={next} className="app-btn-primary min-h-[40px] flex-1 px-3 py-2">
            {idx === total ? L(locale, "读完", "Дуусгах") : L(locale, "下一页", "Дараах")} ›
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Cover({
  story,
  locale,
  resumeAt,
  onStart,
  onResume,
}: {
  story: ReaderStory;
  locale: UiLocale;
  resumeAt: number;
  onStart: () => void;
  onResume: () => void;
}) {
  const row = (labelZh: string, labelMn: string, names: string[]) =>
    names.length > 0 ? (
      <p className="text-xs text-[var(--app-muted)]">
        <span className="font-semibold">{L(locale, labelZh, labelMn)}</span>: {names.join(", ")}
      </p>
    ) : null;

  return (
    <div className="app-card overflow-hidden">
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-slate-100 text-6xl">
        {story.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={story.cover} alt="" className="h-full w-full object-contain" />
        ) : (
          <span aria-hidden>📖</span>
        )}
      </div>
      <div className="p-4">
        <h1 className="hanzi text-2xl font-bold leading-snug text-[var(--app-text)]">{story.title}</h1>
        <p className="mt-1 text-sm text-[var(--app-muted)]">{story.title_pinyin}</p>
        {story.title_en ? <p className="text-xs text-[var(--app-muted)]">{story.title_en}</p> : null}
        <div className="mt-3 space-y-0.5">
          {row("作者", "Зохиогч", story.authors)}
          {row("绘者", "Зураач", story.illustrators)}
          {row("朗读", "Уншсан", story.narrator ? [story.narrator] : [])}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" onClick={onStart} className="app-btn-primary">
            {L(locale, "开始阅读", "Унших")}
          </button>
          {resumeAt > 0 ? (
            <button type="button" onClick={onResume} className="app-btn-secondary min-h-[36px] py-1.5 text-xs">
              {L(locale, `继续第 ${resumeAt} 页`, `${resumeAt}-р хуудаснаас үргэлжлүүлэх`)}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PageView({
  page,
  showPinyin,
  showEn,
  playing,
  onPlay,
}: {
  page: ReaderPage;
  showPinyin: boolean;
  showEn: boolean;
  playing: boolean;
  onPlay: (url: string) => void;
}) {
  return (
    <div className="app-card overflow-hidden">
      {page.image ? (
        <div className="w-full bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={page.image} alt="" className="h-auto w-full object-contain" />
        </div>
      ) : null}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="hanzi text-2xl leading-relaxed text-[var(--app-text)]">{page.zh}</p>
            {showPinyin ? <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">{page.pinyin}</p> : null}
            {showEn && page.en ? <p className="mt-2 text-sm leading-6 text-slate-500">{page.en}</p> : null}
          </div>
          {page.audio ? (
            <button
              type="button"
              onClick={() => onPlay(page.audio as string)}
              aria-label="play"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ring-1 ${
                playing ? "bg-amber-500 text-white ring-amber-500" : "bg-amber-50 text-amber-700 ring-amber-200"
              }`}
            >
              {playing ? "⏹" : "▶"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
