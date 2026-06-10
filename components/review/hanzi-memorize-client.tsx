"use client";

import { useCallback, useEffect, useState } from "react";
import { WordSrsStudySession } from "@/components/review/word-srs-study-session";
import {
  formatActiveHskLevel,
  HSK_LEVEL_OPTIONS,
  type ActiveHskLevel,
} from "@/lib/hsk/active-hsk-level";
import {
  getCategoryLabelMn,
  type PosCategoryId,
} from "@/lib/hsk/pos-catalog";
import { countLocalStudiedAmong } from "@/lib/srs/local-word-srs";
import type { WordSrsQueueItem } from "@/lib/srs/word-srs-types";
import type { HskWordRow } from "@/lib/supabase/hsk-words";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { countStudiedAmongWordIds } from "@/lib/supabase/user-word-srs";

type WizardStep = "level" | "pos" | "batch" | "study";

type CategoryMeta = {
  id: PosCategoryId;
  labelMn: string;
  count: number;
};

type BatchSummary = {
  batchIndex: number;
  rangeStart: number;
  rangeEnd: number;
  wordIds: number[];
  studiedCount: number;
};

function toCatalogLevel(level: ActiveHskLevel): string {
  return level === "7-9" ? "7-9" : String(level);
}

export function HanziMemorizeClient() {
  const [step, setStep] = useState<WizardStep>("level");
  const [level, setLevel] = useState<ActiveHskLevel | null>(null);
  const [category, setCategory] = useState<PosCategoryId | null>(null);
  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [activeBatch, setActiveBatch] = useState<BatchSummary | null>(null);
  const [studyQueue, setStudyQueue] = useState<WordSrsQueueItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSelectLevel(next: ActiveHskLevel) {
    setLevel(next);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/review/memorize-meta?level=${encodeURIComponent(toCatalogLevel(next))}`
      );
      const json = (await res.json()) as {
        categories?: CategoryMeta[];
        totalWords?: number;
        error?: string;
      };
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "POS ачаалахад алдаа");
      }
      setCategories(json.categories ?? []);
      setTotalWords(json.totalWords ?? 0);
      setStep("pos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ачаалахад алдаа");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectCategory(next: PosCategoryId) {
    if (!level) return;
    setCategory(next);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/review/memorize-batches?level=${encodeURIComponent(toCatalogLevel(level))}&category=${encodeURIComponent(next)}`
      );
      const json = (await res.json()) as {
        batches?: {
          batchIndex: number;
          rangeStart: number;
          rangeEnd: number;
          wordIds: number[];
        }[];
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
      setStep("batch");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ачаалахад алдаа");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectBatch(batch: BatchSummary) {
    if (!level || !category) return;
    setActiveBatch(batch);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/review/memorize-batch?level=${encodeURIComponent(toCatalogLevel(level))}&category=${encodeURIComponent(category)}&batch=${batch.batchIndex}`
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
      if (level && category) {
        void handleSelectCategory(category);
      }
      return;
    }
    if (step === "batch") {
      setStep("pos");
      setCategory(null);
      setBatches([]);
      return;
    }
    if (step === "pos") {
      setStep("level");
      setLevel(null);
      setCategories([]);
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

  if (step === "study" && level && category && activeBatch) {
    const hskLabel = formatActiveHskLevel(level);
    const posLabel = getCategoryLabelMn(category);
    return (
      <>
        <button
          type="button"
          onClick={goBack}
          className="bs-mem-back"
        >
          ← Багцууд руу
        </button>
        <WordSrsStudySession
          queue={studyQueue}
          userId={userId}
          title="Ханз цээжлэх"
          subtitle={`${hskLabel} · ${posLabel} · Багц ${activeBatch.batchIndex + 1}`}
          hskLevelLabel={hskLabel}
          showLoginHint
          onRestart={goBack}
          onSessionComplete={goBack}
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
          completeMessage={`${activeBatch.rangeStart}–${activeBatch.rangeEnd} багцын карт дууслаа.`}
        />
      </>
    );
  }

  if (step === "batch" && level && category) {
    return (
      <div className="bs-mem-wizard">
        <button type="button" onClick={goBack} className="bs-mem-back">
          ← POS сонгох
        </button>
        <h2 className="bs-mem-step-title">Багц сонгох</h2>
        <p className="bs-mem-step-sub">
          {formatActiveHskLevel(level)} · {getCategoryLabelMn(category)}
        </p>
        <ul className="bs-mem-batch-list">
          {batches.map((b) => (
            <li key={b.batchIndex}>
              <button
                type="button"
                className="bs-mem-batch-btn"
                onClick={() => void handleSelectBatch(b)}
              >
                <span className="bs-mem-batch-label">
                  Багц {b.batchIndex + 1} ({b.rangeStart}–{b.rangeEnd})
                </span>
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

  if (step === "pos" && level) {
    return (
      <div className="bs-mem-wizard">
        <button type="button" onClick={goBack} className="bs-mem-back">
          ← HSK түвшин
        </button>
        <h2 className="bs-mem-step-title">Ярианы хэсэг (POS)</h2>
        <p className="bs-mem-step-sub">{formatActiveHskLevel(level)}</p>
        <div className="bs-mem-chip-grid">
          <button
            type="button"
            className="bs-mem-chip"
            onClick={() => void handleSelectCategory("all")}
          >
            Бүгд <span className="bs-mem-chip-count">({totalWords})</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className="bs-mem-chip"
              onClick={() => void handleSelectCategory(cat.id)}
            >
              {cat.labelMn}{" "}
              <span className="bs-mem-chip-count">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bs-mem-wizard">
      <h2 className="bs-mem-step-title">HSK түвшин сонгох</h2>
      <p className="bs-mem-step-sub">
        Түгээмэл үгээс эхлээд 30-аар багцлан цээжлэнэ
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
