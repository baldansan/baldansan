"use client";



import Link from "next/link";

import {

  useCallback,

  useEffect,

  useMemo,

  useState,

  type MouseEvent,

  type ReactNode,
  useRef,
} from "react";

import { SpeakerButton } from "@/components/tts/speaker-button";
import { PronunciationPractice } from "@/components/speech/pronunciation-practice";
import { WordCharBreakdownPanel } from "@/components/review/word-char-breakdown-panel";
import { WordPracticeLauncher } from "@/components/review/word-practice-launcher";
import { WordPracticeDonePanel } from "@/components/review/practice/word-practice-done-panel";
import { WordPracticeMeaningView } from "@/components/review/practice/word-practice-meaning-view";
import { WordPracticeRadicalView } from "@/components/review/practice/word-practice-radical-view";
import { WordPracticeStrokeView } from "@/components/review/practice/word-practice-stroke-view";
import { WordSrsStrokePanel } from "@/components/review/word-srs-stroke-panel";

import { WordSrsRatingButtons } from "@/components/review/word-srs-rating-buttons";

import { getPrimaryPosLabelMn } from "@/lib/hsk/pos-catalog";

import { tr } from "@/lib/i18n/translate";

import { useUiLocale } from "@/lib/i18n/ui-locale";

import {

  buildSessionWordRows,

  defaultSelectedWordIds,

  type WordPracticeMode,

} from "@/lib/review/word-practice-types";

import { recordActivity } from "@/lib/retention/retention-service";

import {

  getLocalFavorites,

  rateLocalWordSrs,

  toggleLocalFavorite,

} from "@/lib/srs/local-word-srs";

import {
  clearSessionResume,
  queueSignature,
  readSessionResume,
  writeSessionResume,
} from "@/lib/srs/session-resume";

import type { WordSrsQueueItem, WordSrsRating } from "@/lib/srs/word-srs-types";

import { hasSupabaseConfig } from "@/lib/supabase/auth";

import { rateWordSrs } from "@/lib/supabase/user-word-srs";



type SessionPhase =
  | "study"
  | "summary"
  | "practice"
  | "practice-game"
  | "practice-done";



type Props = {

  queue: WordSrsQueueItem[];

  userId: string | null;

  title: string;

  subtitle?: ReactNode;

  progressGoal?: number;

  showLoginHint?: boolean;

  hskLevelLabel?: string;

  onSessionComplete?: () => void;

  onRated?: () => void;

  completeTitle?: string;

  completeMessage?: string;

  onRestart?: () => void;

  /** Багц/давталт дуусахад дасгалын сонголтын дэлгэц. */

  showPracticeLauncher?: boolean;

  enabledPracticeModes?: WordPracticeMode[];

  onNextBatch?: () => void;

  nextBatchLabel?: string;

  /**
   * Өгвөл session-ий байрлалыг localStorage-д хадгалж,
   * дундаас нь гарсан бол дараагийн удаа тэр картаас үргэлжлүүлнэ.
   */
  resumeKey?: string;

};



function isChineseWord(value: string | null | undefined): boolean {
  return Boolean(value && /[㐀-鿿]/.test(value));
}

function dedupeQueue(items: WordSrsQueueItem[]): WordSrsQueueItem[] {

  const seen = new Set<number>();

  const out: WordSrsQueueItem[] = [];

  for (const item of items) {

    const id = item.word.id;

    if (id == null || seen.has(id)) continue;

    seen.add(id);

    out.push(item);

  }

  return out;

}



export function WordSrsStudySession({

  queue: initialQueue,

  userId,

  title,

  subtitle,

  progressGoal,

  showLoginHint = false,

  hskLevelLabel,

  onSessionComplete,

  onRated,

  completeTitle = "✅ Багц дууслаа!",

  completeMessage,

  onRestart,

  showPracticeLauncher = false,

  enabledPracticeModes = [
    "radical",
    "stroke",
    "meaning-match",
    "srs-retry",
  ],

  onNextBatch,

  nextBatchLabel,

  resumeKey,

}: Props) {

  const locale = useUiLocale();

  const [phase, setPhase] = useState<SessionPhase>(

    initialQueue.length === 0 ? "summary" : "study"

  );

  const [queue, setQueue] = useState(initialQueue);

  const [practiceQueue, setPracticeQueue] = useState<WordSrsQueueItem[]>([]);

  // Багцын гарын үсэг — resume бичлэг өөр багцад таарахаас сэргийлнэ.
  const resumeSig = useMemo(
    () => queueSignature(initialQueue.map((item) => item.word.id)),
    [initialQueue]
  );

  const [index, setIndex] = useState(0);

  const [flipped, setFlipped] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [sessionDone, setSessionDone] = useState(0);

  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => new Set());

  const [error, setError] = useState<string | null>(null);

  const [finalRatings, setFinalRatings] = useState<

    Map<number, WordSrsRating>

  >(() => new Map());

  const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(

    () => new Set()

  );

  const [activePracticeMode, setActivePracticeMode] =
    useState<WordPracticeMode | null>(null);
  const [practiceGameKey, setPracticeGameKey] = useState(0);

  const activeQueue = phase === "practice" ? practiceQueue : queue;

  // Байрлал хадгалах: карт урагшлах бүрд бичнэ, session дуусахад арилгана.
  useEffect(() => {
    if (!resumeKey) return;
    if (phase === "study") {
      if (index > 0 && index < queue.length) {
        writeSessionResume(resumeKey, {
          sig: resumeSig,
          index,
          done: sessionDone,
        });
      }
      return;
    }
    if (phase === "summary") {
      clearSessionResume(resumeKey);
    }
  }, [resumeKey, phase, index, queue.length, sessionDone, resumeSig]);



  useEffect(() => {

    setQueue(initialQueue);

    setPracticeQueue([]);

    // Дундаас нь гарсан бол хадгалсан байрлалаас үргэлжлүүлнэ.
    const saved = resumeKey ? readSessionResume(resumeKey) : null;
    const resumeIndex =
      saved && saved.sig === resumeSig && saved.index < initialQueue.length
        ? saved.index
        : 0;

    setIndex(resumeIndex);

    setFlipped(false);

    setSessionDone(resumeIndex > 0 ? (saved?.done ?? 0) : 0);

    setFinalRatings(new Map());

    setSelectedWordIds(new Set());

    setActivePracticeMode(null);
    setPracticeGameKey(0);

    setError(null);

    setPhase(initialQueue.length === 0 ? "summary" : "study");

  }, [initialQueue, resumeKey, resumeSig]);



  const selectionSeededRef = useRef(false);

  useEffect(() => {

    if (phase !== "summary") {
      selectionSeededRef.current = false;
      return;
    }

    // Seed the default selection ONCE per summary visit — re-seeding on every
    // empty state made "Арилгах" (clear all) impossible to use.
    if (selectionSeededRef.current) return;
    selectionSeededRef.current = true;

    const words = buildSessionWordRows(initialQueue, finalRatings);

    setSelectedWordIds(defaultSelectedWordIds(words));

  }, [phase, finalRatings, initialQueue]);



  useEffect(() => {

    setFavoriteIds(getLocalFavorites());

  }, [index, phase]);



  const sessionWords = useMemo(
    () => buildSessionWordRows(initialQueue, finalRatings),
    [initialQueue, finalRatings]
  );

  const selectedPracticeWords = useMemo(
    () =>
      dedupeQueue(
        initialQueue.filter(
          (item) =>
            item.word.id != null && selectedWordIds.has(item.word.id)
        )
      ).map((item) => item.word),
    [initialQueue, selectedWordIds]
  );

  const selectedPracticeWordIds = useMemo(
    () => selectedPracticeWords.map((w) => w.id).filter((id) => id != null),
    [selectedPracticeWords]
  );



  const current = activeQueue[index];

  const total = activeQueue.length;

  const goal = progressGoal ?? (phase === "practice" ? practiceQueue.length : queue.length);

  const progressPct =
    phase === "practice"
      ? Math.round((index / Math.max(1, total)) * 100)
      : Math.round((sessionDone / Math.max(1, goal)) * 100);

  const progressLabel =

    phase === "practice"

      ? `${index + 1}/${total} ${tr(locale, "карт")} · ${tr(locale, "давталт")}`

      : `${sessionDone} / ${goal} · ${index + 1}/${total} ${tr(locale, "карт")}`;



  const finishMainSession = useCallback(() => {

    if (showPracticeLauncher && sessionDone > 0) {

      setPhase("summary");

      onSessionComplete?.();

      return;

    }

    setPhase("summary");

    onSessionComplete?.();

  }, [onSessionComplete, sessionDone, showPracticeLauncher]);



  const finishPracticeSession = useCallback(() => {

    setPhase("practice-done");

  }, []);



  async function handleRate(rating: WordSrsRating) {

    if (!current?.word?.id || submitting) return;

    setSubmitting(true);



    const wordId = current.word.id;

    let updatedSrs = current.srs;



    if (userId && hasSupabaseConfig) {

      const { data, error: rateError } = await rateWordSrs(

        userId,

        wordId,

        rating,

        current.srs

      );

      if (rateError) {

        setError(rateError);

        setSubmitting(false);

        return;

      }

      updatedSrs = data;

    } else {

      updatedSrs = rateLocalWordSrs(wordId, rating, current.srs);

    }



    void recordActivity("review_opened");

    if (phase === "study") {

      setSessionDone((n) => n + 1);

    }

    setFinalRatings((prev) => {

      const next = new Map(prev);

      next.set(wordId, rating);

      return next;

    });

    setFlipped(false);

    setSubmitting(false);

    onRated?.();



    const reinsert: WordSrsQueueItem = {

      ...current,

      srs: updatedSrs,

      isNew: false,

    };



    if (rating === "forgot" && phase === "study") {

      if (index >= queue.length - 1) {

        setQueue((prev) => [...prev, reinsert]);

        setIndex((i) => i + 1);

        return;

      }

      setQueue((prev) => {

        const next = [...prev];

        next.splice(index + 1, 0, reinsert);

        return next;

      });

      setIndex((i) => i + 1);

      return;

    }



    if (index >= activeQueue.length - 1) {

      if (phase === "practice" && activePracticeMode === "srs-retry") {
        finishPracticeSession();
      } else {

        finishMainSession();

      }

      return;

    }

    setIndex((i) => i + 1);

  }



  function startPractice(mode: WordPracticeMode) {

    if (!enabledPracticeModes.includes(mode)) return;

    if (selectedWordIds.size === 0) return;



    if (mode === "srs-retry") {
      const filtered = dedupeQueue(
        initialQueue.filter(
          (item) => item.word.id != null && selectedWordIds.has(item.word.id)
        )
      );
      if (filtered.length === 0) return;
      setPracticeQueue(filtered);
      setActivePracticeMode(mode);
      setIndex(0);
      setFlipped(false);
      setPhase("practice");
      return;
    }

    if (
      mode === "radical" ||
      mode === "stroke" ||
      mode === "meaning-match"
    ) {
      if (selectedPracticeWords.length === 0) return;
      setActivePracticeMode(mode);
      setPracticeGameKey((k) => k + 1);
      setPhase("practice-game");
    }
  }



  function restartPractice() {
    if (!activePracticeMode) return;

    if (activePracticeMode === "srs-retry") {
      if (practiceQueue.length === 0) return;
      setIndex(0);
      setFlipped(false);
      setPhase("practice");
      return;
    }

    setPracticeGameKey((k) => k + 1);
    setPhase("practice-game");
  }

  function finishExternalPractice() {
    setPhase("practice-done");
  }



  if (error) {

    return (

      <p className="py-8 text-center text-sm text-red-600">{error}</p>

    );

  }



  if (phase === "summary" && showPracticeLauncher) {

    return (

      <WordPracticeLauncher

        title={tr(locale, sessionDone > 0 ? completeTitle : "Энэ багц хоосон")}

        subtitle={
          typeof completeMessage === "string"
            ? tr(locale, completeMessage)
            : completeMessage
        }

        words={sessionWords}

        selectedIds={selectedWordIds}

        onSelectedIdsChange={setSelectedWordIds}

        onStartPractice={startPractice}

        enabledModes={enabledPracticeModes}

        onNextBatch={onNextBatch}

        nextBatchLabel={nextBatchLabel}

      />

    );

  }



  if (phase === "practice-game" && activePracticeMode) {
    const backToSummary = () => setPhase("summary");

    if (activePracticeMode === "radical") {
      return (
        <WordPracticeRadicalView
          wordIds={selectedPracticeWordIds}
          gameKey={practiceGameKey}
          onBackToSummary={backToSummary}
        />
      );
    }

    if (activePracticeMode === "stroke") {
      return (
        <WordPracticeStrokeView
          words={selectedPracticeWords}
          gameKey={practiceGameKey}
          onComplete={finishExternalPractice}
          onBackToSummary={backToSummary}
        />
      );
    }

    if (activePracticeMode === "meaning-match") {
      return (
        <WordPracticeMeaningView
          words={selectedPracticeWords}
          gameKey={practiceGameKey}
          onComplete={finishExternalPractice}
          onBackToSummary={backToSummary}
        />
      );
    }
  }

  if (phase === "practice-done" && activePracticeMode) {
    const detail =
      activePracticeMode === "srs-retry"
        ? `${practiceQueue.length} ${tr(locale, "үгийг дахин үнэллээ.")}`
        : `${selectedPracticeWords.length} ${tr(locale, "үгээр дасгал хийлээ.")}`;

    return (
      <WordPracticeDonePanel
        mode={activePracticeMode}
        detail={detail}
        onPlayAgain={restartPractice}
        onBackToSummary={() => setPhase("summary")}
      />
    );
  }



  if (phase === "summary" || !current) {

    return (

      <div className="bs-srs-done">

        <h2 className="text-xl font-bold text-[var(--app-text)]">

          {tr(locale, sessionDone > 0 ? completeTitle : "Энэ багц хоосон")}

        </h2>

        <p className="mt-2 text-sm text-[var(--app-muted)]">

          {(typeof completeMessage === "string"
            ? tr(locale, completeMessage)
            : completeMessage) ??

            (sessionDone > 0

              ? `${sessionDone} ${tr(locale, "карт үнэллээ.")}`

              : tr(locale, "Сонгосон шүүлтэд үг олдсонгүй."))}

        </p>

        {onRestart ? (

          <button

            type="button"

            onClick={onRestart}

            className="mt-5 min-h-[48px] w-full rounded-[14px] bg-[var(--app-primary)] text-sm font-extrabold text-white"

          >

            {tr(locale, "Буцах")}

          </button>

        ) : null}

      </div>

    );

  }



  const word = current.word;

  const isFavorite = word.id != null && favoriteIds.has(word.id);



  function handleToggleFavorite(event: MouseEvent) {

    event.stopPropagation();

    if (word.id == null) return;

    const nowFavorite = toggleLocalFavorite(word.id);

    setFavoriteIds((prev) => {

      const next = new Set(prev);

      if (nowFavorite) next.add(word.id!);

      else next.delete(word.id!);

      return next;

    });

  }



  const posLabelMn = getPrimaryPosLabelMn(word.pos);

  const posDisplay = posLabelMn ? tr(locale, posLabelMn) : null;

  const studyTitle =
    phase === "practice" ? tr(locale, "Дахин давталт") : tr(locale, title);



  return (

    <>

      {phase === "practice" ? (

        <button

          type="button"

          onClick={() => setPhase("summary")}

          className="bs-mem-back mb-2"

        >

          ← {tr(locale, "Дүгнэлт рүү")}

        </button>

      ) : null}



      <header className="bs-srs-header">

        <div className="min-w-0">

          <h1 className="bs-srs-title">{studyTitle}</h1>

          {subtitle && phase !== "practice" ? (

            <p className="mt-0.5 text-xs font-bold text-[var(--app-muted)]">

              {subtitle}

            </p>

          ) : phase === "practice" ? (

            <p className="mt-0.5 text-xs font-bold text-[var(--app-muted)]">

              {practiceQueue.length} {tr(locale, "сонгосон үг")}

            </p>

          ) : null}

        </div>

        <div className="bs-srs-progress-track">

          <div

            className="bs-srs-progress-fill"

            style={{ width: `${Math.min(100, progressPct)}%` }}

          />

        </div>

        <p className="bs-srs-progress-label">{progressLabel}</p>

        {showLoginHint && !userId && hasSupabaseConfig && phase === "study" ? (

          <p className="mt-2 text-[11px] text-[var(--app-muted)]">

            {tr(locale, "Нэвтэрвэл ахицаа бүх төхөөрөмж дээр хадгална.")}{" "}

            <Link

              href="/login"

              className="font-bold text-[var(--app-primary-dark)] underline"

            >

              {tr(locale, "Нэвтрэх")}

            </Link>

          </p>

        ) : null}

      </header>



      <div className="bs-srs-flip-scene">

        <div className="bs-srs-card-chrome">

          <div className="bs-srs-tags">

            {posDisplay ? (

              <span className="bs-srs-tag">{posDisplay}</span>

            ) : null}

            {hskLevelLabel ? (

              <span className="bs-srs-tag bs-srs-tag-hsk">{hskLevelLabel}</span>

            ) : null}

          </div>

          <button

            type="button"

            className={`bs-srs-fav ${isFavorite ? "bs-srs-fav-on" : ""}`}

            onClick={handleToggleFavorite}

            aria-label={tr(locale, isFavorite ? "Дуртлаас хасах" : "Дуртлаад нэмэх")}

            aria-pressed={isFavorite}

          >

            {isFavorite ? "★" : "☆"}

          </button>

        </div>

        <button

          type="button"

          className={`bs-srs-flip-card ${flipped ? "bs-srs-flip-card--flipped" : ""}`}

          onClick={() => setFlipped((f) => !f)}

          aria-label={tr(locale, flipped ? "Урд тал руу буцах" : "Ар талыг харах")}

        >

          <div className="bs-srs-flip-inner">

            <div className="bs-srs-flip-face bs-srs-flip-front">

              <p className="bs-srs-hanzi-only">{word.simplified}</p>

              <SpeakerButton
                text={word.simplified}
                lang="zh"
                size="lg"
                label={tr(locale, "Дуудлага сонсох")}
                stopPropagation
                showInlineError={false}
              />

              <p className="bs-srs-tap-hint">{tr(locale, "Дарж харуулна")}</p>

            </div>

            <div className="bs-srs-flip-face bs-srs-flip-back">

              <div className="flex items-center justify-center gap-2">
                <p className="bs-srs-pinyin">{word.pinyin ?? "—"}</p>
                <SpeakerButton
                  text={word.simplified}
                  lang="zh"
                  size="md"
                  label={tr(locale, "Дуудлага сонсох")}
                  stopPropagation
                  showInlineError={false}
                />
              </div>

              <p className="bs-srs-meaning">{word.meaning_mn ?? "—"}</p>

              {word.example_zh ? (

                <div className="bs-srs-example">

                  <p className="bs-srs-example-zh">{word.example_zh}</p>

                  {word.example_pinyin ? (

                    <p className="bs-srs-example-py">{word.example_pinyin}</p>

                  ) : null}

                  {word.example_mn ? (

                    <p className="bs-srs-example-mn">{word.example_mn}</p>

                  ) : null}

                </div>

              ) : null}

            </div>

          </div>

        </button>

      </div>

      {isChineseWord(word.simplified) ? (
        <PronunciationPractice
          text={word.simplified}
          pinyin={word.pinyin}
          className="mt-3"
        />
      ) : null}

      {flipped ? (

        <WordCharBreakdownPanel

          text={word.simplified}

          wordRadical={word.radical}

        />

      ) : null}



      {flipped ? (

        <WordSrsStrokePanel

          simplified={word.simplified}

          wordRadical={word.radical}

          active={flipped}

        />

      ) : null}



      {flipped ? (

        <WordSrsRatingButtons

          disabled={submitting}

          onRate={(rating) => void handleRate(rating)}

        />

      ) : (

        <p className="mt-3 text-center text-xs text-[var(--app-muted)]">

          {tr(locale, "Картыг дарж пиньинь, утга, жишээг харна")}

        </p>

      )}

    </>

  );

}


