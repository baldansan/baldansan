"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GamePracticeLinks } from "@/components/games/game-practice-links";
import { HskFlashcardVocabularyStudy } from "@/components/lesson/hsk-flashcard-vocabulary-study";
import { VocabularyFlashcardStudy } from "@/components/lesson/vocabulary-flashcard-study";
import { isPrelessonPackage } from "@/lib/admin/lesson-package-type";
import { EmptyState } from "@/components/empty-state";
import { LocalProgressNote } from "@/components/local-progress-note";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { LessonMobileStepBar } from "@/components/lesson-mobile-step-bar";
import { LearnerPageShell } from "@/components/ui/page-shell";
import {
  CtaButtonRow,
  ctaPrimaryClass,
  ctaSecondaryClass,
} from "@/components/ui/cta-button-row";
import { SectionCard } from "@/components/ui/section-card";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import { lettersDetailLinkLabel } from "@/lib/learner-letters-ui";
import { getSelectedLanguage } from "@/lib/learner-onboarding";
import { inferLessonLanguage } from "@/lib/language-track";
import {
  isFlashcardVocabularyLesson,
  koreanVocabularyPageTitle,
  resolveInitialVocabularyViewMode,
  type VocabularyViewMode,
} from "@/lib/lesson/korean-vocabulary-ui";
import {
  hskVocabularyPageTitle,
  isHskFlashcardVocabularyLesson,
} from "@/lib/lesson/hsk-vocabulary-ui";
import { isKoreanLesson0BeginnerFlow } from "@/lib/lesson/korean-lesson0-flow";
import { lessonTrainingPath } from "@/lib/content";
import { enrichVocabularyWithDbIds } from "@/lib/supabase/content";
import {
  getLearnedWordsSmart,
  toggleLearnedWordSmart,
  vocabularyWordKey,
} from "@/lib/progress";
import { SpeakerButton } from "@/components/tts/speaker-button";
import {
  resolveKoreanTtsLang,
  resolveVocabularyAudioUrl,
} from "@/lib/lesson/teaching-media";
import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyFilter, VocabularyWord } from "@/types/lesson";

const allFilters: { id: VocabularyFilter; label: string }[] = [
  { id: "all", label: "Бүгд" },
  { id: "HSK1", label: "HSK1" },
  { id: "HSK2", label: "HSK2" },
  { id: "HSK3", label: "HSK3" },
  { id: "HSK4", label: "HSK4" },
  { id: "HSK5", label: "HSK5" },
];

type Props = {
  lesson: LessonContent;
  adminPreview?: boolean;
  initialView?: string;
};

export function LessonVocabularyClient({
  lesson,
  adminPreview = false,
  initialView,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<VocabularyFilter>("all");
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [vocabulary, setVocabulary] = useState(lesson.vocabulary);
  const [lang, setLang] = useState<ReturnType<typeof getSelectedLanguage>>(null);
  const isKorean = inferLessonLanguage(lesson) === "ko";
  const isPrelesson = isPrelessonPackage(lesson);
  const isLesson0 = isKoreanLesson0BeginnerFlow(lesson);
  const useFlashcardDefault = isFlashcardVocabularyLesson(lesson, vocabulary);
  const useHskFlashcard = isHskFlashcardVocabularyLesson(lesson, vocabulary);
  const [viewMode, setViewMode] = useState<VocabularyViewMode>(() =>
    isLesson0
      ? "flashcard"
      : resolveInitialVocabularyViewMode(lesson, lesson.vocabulary, initialView)
  );

  useEffect(() => {
    if (initialView) {
      setViewMode(resolveInitialVocabularyViewMode(lesson, vocabulary, initialView));
    }
  }, [initialView, lesson, vocabulary]);

  useEffect(() => {
    setLang(getSelectedLanguage());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadVocabulary() {
      const enriched = await enrichVocabularyWithDbIds(
        lesson.id,
        lesson.vocabulary
      );
      if (!cancelled) {
        setVocabulary(enriched);
      }
    }

    void loadVocabulary();
    return () => {
      cancelled = true;
    };
  }, [lesson.id, lesson.vocabulary]);

  useEffect(() => {
    async function refresh() {
      const keys = await getLearnedWordsSmart(lesson.id, vocabulary);
      setLearned(new Set(keys));
    }

    const onFocus = () => {
      void refresh();
    };

    void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [lesson.id, vocabulary]);

  const visibleFilters = useMemo(() => {
    const levels = new Set(vocabulary.map((word) => word.hskLevel));
    return allFilters.filter(
      (item) => item.id === "all" || levels.has(item.id)
    );
  }, [vocabulary]);

  const filteredWords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vocabulary.filter((word) => {
      const matchesFilter = filter === "all" || word.hskLevel === filter;
      if (!matchesFilter) return false;
      if (!query) return true;
      return (
        word.chinese.toLowerCase().includes(query) ||
        word.pinyin.toLowerCase().includes(query) ||
        word.mongolian.toLowerCase().includes(query)
      );
    });
  }, [vocabulary, search, filter]);

  function resetFilters() {
    setSearch("");
    setFilter("all");
  }

  async function handleMarkAllVisible() {
    for (const word of filteredWords) {
      const key = vocabularyWordKey(word);
      if (learned.has(key)) continue;
      const enrichedWord =
        vocabulary.find((item) => vocabularyWordKey(item) === key) ?? word;
      const next = await toggleLearnedWordSmart(lesson.id, enrichedWord);
      setLearned(new Set(next));
    }
  }

  async function handleToggleLearned(word: VocabularyWord) {
    const key = vocabularyWordKey(word);
    const enrichedWord =
      vocabulary.find((item) => vocabularyWordKey(item) === key) ?? word;

    const nextSet = new Set(learned);
    if (nextSet.has(key)) {
      nextSet.delete(key);
    } else {
      nextSet.add(key);
    }
    setLearned(nextSet);

    const next = await toggleLearnedWordSmart(lesson.id, enrichedWord);
    setLearned(new Set(next));
  }

  const pageTitle = useHskFlashcard
    ? hskVocabularyPageTitle(lesson)
    : useFlashcardDefault
      ? koreanVocabularyPageTitle(lesson)
      : LEARNER_LESSON.vocabulary;
  const pageSubtitle = useFlashcardDefault
    ? useHskFlashcard
      ? "Нэг үг, нэг карт — Мэднэ эсвэл дахин давтана."
      : "Нэг үсэг, нэг үг — картаар алхмаар сур."
    : "Үг бүрийг pinyin, Монгол утга, жишээ өгүүлбэртэй сур.";
  const ttsLangDefault = resolveKoreanTtsLang(lesson);

  function vocabSpeakerProps(word: VocabularyWord) {
    return {
      lang: ttsLangDefault,
      courseId: lesson.courseId,
      hskLevel: word.hskLevel,
      audioUrl: resolveVocabularyAudioUrl(word, lesson.vocabularyAudioMap),
    };
  }

  return (
    <LearnerPageShell activeTab="study">
      {adminPreview ? <AdminPreviewBanner /> : null}
      {isLesson0 ? (
        <>
          <Link
            href={lessonTrainingPath(lesson.id, { preview: adminPreview })}
            className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
          >
            ← Хичээл рүү буцах
          </Link>
          <section>
            <h1 className="text-xl font-bold leading-snug text-slate-900">
              Картаар сурах
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Нэг үсэг, нэг үе — алхмаар давтана.
            </p>
          </section>
          {viewMode === "flashcard" ? (
            <VocabularyFlashcardStudy
              lesson={lesson}
              vocabulary={vocabulary}
              learned={learned}
              adminPreview={adminPreview}
              onMarkLearned={handleToggleLearned}
              onShowList={() => setViewMode("list")}
            />
          ) : null}
          {viewMode === "list" ? (
            <p className="text-center text-sm text-slate-600">
              Жагсаалтаар харах горим — доорх үгс.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() =>
              setViewMode((mode) => (mode === "flashcard" ? "list" : "flashcard"))
            }
            className="mx-auto block text-xs font-medium text-slate-500 underline-offset-2 hover:text-emerald-700 hover:underline"
          >
            {viewMode === "flashcard" ? "Жагсаалтаар харах" : "Картаар сурах"}
          </button>
        </>
      ) : (
        <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href={lessonPreviewPath(lesson.id, { adminPreview })}
          className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
        >
          ← {LEARNER_LESSON.backToLesson}
        </Link>
        <Link
          href={lessonPreviewPath(lesson.id, { adminPreview, subpath: "watch" })}
          className="inline-flex w-fit items-center text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-600"
        >
          {LEARNER_LESSON.watch} →
        </Link>
      </div>

      <section>
        <h1 className="text-xl font-bold leading-snug tracking-tight sm:text-3xl">
          {pageTitle} — {lesson.title}
        </h1>
        <p className="mt-1 text-lg text-slate-700">{lesson.chineseTitle}</p>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">{pageSubtitle}</p>
        <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200 sm:rounded-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Сурсан
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">
            {learned.size}{" "}
            <span className="text-lg font-semibold text-emerald-600">
              / {vocabulary.length}
            </span>
          </p>
        </div>
        <div className="mt-2">
          <LocalProgressNote />
        </div>
        <div className="mt-4 rounded-2xl bg-purple-50 p-4 ring-1 ring-purple-200">
          <p className="text-sm font-semibold text-purple-900">Тоглоомоор давтах</p>
          <GamePracticeLinks
            lessonId={lesson.id}
            compact
            isKorean={isKorean}
            isPrelesson={isPrelesson}
            include={
              isKorean ? undefined : (["match", "translate"] as const)
            }
          />
        </div>
      </section>

      {useFlashcardDefault && !(useHskFlashcard && viewMode === "flashcard") ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode("flashcard")}
            className={
              viewMode === "flashcard"
                ? "min-h-[44px] rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
                : "min-h-[44px] rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
            }
          >
            Картаар сурах
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={
              viewMode === "list"
                ? "min-h-[44px] rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
                : "min-h-[44px] rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
            }
          >
            Жагсаалтаар харах
          </button>
        </div>
      ) : null}

      {useHskFlashcard && viewMode === "flashcard" ? (
        <button
          type="button"
          onClick={() => setViewMode("list")}
          className="mx-auto block text-xs font-medium text-slate-500 underline-offset-2 hover:text-emerald-700 hover:underline"
        >
          Жагсаалтаар харах
        </button>
      ) : null}

      {useHskFlashcard && viewMode === "list" ? (
        <button
          type="button"
          onClick={() => setViewMode("flashcard")}
          className="mx-auto block text-xs font-medium text-emerald-700 underline-offset-2 hover:underline"
        >
          ← Картаар сурах
        </button>
      ) : null}

      {useFlashcardDefault && viewMode === "flashcard" ? (
        useHskFlashcard ? (
          <HskFlashcardVocabularyStudy
            lesson={lesson}
            vocabulary={vocabulary}
            adminPreview={adminPreview}
            onShowList={() => setViewMode("list")}
          />
        ) : (
          <VocabularyFlashcardStudy
            lesson={lesson}
            vocabulary={vocabulary}
            learned={learned}
            adminPreview={adminPreview}
            onMarkLearned={handleToggleLearned}
            onShowList={() => setViewMode("list")}
          />
        )
      ) : null}

      {!useFlashcardDefault || viewMode === "list" ? (
        <>
      <SectionCard>
        <label htmlFor="vocab-search" className="sr-only">
          Үг хайх
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
                  ? "min-h-[44px] rounded-full bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
                  : "min-h-[44px] rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              }
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm font-medium text-slate-600">
          {LEARNER_LESSON.showingWords(filteredWords.length, vocabulary.length)}
        </p>
        {filteredWords.length > 0 ? (
          <button
            type="button"
            onClick={() => void handleMarkAllVisible()}
            className="mt-3 min-h-[44px] rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Харагдаж буй бүх үгийг сурсан гэж тэмдэглэх
          </button>
        ) : null}
      </SectionCard>

      <section className="flex flex-col gap-4">
        {vocabulary.length === 0 ? (
          <EmptyState
            title="Үгийн сан байхгүй"
            description="Энэ хичээлд үгийн жагсаалт одоогоор байхгүй байна."
            action={
              <Link
                href={lessonPreviewPath(lesson.id, { adminPreview })}
                className={ctaPrimaryClass}
              >
                {LEARNER_LESSON.backToLesson}
              </Link>
            }
          />
        ) : filteredWords.length === 0 ? (
          <EmptyState
            title="Үг олдсонгүй"
            description="Хайлт эсвэл HSK шүүлтүүрт тохирох үг олдсонгүй."
            action={
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-[44px] rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                Шүүлтүүр цэвэрлэх
              </button>
            }
          />
        ) : (
          filteredWords.map((word) => {
            const key = vocabularyWordKey(word);
            const isLearned = learned.has(key);
            const speaker = vocabSpeakerProps(word);
            return (
              <article
                key={key}
                className={
                  isLearned
                    ? "rounded-2xl bg-emerald-50/80 p-5 ring-2 ring-emerald-300 sm:rounded-3xl sm:p-6"
                    : "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-6"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
                      {word.chinese}
                    </p>
                    <p className="mt-1 text-sm text-emerald-700">{word.pinyin}</p>
                  </div>
                  <div className="flex shrink-0 items-start gap-2">
                    <SpeakerButton
                      text={word.chinese}
                      lang={speaker.lang}
                      courseId={speaker.courseId}
                      hskLevel={speaker.hskLevel}
                      audioUrl={speaker.audioUrl}
                      size="md"
                    />
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                      {word.hskLevel}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 break-words">
                  {word.mongolian}
                </p>

                <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-start gap-2">
                    <p className="min-w-0 flex-1 text-sm text-slate-900 break-words">
                      {word.exampleChinese}
                    </p>
                    {word.exampleChinese ? (
                      <SpeakerButton
                        text={word.exampleChinese}
                        lang={speaker.lang}
                        courseId={speaker.courseId}
                        hskLevel={speaker.hskLevel}
                        audioUrl={speaker.audioUrl}
                        size="sm"
                        label={`Жишээ уншуулах: ${word.exampleChinese}`}
                      />
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-600 break-words">
                    {word.exampleMongolian}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void handleToggleLearned(word);
                  }}
                  className={
                    isLearned
                      ? "mt-4 min-h-[44px] w-full rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white ring-2 ring-emerald-400"
                      : "mt-4 min-h-[44px] w-full rounded-full border-2 border-emerald-500 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                  }
                >
                  {isLearned
                    ? LEARNER_LESSON.addedToReview
                    : LEARNER_LESSON.markLearned}
                </button>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/games/translate?lessonId=${lesson.id}`}
                    className="min-h-[36px] rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800"
                  >
                    Орчуулах тоглох
                  </Link>
                  <Link
                    href={`/games/match?lessonId=${lesson.id}`}
                    className="min-h-[36px] rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800"
                  >
                    Холбох тоглох
                  </Link>
                  <Link
                    href={`/kanji/${encodeURIComponent(word.id || word.chinese)}?lessonId=${lesson.id}`}
                    className="min-h-[36px] rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {lettersDetailLinkLabel(lang)}
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </section>

      <CtaButtonRow>
        <Link
          href={lessonPreviewPath(lesson.id, { adminPreview, subpath: "watch" })}
          className={ctaSecondaryClass}
        >
          {LEARNER_LESSON.watch}
        </Link>
        <Link
          href={lessonPreviewPath(lesson.id, {
            adminPreview,
            subpath: "quiz",
          })}
          className={ctaPrimaryClass}
        >
          {LEARNER_LESSON.nextQuiz}
        </Link>
      </CtaButtonRow>
        </>
      ) : null}

      <LessonMobileStepBar
        lesson={lesson}
        current="vocabulary"
        adminPreview={adminPreview}
      />
      </>
      )}

      {isLesson0 && viewMode === "list" ? (
        <section className="flex flex-col gap-4">
          {vocabulary.map((word) => {
            const key = vocabularyWordKey(word);
            const isLearned = learned.has(key);
            const speaker = vocabSpeakerProps(word);
            return (
              <article
                key={key}
                className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"
              >
                <p className="text-2xl font-bold text-slate-900">{word.chinese}</p>
                <p className="text-sm text-emerald-700">{word.pinyin}</p>
                <p className="mt-1 text-sm text-slate-600">{word.mongolian}</p>
                <div className="mt-3 flex items-center gap-2">
                  <SpeakerButton
                    text={word.chinese}
                    lang={speaker.lang}
                    courseId={speaker.courseId}
                    hskLevel={speaker.hskLevel}
                    audioUrl={speaker.audioUrl}
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() => void handleToggleLearned(word)}
                    className={
                      isLearned
                        ? "text-xs font-semibold text-emerald-600"
                        : "text-xs font-semibold text-slate-600"
                    }
                  >
                    {isLearned ? "✓ Сурсан" : "Сурсан гэж тэмдэглэх"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
    </LearnerPageShell>
  );
}
