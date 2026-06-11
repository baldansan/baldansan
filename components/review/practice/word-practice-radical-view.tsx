"use client";

import { useEffect, useState } from "react";
import { RadicalGameClient } from "@/components/games/radical-game-client";
import type { RadicalGameEntry } from "@/lib/games/radical-game-data";

type Props = {
  wordIds: number[];
  gameKey: number;
  onBackToSummary: () => void;
};

export function WordPracticeRadicalView({
  wordIds,
  gameKey,
  onBackToSummary,
}: Props) {
  const [entries, setEntries] = useState<RadicalGameEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setEntries(null);

    void (async () => {
      try {
        const res = await fetch(
          `/api/review/practice-radical?wordIds=${encodeURIComponent(wordIds.join(","))}`
        );
        const body = (await res.json()) as {
          entries?: RadicalGameEntry[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !body.entries?.length) {
          setError(body.error ?? "Задлах өгөгдөл олдсонгүй.");
          setLoading(false);
          return;
        }
        setEntries(body.entries);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Ачаалахад алдаа гарлаа.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wordIds, gameKey]);

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-[var(--app-muted)]">
        Задлах тоглоом ачааллаж байна…
      </p>
    );
  }

  if (error || !entries?.length) {
    return (
      <div className="bs-srs-done">
        <p className="text-sm text-red-600">
          {error ?? "Эдгээр үгсэд задлах өгөгдөл олдсонгүй."}
        </p>
        <button
          type="button"
          onClick={onBackToSummary}
          className="mt-4 min-h-[44px] w-full rounded-[14px] bg-[#eaf0ed] text-sm font-extrabold text-[#3b473f]"
        >
          Дүгнэлт рүү буцах
        </button>
      </div>
    );
  }

  return (
    <RadicalGameClient
      key={gameKey}
      lessonId="word-practice"
      entries={entries}
      customWordSet
      embedded
      onReturnToSummary={onBackToSummary}
    />
  );
}
