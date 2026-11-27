"use client";

import { BaldanSay } from "@/components/lesson/baldan-say";
import { baldanLine } from "@/lib/temee/baldan-lines";
import { readAnswerStreak } from "@/components/lesson/answer-streak";
import { fireConfetti } from "@/lib/games/game-fx";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LessonDifficultyFeedback } from "@/components/feedback/lesson-difficulty-feedback";
import { getBsQuizProgress } from "@/lib/lesson/bs-step-progress";
import { extractLessonPathSummaryData } from "@/lib/lesson/lesson-path-summary-data";
import {
  loadLessonPathReflection,
  saveLessonPathReflection,
} from "@/lib/lesson/lesson-path-reflection";
import { coursePath } from "@/lib/content";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { saveLessonWordsBatch } from "@/lib/supabase/saved-words";
import { SavedWordsHint } from "@/components/review/saved-words-hint";
import { markTodayHanzi } from "@/lib/today/today-path";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";

type Props = {
  lessonId: string;
  lesson: HskLessonPackage;
  courseId: string;
  nextLessonId?: string | null;
  adminPreview?: boolean;
  quizTotal?: number;
  /** Сорилын үе рүү буцаж алдсан асуултаа дахин харах. */
  onReviewQuiz?: () => void;
};

export function LessonPathSummaryStage({
  lessonId,
  lesson,
  courseId,
  nextLessonId = null,
  adminPreview = false,
  quizTotal = 0,
  onReviewQuiz,
}: Props) {
  const summary = useMemo(() => extractLessonPathSummaryData(lesson), [lesson]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [savingWords, setSavingWords] = useState(false);
  const [quizScore, setQuizScore] = useState<{
    correct: number;
    total: number;
    percent: number;
  } | null>(null);

  useEffect(() => {
    setAnswers(loadLessonPathReflection(lessonId, summary.reflectionQuestions.length));
    const savedQuiz = getBsQuizProgress(lessonId);
    if (savedQuiz?.finished && savedQuiz.correctCount >= 0) {
      const correct = savedQuiz.correctCount;
      const resolvedTotal = quizTotal > 0 ? quizTotal : savedQuiz.currentIndex + 1;
      setQuizScore({
        correct,
        total: resolvedTotal,
        percent:
          resolvedTotal > 0
            ? Math.round((correct / resolvedTotal) * 100)
            : 0,
      });
    }
  }, [lessonId, summary.reflectionQuestions.length, quizTotal]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  function handleAnswerChange(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      saveLessonPathReflection(lessonId, next);
      return next;
    });
  }

  const [savedToReview, setSavedToReview] = useState(false);

  // Хичээл дуусмагц «Ханзны дэвтэр» өөрөө гарч ирнэ (хичээл бүрд нэг удаа; мэддэг хүн алгасна).
  const hanziPromptKey = `bs:hanziPrompt:${lessonId}`;
  const [hanziPrompt, setHanziPrompt] = useState(false);
  const hanziPreview = useMemo(() => {
    const seen = new Set<string>();
    for (const item of summary.vocabulary) {
      for (const ch of item.zh ?? "") {
        if (/[\u4e00-\u9fff]/.test(ch)) seen.add(ch);
      }
    }
    return [...seen];
  }, [summary.vocabulary]);
  useEffect(() => {
    if (adminPreview || hanziPreview.length === 0) return;
    try {
      if (!window.localStorage.getItem(hanziPromptKey)) setHanziPrompt(true);
    } catch {
      // ignore
    }
  }, [adminPreview, hanziPreview.length, hanziPromptKey]);
  function closeHanziPrompt(skipped: boolean) {
    try {
      window.localStorage.setItem(hanziPromptKey, skipped ? "skipped" : "started");
    } catch {
      // ignore
    }
    if (skipped) markTodayHanzi("skipped");
    setHanziPrompt(false);
  }

  async function handleSaveAllWords() {
    if (summary.vocabulary.length === 0) return;
    setSavingWords(true);
    try {
      const result = await saveLessonWordsBatch(
        summary.vocabulary.map((item) => ({
          zh: item.zh,
          pinyin: item.pinyin,
          mn: item.mn,
        }))
      );
      if (!result.ok && result.error) {
        showToast(result.error);
        return;
      }
      showToast(
        `${result.added} үг давталтад нэмэгдлээ (${result.alreadyHad} аль хэдийн байсан) → Давтах → Миний үгс`
      );
      setSavedToReview(true);
    } finally {
      setSavingWords(false);
    }
  }

  const grammarCount = Array.isArray(lesson.grammar) ? lesson.grammar.length : 0;

  // Хамгийн урт «дараалсан зөв» ба хичээл дууссаны цаасан шүршүүр (нэг удаа).
  const [bestStreak, setBestStreak] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage-оос нэг удаа уншина
    setBestStreak(readAnswerStreak(lessonId).best);
    if (adminPreview) return;
    try {
      const k = `bs:lessonConfetti:${lessonId}`;
      if (window.sessionStorage.getItem(k)) return;
      window.sessionStorage.setItem(k, "1");
    } catch {
      // ignore
    }
    fireConfetti();
  }, [lessonId, adminPreview]);

  async function handleShare() {
    const title = `${lesson.title.zh} · ${lesson.title.mn}`;
    const text = `${lesson.level} ${lesson.lesson_number}-р хичээлээ дуусгалаа: ${title}. ${summary.vocabCount} шинэ үг.`;
    const url = "https://surtsgaay.buunduu.mn";
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      showToast("Хуулагдлаа — хүссэн газраа буулгаарай.");
    } catch {
      // хэрэглэгч хуваалцахыг цуцалсан — юу ч хийхгүй
    }
  }

  const nextHref = nextLessonId
    ? lessonPreviewPath(nextLessonId, { adminPreview, subpath: "watch" })
    : coursePath(courseId);

  const nextLabel = nextLessonId
    ? "Дараагийн хичээл рүү →"
    : "Курс руу буцах →";

  return (
    <div className="bs-path-summary">
      {hanziPrompt ? (
        <div className="bs-hanzi-prompt" role="dialog" aria-modal="true" aria-label="Ханзны дэвтэр">
          <div className="bs-hanzi-prompt-card">
            <p className="bs-stage-done-kicker">Хичээл дууслаа 🎉</p>
            <h2 className="bs-stage-done-title">Одоо ханзаа дэвтэртээ бичье</h2>
            <div className="bs-hanzi-prompt-chars" translate="no">
              {hanziPreview.slice(0, 8).map((ch) => (
                <span key={ch}>{ch}</span>
              ))}
              {hanziPreview.length > 8 ? <em>+{hanziPreview.length - 8}</em> : null}
            </div>
            <p className="bs-stage-done-meta">
              <b>{hanziPreview.length} ханз</b> · 2, 2-оор нь: 👀 харна → ✍️ дагаж зурна → 🧠 санаж бичнэ
            </p>
            <a
              href={`/writing/lesson/${encodeURIComponent(lessonId)}`}
              className="bs-stage-done-next bs-path-visible-cta"
              style={{ display: "block", textAlign: "center", textDecoration: "none" }}
              onClick={() => closeHanziPrompt(false)}
            >
              ✍️ Бичиж эхлэх
            </a>
            <button type="button" className="bs-hanzi-prompt-skip" onClick={() => closeHanziPrompt(true)}>
              Эдгээр ханзыг мэднэ — алгасъя
            </button>
          </div>
        </div>
      ) : null}
      {toast ? (
        <p className="bs-path-summary-toast" role="status">
          {toast}
        </p>
      ) : null}

      {/* Өнөөдрийн олз — дэлгэцийн зураг авч хуваалцахад зориулсан карт */}
      <div className="bs-share-card">
        <p className="bs-share-kicker">
          {lesson.level} · {lesson.lesson_number}-р хичээл · дууслаа
        </p>
        <h2 className="bs-share-zh" translate="no">{lesson.title.zh}</h2>
        <p className="bs-share-mn" translate="no">{lesson.title.mn}</p>
        <div className="bs-share-stats">
          <div><b>{summary.vocabCount}</b><span>үг</span></div>
          {grammarCount > 0 ? (
            <div><b>{grammarCount}</b><span>дүрэм</span></div>
          ) : null}
          {quizScore ? (
            <div><b>{quizScore.correct}/{quizScore.total}</b><span>сорил</span></div>
          ) : null}
          {bestStreak >= 3 ? (
            <div><b>🔥 {bestStreak}</b><span>дараалсан зөв</span></div>
          ) : null}
        </div>
        {summary.vocabulary.length > 0 ? (
          <div className="bs-share-words" translate="no">
            {summary.vocabulary.slice(0, 7).map((item) => (
              <span key={item.zh}>{item.zh}</span>
            ))}
            {summary.vocabulary.length > 7 ? <em>+{summary.vocabulary.length - 7}</em> : null}
          </div>
        ) : null}
        <div className="bs-share-foot">
          <p>
            Бөөндөө Сурцгаая
            <br />
            surtsgaay.buunduu.mn
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- жижиг статик зураг */}
          <img src="/temee/v2/thumbsup.webp" alt="" />
        </div>
      </div>
      <BaldanSay pose="relax" text={baldanLine("lessonDone", lesson.lesson_number)} />
      <button type="button" className="bs-share-btn" onClick={() => void handleShare()}>
        Хуваалцах
      </button>
      {quizScore && quizScore.correct < quizScore.total && onReviewQuiz ? (
        <button type="button" className="bs-review-card" onClick={onReviewQuiz}>
          <span className="bs-review-card-head">
            Дахин харах · {quizScore.total - quizScore.correct} асуулт алдсан
          </span>
          <span className="bs-review-card-sub">Сорилын тоймоос улаан дугаарыг дарж дахин хариулна →</span>
        </button>
      ) : null}

      <div className="bs-card">
        <div className="bs-label">
          <span className="bs-dot" />
          Өнөөдрийн олз
        </div>
        <p className="bs-path-summary-lead">
          <span className="bs-path-summary-n">{summary.vocabCount}</span> шинэ үг
        </p>
        {summary.vocabCount > 0 ? (
          <button
            type="button"
            className="bs-cta bs-path-summary-save-all"
            onClick={() => void handleSaveAllWords()}
            disabled={savingWords}
          >
            {savingWords ? "Нэмж байна..." : "Бүгдийг давталтад нэмэх"}
          </button>
        ) : (
          <p className="text-sm text-[var(--bs-muted)]">Шинэ үг байхгүй.</p>
        )}
        {savedToReview ? (
          <SavedWordsHint message="Хадгалагдлаа ✓" refreshKey={summary.vocabulary.length} />
        ) : null}
      </div>

      {summary.vocabCount > 0 ? (
        <div className="bs-card">
          <div className="bs-label">
            <span className="bs-dot" />
            Ханзны дэвтэр
          </div>
          <p className="bs-path-summary-lead">Одоо энэ хичээлийн ханзаа бичиж цээжил</p>
          <p className="text-sm text-[var(--bs-muted)]">
            👀 Харна → ✍️ дагаж бичнэ → 🧠 санаж бичнэ. Хэдэн удаа бичихээ дэвтэр дотроо өөрөө тохируулна.
          </p>
          <a
            href={`/writing/lesson/${encodeURIComponent(lessonId)}`}
            className="bs-cta bs-path-visible-cta bs-path-summary-save-all"
            style={{ display: "block", textAlign: "center", textDecoration: "none" }}
          >
            ✍️ Ханзаа бичиж эхлэх
          </a>
        </div>
      ) : null}

      {summary.structureChips.length > 0 ? (
        <div className="bs-card">
          <div className="bs-label">
            <span className="bs-dot" />
            Сурсан бүтэц
          </div>
          <div className="bs-chips" translate="no">
            {summary.structureChips.map((chip) => (
              <span key={chip} className="bs-chip">
                {chip}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {quizScore ? (
        <div className="bs-card">
          <div className="bs-label">
            <span className="bs-dot" />
            Сорилын үр дүн
          </div>
          <p className="bs-path-quiz-score">
            {quizScore.correct}/{quizScore.total} зөв · {quizScore.percent}%
          </p>
        </div>
      ) : null}

      {summary.reflectionQuestions.length > 0 ? (
        <div className="bs-card">
          <div className="bs-label">
            <span className="bs-dot" />
            Эргэцүүлье
          </div>
          <div className="bs-path-reflection-list">
            {summary.reflectionQuestions.map((question, index) => (
              <label key={`${index}-${question}`} className="bs-path-reflection-item">
                <span className="bs-path-reflection-q" translate="no">{question}</span>
                <textarea
                  className="bs-path-reflection-input"
                  rows={3}
                  placeholder="Хариултаа бичээрэй (заавал биш)"
                  value={answers[index] ?? ""}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                />
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <LessonDifficultyFeedback lessonId={lessonId} />

      <Link href={nextHref} className="bs-cta bs-path-summary-next">
        {nextLabel}
      </Link>
    </div>
  );
}
