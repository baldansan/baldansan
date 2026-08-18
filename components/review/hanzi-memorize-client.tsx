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

type WizardStep = "level" | "batch" | "study";

type BatchSummary = {
  batchIndex: number;
  wordIds: number[];
  studiedCount: number;
  /** Сэдэвчилсэн бүлэг (mode: "themes") */
  groupId?: string;
  title?: string;
  icon?: string;
  /** Пиньинь дарааллын багц (mode: "pinyin" fallback) */
  rangeStart?: number;
  rangeEnd?: number;
  firstSimplified?: string;
  lastSimplified?: string;
};

function toCatalogLevel(level: ActiveHskLevel): string {
  return level === "7-9" ? "7-9" : String(level);
}

function batchLabel(batch: BatchSummary): string {
  if (batch.groupId && batch.title) {
    return `${batch.icon ?? ""} ${batch.title}`.trim();
  }
  return `Багц ${batch.batchIndex + 1} · ${batch.firstSimplified ?? ""} → ${batch.lastSimplified ?? ""}`;
}

/** Зураглалын зангилааны нэр (icon-гүй — icon нь дугуйд орно). */
function nodeTitle(batch: BatchSummary): string {
  if (batch.groupId && batch.title) return batch.title;
  return `Багц ${batch.batchIndex + 1}`;
}

function resumeKeyFor(level: ActiveHskLevel, batch: BatchSummary): string {
  const group = batch.groupId ?? `batch-${batch.batchIndex}`;
  return `memorize:${toCatalogLevel(level)}:${group}`;
}

type Props = {
  restoreLevel?: string;
};

export function HanziMemorizeClient({ restoreLevel }: Props = {}) {
  useActivityTracker("review", "memorize");
  const [step, setStep] = useState<WizardStep>("level");
  const [level, setLevel] = useState<ActiveHskLevel | null>(null);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [batchMode, setBatchMode] = useState<"themes" | "pinyin">("pinyin");
  const [activeBatch, setActiveBatch] = useState<BatchSummary | null>(null);
  const [studyQueue, setStudyQueue] = useState<WordSrsQueueItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoreDone, setRestoreDone] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    void getAuthenticatedUserId().then(({ userId: uid }) => setUserId(uid));
  }, []);

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
        Ачааллаж байна…
      </p>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={goBack}
          className="mt-4 rounded-[14px] bg-[var(--app-primary)] px-5 py-2.5 text-sm font-bold text-white"
        >
          Буцах
        </button>
      </div>
    );
  }

  if (step === "study" && level && activeBatch) {
    const hskLabel = formatActiveHskLevel(level);
    return (
      <>
        <button type="button" onClick={goBack} className="bs-mem-back">
          ← Багцууд руу
        </button>
        <WordSrsStudySession
          queue={studyQueue}
          userId={userId}
          resumeKey={resumeKeyFor(level, activeBatch)}
          title="Ханз цээжлэх"
          subtitle={`${hskLabel} · ${batchLabel(activeBatch)}`}
          hskLevelLabel={hskLabel}
          showLoginHint
          showPracticeLauncher
          onNextBatch={() => {
            const next = batches.find(
              (b) => b.batchIndex === activeBatch.batchIndex + 1
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
          completeTitle="✅ Багц дууслаа!"
          completeMessage={`${batchLabel(activeBatch)} дууслаа.`}
        />
      </>
    );
  }

  if (step === "batch" && level) {
    const hskLabel = formatActiveHskLevel(level);
    const totalStudied = batches.reduce((sum, b) => sum + b.studiedCount, 0);
    const passPercent =
      totalWords > 0
        ? Math.min(100, Math.round((totalStudied / totalWords) * 100))
        : 0;
    const currentIdx = batches.findIndex(
      (b) => b.wordIds.length > 0 && b.studiedCount < b.wordIds.length
    );

    return (
      <div className="bs-mem-wizard">
        <button type="button" onClick={goBack} className="bs-mem-back">
          ← HSK түвшин
        </button>
        <h2 className="bs-mem-step-title">
          {batchMode === "themes" ? "Цээжлэх зам 🗺️" : "Багц сонгох"}
        </h2>
        <p className="bs-mem-step-sub">
          {hskLabel} · {totalWords} үг ·{" "}
          {batchMode === "themes" ? "сэдвээр бүлэглэсэн" : "пиньинь дарааллаар"}
        </p>

        <div className="bs-mem-pass-card">
          <div className="bs-mem-pass-top">
            <span>🎯 {hskLabel} давах бэлтгэл</span>
            <span className="bs-mem-pass-pct">{passPercent}%</span>
          </div>
          <div className="bs-mem-pass-bar">
            <span style={{ width: `${passPercent}%` }} />
          </div>
          <p className="bs-mem-pass-hint">
            {totalStudied}/{totalWords} үг үзсэн — үг бүр таны хувийг өсгөнө!
          </p>
        </div>

        <ol className="bs-mem-map">
          {batches.map((b, i) => {
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
                      {canResume ? "▶ Үргэлжлүүлэх" : "Та энд байна"}
                    </span>
                  ) : null}
                  <span
                    className="bs-mem-map-ring"
                    style={{
                      background: `conic-gradient(#10b981 ${pct}%, #e2e8f0 0)`,
                    }}
                  >
                    <span className="bs-mem-map-circle" aria-hidden>
                      {isDone ? "⭐" : (b.icon ?? "📦")}
                    </span>
                  </span>
                  <span className="bs-mem-map-title">{nodeTitle(b)}</span>
                  <span className="bs-mem-map-count">
                    {b.studiedCount}/{total} үзсэн
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
      <h2 className="bs-mem-step-title">HSK түвшин сонгох</h2>
      <p className="bs-mem-step-sub">
        Үгсийг сэдэвчилсэн бүлгээр цээжлэнэ
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
