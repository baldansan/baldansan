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
import type { WordSrsQueueItem } from "@/lib/srs/word-srs-types";
import type { HskWordRow } from "@/lib/supabase/hsk-words";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { countStudiedAmongWordIds } from "@/lib/supabase/user-word-srs";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";

type WizardStep = "level" | "batch" | "study";

type BatchSummary = {
  batchIndex: number;
  rangeStart: number;
  rangeEnd: number;
  wordIds: number[];
  firstSimplified: string;
  lastSimplified: string;
  studiedCount: number;
};

function toCatalogLevel(level: ActiveHskLevel): string {
  return level === "7-9" ? "7-9" : String(level);
}

function batchLabel(batch: BatchSummary): string {
  return `Багц ${batch.batchIndex + 1} · ${batch.firstSimplified} → ${batch.lastSimplified}`;
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
        batches?: {
          batchIndex: number;
          rangeStart: number;
          rangeEnd: number;
          wordIds: number[];
          firstSimplified: string;
          lastSimplified: string;
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
      const res = await fetch(
        `/api/review/memorize-batch?level=${encodeURIComponent(toCatalogLevel(level))}&batch=${batch.batchIndex}`
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
    return (
      <div className="bs-mem-wizard">
        <button type="button" onClick={goBack} className="bs-mem-back">
          ← HSK түвшин
        </button>
        <h2 className="bs-mem-step-title">Багц сонгох</h2>
        <p className="bs-mem-step-sub">
          {formatActiveHskLevel(level)} · {totalWords} үг · пиньинь дарааллаар
        </p>
        <ul className="bs-mem-batch-list">
          {batches.map((b) => (
            <li key={b.batchIndex}>
              <button
                type="button"
                className="bs-mem-batch-btn"
                onClick={() => void handleSelectBatch(b)}
              >
                <span className="bs-mem-batch-label">{batchLabel(b)}</span>
                <span className="bs-mem-batch-progress">
                  {b.studiedCount}/{b.wordIds.length} сурсан
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="bs-mem-wizard">
      <h2 className="bs-mem-step-title">HSK түвшин сонгох</h2>
      <p className="bs-mem-step-sub">
        Пиньинь дарааллаар 30-аар багцлан цээжлэнэ
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
