"use client";

/**
 * «Өнөөдөр бичих» — нэгдсэн самбараас эхэлдэг богино дасгал.
 * Сул ханзыг: хар → дагаж → санаж. Сэргээх хугацаа болсон ханзыг: шууд санаж бичнэ
 * (сэргээн санах нь өөрөө ой тогтоолтыг бэхжүүлдэг). Чадаагүй бол дагаж зураад дахин нэг санана.
 * `only` өгвөл зөвхөн тэр ханз(ууд)-ыг бичнэ («Одоо бичих»).
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { ReviewOfferCard } from "@/components/writing/review-offer-card";
import { WritingPad, type WritingPadPhase, type WritingPadResult } from "@/components/writing/writing-pad";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { recordWritingResult } from "@/lib/srs/writing-srs-sync";
import {
  buildHanziDashboard,
  getHanziHistoryMap,
  hanziStage,
  recallSucceeded,
  recordHanziWrite,
  syncHanziHistory,
  type HanziHistory,
} from "@/lib/writing/hanzi-history";
import "@/components/writing/writing.css";

type Task = { ch: string; phase: WritingPadPhase; retry?: boolean };
type Result = { ch: string; mistakes: number; ok: boolean };

const HAN_RE = /\p{Script=Han}/u;
const FEEDBACK_MS = 800;

function tasksFor(h: HanziHistory | null, ch: string): Task[] {
  const stage = h ? hanziStage(h) : "new";
  if (stage === "weak" || stage === "new") {
    return [
      { ch, phase: "watch" },
      { ch, phase: "trace" },
      { ch, phase: "memory" },
    ];
  }
  return [{ ch, phase: "memory" }];
}

export function HanziTodayClient({ only }: { only: string | null }) {
  const locale = useUiLocale();
  const [screen, setScreen] = useState<"loading" | "empty" | "run" | "end">("loading");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ti, setTi] = useState(0);
  const [padKey, setPadKey] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [meta, setMeta] = useState<Record<string, HanziHistory>>({});
  const [offer, setOffer] = useState<string[]>([]);
  const tasksRef = useRef<Task[]>([]);
  const tiRef = useRef(0);
  const sessRef = useRef<Map<string, { mistakes: number; usedHint: boolean; ok: boolean }>>(new Map());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await syncHanziHistory();
      if (!alive) return;
      const map = getHanziHistoryMap();
      const chars = only
        ? [...new Set([...only].filter((c) => HAN_RE.test(c)))]
        : buildHanziDashboard(map).today.map((h) => h.ch);
      if (chars.length === 0) {
        setScreen("empty");
        return;
      }
      const list = chars.flatMap((c) => tasksFor(map[c] ?? null, c));
      tasksRef.current = list;
      tiRef.current = 0;
      setMeta(map);
      setTasks(list);
      setTi(0);
      setScreen("run");
    })();
    return () => {
      alive = false;
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [only]);

  const step = tasks[ti] ?? null;
  const info = step ? meta[step.ch] ?? null : null;

  function finish() {
    const list: Result[] = [];
    for (const [ch, s] of sessRef.current) list.push({ ch, mistakes: s.mistakes, ok: s.ok });
    setResults(list);
    const map = getHanziHistoryMap();
    setOffer(list.filter((r) => !r.ok && !map[r.ch]?.inReview).map((r) => r.ch));
    setMeta(map);
    setScreen("end");
  }

  function advance() {
    const cur = tasksRef.current;
    const at = tiRef.current;
    const ch = cur[at]?.ch;
    // Энэ ханзны сүүлийн даалгавар дууссан бол давталтын хуваарийг шинэчилнэ
    // (зөвхөн сурагч өөрөө давталтад нэмсэн ханзад).
    if (ch && !cur.slice(at + 1).some((t) => t.ch === ch)) {
      const s = sessRef.current.get(ch);
      const h = getHanziHistoryMap()[ch];
      if (s && h?.inReview) {
        recordWritingResult(
          { key: ch, pinyin: h.pinyin, meaning: h.meaning },
          { mistakes: s.mistakes, usedHint: s.usedHint }
        );
      }
    }
    if (at < cur.length - 1) {
      tiRef.current = at + 1;
      setTi(at + 1);
      setPadKey((k) => k + 1);
    } else finish();
  }

  function handleDone(result: WritingPadResult) {
    if (!step || step.phase === "watch") return;
    const ch = step.ch;
    const isMemory = step.phase === "memory";
    const ok = isMemory ? recallSucceeded(result) : true;
    recordHanziWrite({
      ch,
      source: "book",
      mistakes: result.mistakes,
      recalled: isMemory ? ok : null,
      pinyin: info?.pinyin ?? null,
      meaning: info?.meaning ?? null,
    });
    const prev = sessRef.current.get(ch) ?? { mistakes: 0, usedHint: false, ok: true };
    let requeued = false;
    if (isMemory) {
      sessRef.current.set(ch, {
        mistakes: prev.mistakes + result.mistakes,
        usedHint: prev.usedHint || result.usedHint,
        ok,
      });
      if (!ok && !step.retry) {
        const next = [...tasksRef.current];
        next.splice(tiRef.current + 1, 0, { ch, phase: "trace", retry: true }, { ch, phase: "memory", retry: true });
        tasksRef.current = next;
        setTasks(next);
        requeued = true;
      }
    } else if (!sessRef.current.has(ch)) {
      sessRef.current.set(ch, prev);
    }
    setFeedback(
      requeued
        ? `🔁 ${tr(locale, "Дахиад нэг харъя")}`
        : result.mistakes === 0
          ? `✓ ${tr(locale, "Зөв бичлээ")}`
          : `👍 ${tr(locale, "Болсон")} · ${result.mistakes} ${tr(locale, "алдаа")}`
    );
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setFeedback(null);
      advance();
    }, FEEDBACK_MS);
  }

  const back = (
    <Link href="/writing" className="mb-3 inline-flex items-center text-sm font-medium text-[var(--app-muted)]">
      {tr(locale, "← Дэвтэр рүү")}
    </Link>
  );

  if (screen === "loading") {
    return (
      <MobileAppShell activeTab="study">
        {back}
        <p className="py-12 text-center text-sm text-[var(--app-muted)]">{tr(locale, "Ачааллаж байна…")}</p>
      </MobileAppShell>
    );
  }

  if (screen === "empty") {
    return (
      <MobileAppShell activeTab="study">
        {back}
        <MobileCard padding="lg" className="text-center">
          <p className="text-3xl" aria-hidden>
            ✅
          </p>
          <p className="mt-2 text-base font-bold text-[var(--app-text)]">
            {tr(locale, "Өнөөдөр сэргээх ханз алга")}
          </p>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            {tr(locale, "Шинэ ханз бичвэл сэргээх өдөр нь болоход энд гарч ирнэ.")}
          </p>
          <Link href="/writing" className="app-btn-primary mt-4 inline-flex w-full justify-center">
            {tr(locale, "Ханзны дэвтэр рүү")} →
          </Link>
        </MobileCard>
      </MobileAppShell>
    );
  }

  if (screen === "end") {
    const okCount = results.filter((r) => r.ok).length;
    const metaByCh: Record<string, { pinyin?: string | null; meaning?: string | null }> = {};
    for (const c of offer) metaByCh[c] = { pinyin: meta[c]?.pinyin ?? null, meaning: meta[c]?.meaning ?? null };
    return (
      <MobileAppShell activeTab="study">
        {back}
        <MobileCard padding="lg" className="mb-4 text-center">
          <p className="text-3xl" aria-hidden>
            {okCount === results.length ? "🏆" : "🎉"}
          </p>
          <p className="mt-2 text-lg font-bold text-[var(--app-text)]">
            {results.length} {tr(locale, "ханз бичлээ")}
          </p>
          <p className="text-sm text-[var(--app-muted)]">
            {okCount} {tr(locale, "ханзыг санаж зөв бичлээ")}
            {results.length - okCount > 0
              ? ` · ${results.length - okCount} ${tr(locale, "ханз хараахан тогтоогүй")}`
              : ""}
          </p>
        </MobileCard>
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {results.map((r) => (
            <span key={r.ch} translate="no" className={`wn-hd-chip ${r.ok ? "is-learned" : "is-weak"}`}>
              <i>{r.ch}</i>
              <small>{r.ok ? "✓" : tr(locale, "дахин")}</small>
            </span>
          ))}
        </div>
        <ReviewOfferCard chars={offer} metaByCh={metaByCh} />
        <Link href="/writing" className="app-btn-primary mb-6 inline-flex w-full justify-center">
          {tr(locale, "Ханзны дэвтэр рүү")} →
        </Link>
      </MobileAppShell>
    );
  }

  if (!step) return null;
  const chars = [...new Set(tasks.map((t) => t.ch))];
  const charNo = chars.indexOf(step.ch) + 1;
  const phaseLabel =
    step.phase === "watch"
      ? `👀 ${tr(locale, "Хар")}`
      : step.phase === "trace"
        ? `✍️ ${tr(locale, "Дагаж зур")}`
        : `🧠 ${tr(locale, "Санаж бич")}`;

  return (
    <MobileAppShell activeTab="study">
      <div className="mb-2 flex items-center gap-3">
        <Link href="/writing" className="inline-flex items-center text-sm font-medium text-[var(--app-muted)]">
          {tr(locale, "← Дэвтэр рүү")}
        </Link>
        <span className="text-sm font-bold text-[var(--app-text)]">
          {charNo}/{chars.length} {tr(locale, "ханз")}
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[var(--app-border)]">
        <div
          className="h-full rounded-full bg-[var(--app-primary)]"
          style={{ width: `${Math.round((ti / tasks.length) * 100)}%` }}
        />
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--app-primary)]">{phaseLabel}</p>
          <p className="truncate text-base font-bold text-[var(--app-text)]">
            {step.phase === "memory" ? null : (
              <span className="mr-2 text-2xl" translate="no">
                {step.ch}
              </span>
            )}
            <span translate="no">{info?.pinyin ?? ""}</span>
            {info?.meaning ? <span className="ml-2 font-semibold">{info.meaning}</span> : null}
          </p>
        </div>
        <SpeakerButton text={step.ch} />
      </div>

      <WritingPad key={padKey} char={step.ch} phase={step.phase} onDone={handleDone} maxSize={340} />

      <div className="mt-3 min-h-[48px] text-center">
        {feedback ? (
          <p className="text-base font-bold text-[var(--app-primary)]">{feedback}</p>
        ) : step.phase === "watch" ? (
          <button type="button" className="app-btn-primary w-full" onClick={advance}>
            ✍️ {tr(locale, "Дагаж зурах")} →
          </button>
        ) : null}
      </div>
    </MobileAppShell>
  );
}
