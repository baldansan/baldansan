"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ToneHanzi } from "@/components/hanzi/ToneHanzi";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import {
  getQuickStartCompleted,
  setQuickStartCompleted,
} from "@/lib/learner-onboarding";
import { recordActivity } from "@/lib/retention/retention-service";

/**
 * 60 секундын онбординг — «1 минутад 5 үг сур».
 * Шинэ (нэвтрээгүй эсвэл явцгүй) хэрэглэгчид нүүрэн дээр харагдана:
 * HSK 1-ийн 5 үг хөгийн өнгөт картаар → 5 асуулттай мини сорил → бүртгүүлэх урилга.
 * Дууссан бол localStorage-д тэмдэглэж дахиж харуулахгүй.
 */

type QuickWord = {
  zh: string;
  pinyin: string;
  mn: string;
  zhGloss: string;
};

const WORDS: QuickWord[] = [
  { zh: "你好", pinyin: "nǐ hǎo", mn: "Сайн уу", zhGloss: "问候语" },
  { zh: "谢谢", pinyin: "xièxie", mn: "Баярлалаа", zhGloss: "感谢" },
  { zh: "我", pinyin: "wǒ", mn: "Би", zhGloss: "第一人称" },
  { zh: "水", pinyin: "shuǐ", mn: "Ус", zhGloss: "饮用的水" },
  { zh: "爱", pinyin: "ài", mn: "Хайрлах", zhGloss: "喜爱" },
];

type Stage = "words" | "quiz" | "done";

function shuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

type Props = {
  loggedIn: boolean;
  /** Явцтай хэрэглэгч (дууссан хичээлтэй) — карт харуулахгүй. */
  hasProgress: boolean;
};

const QUICK_START_EVENT = "bs:quick-start-done";

function subscribeQuickStart(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(QUICK_START_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(QUICK_START_EVENT, onChange);
  };
}

export function QuickStartCard({ loggedIn, hasProgress }: Props) {
  const locale = useUiLocale();
  // Серверт үргэлж нуугдсан (hydration зөрөхгүй), клиент дээр localStorage-оос.
  const hidden = useSyncExternalStore(
    subscribeQuickStart,
    () => getQuickStartCompleted(),
    () => true
  );
  const [open, setOpen] = useState(false);

  // Нэвтэрсэн + явцтай бол онбординг хэрэггүй.
  if (hidden || (loggedIn && hasProgress)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bs-tm-continue w-full text-left"
        style={{ borderColor: "#fde68a", background: "linear-gradient(135deg, #fffbeb, #fef3c7)" }}
      >
        <span
          className="bs-tm-continue-ic"
          style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}
          aria-hidden
        >
          ⚡
        </span>
        <span className="min-w-0 flex-1">
          <p className="bs-tm-continue-kicker">{tr(locale, "60 секунд")}</p>
          <p className="bs-tm-continue-title">{tr(locale, "1 минутад 5 үг сур")}</p>
        </span>
        <span className="bs-tm-card-chev" aria-hidden>
          ›
        </span>
      </button>
      {open ? (
        <QuickStartSheet
          loggedIn={loggedIn}
          onClose={() => setOpen(false)}
          onDone={() => {
            setQuickStartCompleted(true);
            window.dispatchEvent(new Event(QUICK_START_EVENT));
          }}
        />
      ) : null}
    </>
  );
}

function QuickStartSheet({
  loggedIn,
  onClose,
  onDone,
}: {
  loggedIn: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const locale = useUiLocale();
  const [stage, setStage] = useState<Stage>("words");
  const [wordIdx, setWordIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);

  const questions = useMemo(
    () =>
      WORDS.map((w, i) => ({
        word: w,
        options: shuffle(
          [w.mn, ...WORDS.filter((o) => o.zh !== w.zh).map((o) => o.mn)].slice(0, 4),
          i + 7
        ),
      })),
    []
  );

  // Хуудасны гүйлтийг түгжинэ
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const finish = () => {
    onDone();
    onClose();
  };

  const word = WORDS[wordIdx]!;
  const q = questions[qIdx]!;
  const meaning = (w: QuickWord) => (locale === "zh" ? w.zhGloss : w.mn);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={tr(locale, "1 минутад 5 үг сур")}
    >
      <div className="flex max-h-[92vh] w-full max-w-[460px] flex-col overflow-hidden rounded-t-[26px] bg-white shadow-2xl sm:rounded-[26px]">
        <div className="flex items-center justify-between px-5 pt-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">
            {stage === "words"
              ? `${tr(locale, "Үг")} ${wordIdx + 1}/${WORDS.length}`
              : stage === "quiz"
                ? `${tr(locale, "Сорил")} ${qIdx + 1}/${questions.length}`
                : tr(locale, "Дууслаа")}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100"
            aria-label={tr(locale, "Хаах")}
          >
            ✕
          </button>
        </div>
        <div className="mx-5 mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <i
            className="block h-full rounded-full bg-emerald-500 transition-[width]"
            style={{
              width: `${
                stage === "words"
                  ? ((wordIdx + 1) / (WORDS.length * 2)) * 100
                  : stage === "quiz"
                    ? ((WORDS.length + qIdx + 1) / (WORDS.length * 2)) * 100
                    : 100
              }%`,
            }}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
          {stage === "words" ? (
            <div className="flex flex-col items-center text-center">
              <div className="flex w-full flex-col items-center rounded-[22px] bg-emerald-50 px-4 py-8 ring-1 ring-emerald-100">
                <ToneHanzi word={word.zh} pinyin={word.pinyin} size="xl" />
                <p className="mt-4 text-lg font-extrabold text-[var(--app-text)]">{meaning(word)}</p>
                <div className="mt-3">
                  <SpeakerButton text={word.zh} hskLevel="1" size="md" label={tr(locale, "Сонсох")} />
                </div>
              </div>
              <p className="mt-3 text-xs text-[var(--app-muted)]">
                {tr(locale, "Өнгө нь хөгийг заана: улаан 1, шар 2, ногоон 3, цэнхэр 4.")}
              </p>
              <div className="mt-4 flex w-full gap-2">
                {wordIdx > 0 ? (
                  <button
                    type="button"
                    onClick={() => setWordIdx((i) => i - 1)}
                    className="app-btn-secondary flex-1 justify-center"
                  >
                    ← {tr(locale, "Өмнөх")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    void recordActivity("word_learned");
                    if (wordIdx + 1 < WORDS.length) setWordIdx((i) => i + 1);
                    else setStage("quiz");
                  }}
                  className="app-btn-primary flex-1 justify-center"
                >
                  {wordIdx + 1 < WORDS.length
                    ? `${tr(locale, "Дараах")} →`
                    : `${tr(locale, "Сорил эхлэх")} →`}
                </button>
              </div>
            </div>
          ) : null}

          {stage === "quiz" ? (
            <div className="flex flex-col items-center">
              <p className="text-sm font-semibold text-[var(--app-muted)]">
                {tr(locale, "Энэ үг ямар утгатай вэ?")}
              </p>
              <div className="mt-3">
                <ToneHanzi word={q.word.zh} pinyin={q.word.pinyin} size="xl" />
              </div>
              <div className="mt-5 grid w-full grid-cols-1 gap-2">
                {q.options.map((opt) => {
                  const isRight = opt === q.word.mn;
                  const state =
                    picked == null
                      ? "idle"
                      : isRight
                        ? "right"
                        : opt === picked
                          ? "wrong"
                          : "dim";
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={picked != null}
                      onClick={() => {
                        setPicked(opt);
                        if (isRight) setCorrect((c) => c + 1);
                      }}
                      className={`rounded-[16px] border-2 px-4 py-3 text-left text-[15px] font-bold transition ${
                        state === "right"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : state === "wrong"
                            ? "border-red-400 bg-red-50 text-red-700"
                            : state === "dim"
                              ? "border-slate-100 text-slate-400"
                              : "border-slate-200 bg-white text-[var(--app-text)] active:bg-emerald-50"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {picked != null ? (
                <button
                  type="button"
                  onClick={() => {
                    setPicked(null);
                    if (qIdx + 1 < questions.length) setQIdx((i) => i + 1);
                    else {
                      void recordActivity("quiz_attempt");
                      setStage("done");
                    }
                  }}
                  className="app-btn-primary mt-4 w-full justify-center"
                >
                  {picked === q.word.mn ? `${tr(locale, "Зөв! 🎉")} ` : `${tr(locale, "Буруу байна")} · `}
                  {qIdx + 1 < questions.length ? `${tr(locale, "Дараах")} →` : `${tr(locale, "Дүн харах")} →`}
                </button>
              ) : null}
            </div>
          ) : null}

          {stage === "done" ? (
            <div className="flex flex-col items-center text-center">
              <p className="text-5xl" aria-hidden>
                🎉
              </p>
              <p className="mt-3 text-xl font-black text-[var(--app-text)]">
                {tr(locale, "Чи 5 үг сурлаа!")}
              </p>
              <p className="mt-1 text-sm text-[var(--app-muted)]">
                {tr(locale, "Сорил")}: {correct}/{questions.length}
              </p>
              <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
                {WORDS.map((w) => (
                  <span
                    key={w.zh}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100"
                  >
                    <ToneHanzi word={w.zh} pinyin={w.pinyin} size="sm" showPinyin={false} />
                  </span>
                ))}
              </div>
              {loggedIn ? (
                <Link href="/lessons/1" onClick={finish} className="app-btn-primary mt-6 w-full justify-center">
                  {tr(locale, "Эхний хичээлээ эхлэх")} →
                </Link>
              ) : (
                <Link href="/login" onClick={finish} className="app-btn-primary mt-6 w-full justify-center">
                  {tr(locale, "Бүртгүүлээд үргэлжлүүл")} →
                </Link>
              )}
              <button type="button" onClick={finish} className="mt-2 text-sm font-semibold text-[var(--app-muted)]">
                {tr(locale, "Дараа")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
