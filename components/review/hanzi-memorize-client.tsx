"use client";

import { useCallback, useEffect, useState } from "react";
import { WordSrsStudySession } from "@/components/review/word-srs-study-session";
import {
  formatActiveHskLevel,
  HSK_LEVEL_OPTIONS,
  parseActiveHskLevel,
  type ActiveHskLevel,
} from "@/lib/hsk/active-hsk-level";
import { countLocalStudiedAmong } from "@/lib/srs/local-word-srs";
import { hasSessionResume } from "@/lib/srs/session-resume";
import type { WordSrsQueueItem } from "@/lib/srs/word-srs-types";
import type { HskWordRow } from "@/lib/supabase/hsk-words";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { countStudiedAmongWordIds } from "@/lib/supabase/user-word-srs";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale, type UiLocale } from "@/lib/i18n/ui-locale";

type WizardStep = "level" | "batch" | "study";

type BatchKind = "theme" | "family";

type BatchSummary = {
  batchIndex: number;
  wordIds: number[];
  studiedCount: number;
  /** Сэдэвчилсэн бүлэг (mode: "themes") */
  groupId?: string;
  title?: string;
  icon?: string;
  /** Бүлгийн төрөл (байхгүй бол "theme"). */
  kind?: BatchKind;
  /** Ханзны гэр бүл (kind: "family") */
  char?: string;
  charMn?: string;
  /** Пиньинь дарааллын багц (mode: "pinyin" fallback) */
  rangeStart?: number;
  rangeEnd?: number;
  firstSimplified?: string;
  lastSimplified?: string;
};

/** Сонгосон бүлгийн (/api/review/memorize-batch?group=) толгой мэдээлэл. */
type FamilyHeader = {
  char: string;
  charPinyin?: string;
  charMn?: string;
  known: string[];
};

const MEMORIZE_TAB_KEY = "buunduu-memorize-tab-v1";

function readStoredTab(): BatchKind {
  try {
    const raw = window.localStorage.getItem(MEMORIZE_TAB_KEY);
    return raw === "family" ? "family" : "theme";
  } catch {
    return "theme";
  }
}

function storeTab(tab: BatchKind) {
  try {
    window.localStorage.setItem(MEMORIZE_TAB_KEY, tab);
  } catch {
    // localStorage хаалттай байж болно — үл тоомсорлоно
  }
}

function batchKind(batch: BatchSummary): BatchKind {
  return batch.kind === "family" ? "family" : "theme";
}

function toCatalogLevel(level: ActiveHskLevel): string {
  return level === "7-9" ? "7-9" : String(level);
}

function batchLabel(batch: BatchSummary, locale: UiLocale): string {
  if (batch.groupId && batch.title) {
    return `${batch.icon ?? ""} ${batch.title}`.trim();
  }
  return `${tr(locale, "Багц")} ${batch.batchIndex + 1} · ${batch.firstSimplified ?? ""} → ${batch.lastSimplified ?? ""}`;
}

/** Зураглалын зангилааны нэр (icon-гүй — icon нь дугуйд орно). */
function nodeTitle(batch: BatchSummary, locale: UiLocale): string {
  if (batch.kind === "family" && batch.char) {
    return batch.charMn ? `${batch.char} · ${batch.charMn}` : batch.char;
  }
  if (batch.groupId && batch.title) return batch.title;
  return `${tr(locale, "Багц")} ${batch.batchIndex + 1}`;
}

function resumeKeyFor(level: ActiveHskLevel, batch: BatchSummary): string {
  const group = batch.groupId ?? `batch-${batch.batchIndex}`;
  return `memorize:${toCatalogLevel(level)}:${group}`;
}

type Props = {
  restoreLevel?: string;
};

export function HanziMemorizeClient({ restoreLevel }: Props = {}) {
  const locale = useUiLocale();
  useActivityTracker("review", "memorize");
  const [step, setStep] = useState<WizardStep>("level");
  const [level, setLevel] = useState<ActiveHskLevel | null>(null);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [batchMode, setBatchMode] = useState<"themes" | "pinyin">("pinyin");
  const [activeBatch, setActiveBatch] = useState<BatchSummary | null>(null);
  const [familyHeader, setFamilyHeader] = useState<FamilyHeader | null>(null);
  const [tab, setTab] = useState<BatchKind>("theme");
  const [studyQueue, setStudyQueue] = useState<WordSrsQueueItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoreDone, setRestoreDone] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    void getAuthenticatedUserId().then(({ userId: uid }) => setUserId(uid));
  }, []);

  useEffect(() => {
    setTab(readStoredTab());
  }, []);

  function selectTab(next: BatchKind) {
    setTab(next);
    storeTab(next);
  }

  const countStudied = useCallback(
    async (wordIds: number[]) => {
      if (userId && hasSupabaseConfig) {
        const { count } = await countStudiedAmongWordIds(userId, wordIds);
        return count;
      }
      return countLocalStudiedAmong(wordIds);
    },
    [userId]
  );

  async function loadBatches(next: ActiveHskLevel) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/review/memorize-batches?level=${encodeURIComponent(toCatalogLevel(next))}`
      );
      const json = (await res.json()) as {
        mode?: "themes" | "pinyin";
        batches?: {
          batchIndex: number;
          wordIds: number[];
          groupId?: string;
          title?: string;
          icon?: string;
          kind?: BatchKind;
          char?: string;
          charMn?: string;
          rangeStart?: number;
          rangeEnd?: number;
          firstSimplified?: string;
          lastSimplified?: string;
        }[];
        totalWords?: number;
        error?: string;
      };
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Багц ачаалахад алдаа");
      }
      const raw = json.batches ?? [];
      const withProgress = await Promise.all(
        raw.map(async (b) => ({
          ...b,
          studiedCount: await countStudied(b.wordIds),
        }))
      );
      setBatches(withProgress);
      setTotalWords(json.totalWords ?? 0);
      setBatchMode(json.mode === "themes" ? "themes" : "pinyin");
      setStep("batch");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ачаалахад алдаа");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectLevel(next: ActiveHskLevel) {
    setLevel(next);
    await loadBatches(next);
  }

  useEffect(() => {
    if (restoreDone || !restoreLevel) return;
    const parsed = parseActiveHskLevel(restoreLevel);
    if (!parsed) {
      setRestoreDone(true);
      return;
    }
    setRestoreDone(true);
    setLevel(parsed);
    void loadBatches(parsed);
  }, [restoreDone, restoreLevel]);

  async function handleSelectBatch(batch: BatchSummary) {
    if (!level) return;
    setActiveBatch(batch);
    setLoading(true);
    setError(null);
    try {
      const query = batch.groupId
        ? `group=${encodeURIComponent(batch.groupId)}`
        : `batch=${batch.batchIndex}`;
      const res = await fetch(
        `/api/review/memorize-batch?level=${encodeURIComponent(toCatalogLevel(level))}&${query}`
      );
      const json = (await res.json()) as {
        words?: HskWordRow[];
        kind?: BatchKind;
        char?: string;
        charPinyin?: string;
        charMn?: string;
        known?: string[];
        error?: string;
      };
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Үгс ачаалахад алдаа");
      }
      const items: WordSrsQueueItem[] = (json.words ?? []).map((word) => ({
        word,
        srs: null,
        isNew: true,
      }));
      setStudyQueue(items);
      setFamilyHeader(
        json.kind === "family" && json.char
          ? {
              char: json.char,
              charPinyin: json.charPinyin,
              charMn: json.charMn,
              known: Array.isArray(json.known) ? json.known : [],
            }
          : null
      );
      setStep("study");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ачаалахад алдаа");
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    setError(null);
    if (step === "study") {
      setStep("batch");
      setActiveBatch(null);
      setFamilyHeader(null);
      if (level) {
        void loadBatches(level);
      }
      return;
    }
    if (step === "batch") {
      setStep("level");
      setLevel(null);
      setBatches([]);
      setTotalWords(0);
      setBatchMode("pinyin");
      return;
    }
  }

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-[var(--app-muted)]">
        {tr(locale, "Ачааллаж байна…")}
      </p>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-600">{tr(locale, error)}</p>
        <button
          type="button"
          onClick={goBack}
          className="mt-4 rounded-[14px] bg-[var(--app-primary)] px-5 py-2.5 text-sm font-bold text-white"
        >
          {tr(locale, "Буцах")}
        </button>
      </div>
    );
  }

  if (step === "study" && level && activeBatch) {
    const hskLabel = formatActiveHskLevel(level);
    const activeKind = batchKind(activeBatch);
    return (
      <>
        <button type="button" onClick={goBack} className="bs-mem-back">
          ← {tr(locale, "Багцууд руу")}
        </button>
        {familyHeader ? (
          <div className="bs-mem-family-head" translate="no">
            <div className="bs-mem-family-main">
              <span className="bs-mem-family-char">{familyHeader.char}</span>
              <span className="bs-mem-family-meta">
                {familyHeader.charPinyin ? (
                  <span className="bs-mem-family-py">{familyHeader.charPinyin}</span>
                ) : null}
                {familyHeader.charMn ? (
                  <span className="bs-mem-family-mn">{familyHeader.charMn}</span>
                ) : null}
              </span>
            </div>
            {familyHeader.known.length > 0 ? (
              <div className="bs-mem-family-known">
                <span className="bs-mem-family-known-label">
                  {tr(locale, "Мэдэх үгс:")}
                </span>
                {familyHeader.known.map((w) => (
                  <span key={w} className="bs-mem-family-chip">
                    {w}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <WordSrsStudySession
          queue={studyQueue}
          userId={userId}
          resumeKey={resumeKeyFor(level, activeBatch)}
          title={tr(locale, "Ханз цээжлэх")}
          subtitle={`${hskLabel} · ${batchLabel(activeBatch, locale)}`}
          hskLevelLabel={hskLabel}
          showLoginHint
          showPracticeLauncher
          onNextBatch={() => {
            const next = batches.find(
              (b) =>
                b.batchIndex > activeBatch.batchIndex &&
                batchKind(b) === activeKind
            );
            if (next) {
              void handleSelectBatch(next);
            } else {
              goBack();
            }
          }}
          onRestart={goBack}
          onRated={() => {
            void countStudied(activeBatch.wordIds).then((studiedCount) => {
              setBatches((prev) =>
                prev.map((b) =>
                  b.batchIndex === activeBatch.batchIndex
                    ? { ...b, studiedCount }
                    : b
                )
              );
            });
          }}
          completeTitle={tr(locale, "✅ Багц дууслаа!")}
          completeMessage={`${batchLabel(activeBatch, locale)} ${tr(locale, "дууслаа.")}`}
        />
      </>
    );
  }

  if (step === "batch" && level) {
    const hskLabel = formatActiveHskLevel(level);
    // Давах бэлтгэлийн хувь — зөвхөн сэдвийн бүлгүүд (гэр бүлүүд давхцдаг).
    const themeBatches = batches.filter((b) => batchKind(b) === "theme");
    const familyBatches = batches.filter((b) => batchKind(b) === "family");
    const hasFamilies = batchMode === "themes" && familyBatches.length > 0;
    const showFamilies = hasFamilies && tab === "family";
    const visibleBatches = showFamilies ? familyBatches : themeBatches;
    const totalStudied = themeBatches.reduce(
      (sum, b) => sum + b.studiedCount,
      0
    );
    const passPercent =
      totalWords > 0
        ? Math.min(100, Math.round((totalStudied / totalWords) * 100))
        : 0;
    const currentIdx = visibleBatches.findIndex(
      (b) => b.wordIds.length > 0 && b.studiedCount < b.wordIds.length
    );

    return (
      <div className="bs-mem-wizard">
        <button type="button" onClick={goBack} className="bs-mem-back">
          ← {tr(locale, "HSK түвшин")}
        </button>
        <h2 className="bs-mem-step-title">
          {batchMode === "themes"
            ? tr(locale, "Цээжлэх зам 🗺️")
            : tr(locale, "Багц сонгох")}
        </h2>
        <p className="bs-mem-step-sub">
          {hskLabel} · {totalWords} {tr(locale, "үг")} ·{" "}
          {batchMode === "themes"
            ? tr(locale, "сэдвээр бүлэглэсэн")
            : tr(locale, "пиньинь дарааллаар")}
        </p>

        {hasFamilies ? (
          <>
            <div className="bs-mem-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={!showFamilies}
                className={`bs-mem-tab ${!showFamilies ? "bs-mem-tab--active" : ""}`}
                onClick={() => selectTab("theme")}
              >
                {tr(locale, "Сэдвээр")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={showFamilies}
                className={`bs-mem-tab ${showFamilies ? "bs-mem-tab--active" : ""}`}
                onClick={() => selectTab("family")}
              >
                🧬 {tr(locale, "Ханзны гэр бүл")}
              </button>
            </div>
            {showFamilies ? (
              <p className="bs-mem-step-sub">
                {tr(
                  locale,
                  "Нэг ханз мэдвэл 5–12 үг бэлэн — ханзаар нь бүлэглэсэн"
                )}
              </p>
            ) : null}
          </>
        ) : null}

        <div className="bs-mem-pass-card">
          <div className="bs-mem-pass-top">
            <span>🎯 {hskLabel} {tr(locale, "давах бэлтгэл")}</span>
            <span className="bs-mem-pass-pct">{passPercent}%</span>
          </div>
          <div className="bs-mem-pass-bar">
            <span style={{ width: `${passPercent}%` }} />
          </div>
          <p className="bs-mem-pass-hint">
            {totalStudied}/{totalWords}{" "}
            {tr(locale, "үг үзсэн — үг бүр таны хувийг өсгөнө!")}
          </p>
        </div>

        <ol className="bs-mem-map">
          {visibleBatches.map((b, i) => {
            const total = b.wordIds.length;
            const isDone = total > 0 && b.studiedCount >= total;
            const isCurrent = i === currentIdx;
            const isStarted = b.studiedCount > 0 && !isDone;
            const canResume = hasSessionResume(resumeKeyFor(level, b));
            const pct =
              total > 0 ? Math.round((b.studiedCount / total) * 100) : 0;
            const state = isDone
              ? "done"
              : isCurrent
                ? "current"
                : isStarted
                  ? "started"
                  : "todo";
            return (
              <li
                key={b.groupId ?? b.batchIndex}
                className={`bs-mem-map-node bs-mem-map-${state}`}
                data-pos={i % 4}
              >
                <button
                  type="button"
                  className="bs-mem-map-btn"
                  onClick={() => void handleSelectBatch(b)}
                >
                  {isCurrent ? (
                    <span className="bs-mem-map-here">
                      {canResume
                        ? `▶ ${tr(locale, "Үргэлжлүүлэх")}`
                        : tr(locale, "Та энд байна")}
                    </span>
                  ) : null}
                  <span
                    className="bs-mem-map-ring"
                    style={{
                      background: `conic-gradient(#10b981 ${pct}%, #e2e8f0 0)`,
                    }}
                  >
                    {b.kind === "family" && b.char && !isDone ? (
                      <span
                        className="bs-mem-map-circle bs-mem-map-circle--char"
                        aria-hidden
                        translate="no"
                      >
                        {b.char}
                      </span>
                    ) : (
                      <span className="bs-mem-map-circle" aria-hidden>
                        {isDone ? "⭐" : (b.icon ?? "📦")}
                      </span>
                    )}
                  </span>
                  <span className="bs-mem-map-title" translate="no">{nodeTitle(b, locale)}</span>
                  <span className="bs-mem-map-count">
                    {b.studiedCount}/{total} {tr(locale, "үзсэн")}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div className="bs-mem-wizard">
      <h2 className="bs-mem-step-title">{tr(locale, "HSK түвшин сонгох")}</h2>
      <p className="bs-mem-step-sub">
        {tr(locale, "Үгсийг сэдэвчилсэн бүлгээр цээжлэнэ")}
      </p>
      <div className="bs-mem-chip-grid">
        {HSK_LEVEL_OPTIONS.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            className="bs-mem-chip bs-mem-chip-level"
            onClick={() => void handleSelectLevel(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
