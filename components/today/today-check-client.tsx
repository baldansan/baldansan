"use client";

/**
 * Цээжилснээ шалгах: өнөөдрийн (орой) эсвэл өчигдрийн хичээлийн үгсээс 10 хүртэл асуулт.
 * Монгол утгыг хараад зөв ханзыг сонгоно. Хариулмагц өөрөө дараагийн асуулт руу шилжинэ.
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { markPrevLessonChecked, markTodayStepDone } from "@/lib/today/today-path";

type Word = { zh: string; pinyin: string; mn: string };
type Question = { word: Word; options: Word[] };

const MAX_QUESTIONS = 10;
const ADVANCE_MS = 1100;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function buildQuestions(words: Word[]): Question[] {
  return shuffle(words)
    .slice(0, MAX_QUESTIONS)
    .map((word) => {
      const others = shuffle(words.filter((w) => w.zh !== word.zh && w.mn !== word.mn)).slice(0, 3);
      return { word, options: shuffle([word, ...others]) };
    });
}

export function TodayCheckClient() {
  const locale = useUiLocale();
  const params = useSearchParams();
  const lessonId = params.get("lesson") ?? "";
  const isPrev = params.get("when") === "prev";

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [missed, setMissed] = useState<Word[]>([]);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(`/api/today/lesson-check?lessonId=${encodeURIComponent(lessonId)}`);
        const json = (await res.json()) as { title?: string; words?: Word[] };
        if (!alive) return;
        const words = json.words ?? [];
        if (words.length < 2) {
          setError(tr(locale, "Энэ хичээлд шалгах үг олдсонгүй."));
          return;
        }
        setTitle(json.title ?? "");
        setQuestions(buildQuestions(words));
      } catch {
        if (alive) setError(tr(locale, "Сүлжээний алдаа. Дахин оролдоно уу."));
      }
    })();
    return () => {
      alive = false;
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [lessonId, locale]);

  const question = questions?.[qi] ?? null;
  const total = questions?.length ?? 0;
  const correctCount = useMemo(() => total - missed.length, [total, missed.length]);

  function finish() {
    setFinished(true);
    if (isPrev) markPrevLessonChecked();
    else markTodayStepDone("check");
  }

  function pick(option: Word) {
    if (!question || picked) return;
    setPicked(option.zh);
    if (option.zh !== question.word.zh) setMissed((prev) => [...prev, question.word]);
    timerRef.current = window.setTimeout(() => {
      setPicked(null);
      if (qi < total - 1) setQi(qi + 1);
      else finish();
    }, ADVANCE_MS);
  }

  function retryMissed() {
    if (missed.length === 0 || !questions) return;
    const pool = questions.map((q) => q.word);
    setQuestions(
      shuffle(missed).map((word) => ({
        word,
        options: shuffle([word, ...shuffle(pool.filter((w) => w.zh !== word.zh && w.mn !== word.mn)).slice(0, 3)]),
      }))
    );
    setMissed([]);
    setQi(0);
    setFinished(false);
  }

  const shell = (children: React.ReactNode) => (
    <MobileAppShell activeTab="home" showBottomNav={false}>
      <div className="mb-3">
        <Link href="/home" className="text-sm font-medium text-[var(--app-muted)]">
          {tr(locale, "← Нүүр")}
        </Link>
      </div>
      {children}
    </MobileAppShell>
  );

  if (error) {
    return shell(
      <MobileCard padding="lg">
        <p className="text-sm text-[var(--app-text)]">{error}</p>
        <Link href="/home" className="app-btn-primary mt-3 inline-flex">
          {tr(locale, "Нүүр рүү")}
        </Link>
      </MobileCard>
    );
  }

  if (!questions) {
    return shell(
      <MobileCard>
        <p className="text-sm text-[var(--app-muted)]">{tr(locale, "Ачааллаж байна…")}</p>
      </MobileCard>
    );
  }

  if (finished) {
    const perfect = missed.length === 0;
    return shell(
      <div className="pb-8">
        <MobileCard padding="lg" className="mb-4 text-center">
          <p className="text-4xl">{perfect ? "🏆" : "💪"}</p>
          <p className="mt-2 text-2xl font-black text-[var(--app-text)]">
            {correctCount}/{total}
          </p>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            {perfect
              ? tr(locale, "Бүгдийг санаж байна. Маш сайн!")
              : tr(locale, "Доорх үгсээ дахин нэг хараарай.")}
          </p>
        </MobileCard>

        {missed.length > 0 ? (
          <MobileCard padding="sm" className="mb-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
              {tr(locale, "Мартсан үгс")}
            </p>
            <ul className="divide-y divide-slate-100">
              {missed.map((w) => (
                <li key={w.zh} className="flex items-baseline gap-3 py-2">
                  <span className="text-2xl font-semibold text-[var(--app-text)]" translate="no">
                    {w.zh}
                  </span>
                  <span className="text-xs text-[var(--app-muted)]" translate="no">
                    {w.pinyin}
                  </span>
                  <span className="ml-auto text-sm text-[var(--app-text)]">{w.mn}</span>
                </li>
              ))}
            </ul>
          </MobileCard>
        ) : null}

        <div className="flex flex-col gap-2">
          {missed.length > 0 ? (
            <button type="button" onClick={retryMissed} className="app-btn-primary w-full">
              🔁 {tr(locale, "Мартсан үгсээ дахин шалгах")}
            </button>
          ) : null}
          <Link
            href="/home"
            className={
              missed.length > 0
                ? "w-full rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                : "app-btn-primary w-full text-center"
            }
          >
            {tr(locale, "Нүүр рүү")}
          </Link>
        </div>
      </div>
    );
  }

  if (!question) return shell(null);

  return shell(
    <div className="pb-8">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
        {isPrev ? tr(locale, "Өчигдрийнхөө цээжилснийг шалга") : tr(locale, "Оройн шалгалт")}
        {title ? <span translate="no"> · {title}</span> : null}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${Math.round((qi / total) * 100)}%` }}
        />
      </div>
      <p className="mt-1 text-right text-xs font-semibold text-[var(--app-muted)]">
        {qi + 1}/{total}
      </p>

      <MobileCard padding="lg" className="my-4 text-center">
        <p className="text-xs font-semibold text-[var(--app-muted)]">{tr(locale, "Аль нь вэ?")}</p>
        <p className="mt-1 text-xl font-bold leading-snug text-[var(--app-text)]">{question.word.mn}</p>
        {picked ? (
          <p className="mt-2 text-sm font-semibold text-emerald-700" translate="no">
            {question.word.zh} · {question.word.pinyin}
          </p>
        ) : null}
      </MobileCard>

      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option) => {
          const isAnswer = option.zh === question.word.zh;
          const isPicked = picked === option.zh;
          const tone = !picked
            ? "bg-white text-slate-900 ring-1 ring-slate-200"
            : isAnswer
              ? "bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500"
              : isPicked
                ? "bg-rose-100 text-rose-900 ring-2 ring-rose-400"
                : "bg-white text-slate-400 ring-1 ring-slate-200";
          return (
            <button
              key={option.zh}
              type="button"
              disabled={Boolean(picked)}
              onClick={() => pick(option)}
              className={`min-h-[84px] rounded-2xl px-2 py-4 text-3xl font-semibold transition-transform active:scale-95 ${tone}`}
              translate="no"
            >
              {option.zh}
            </button>
          );
        })}
      </div>
    </div>
  );
}
