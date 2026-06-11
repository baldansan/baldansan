"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GameWordSourcePicker } from "@/components/games/game-word-source-picker";
import { RadicalGameShellClient } from "@/components/games/radical-game-shell-client";
import { GameShell } from "@/components/games/game-shell";
import type { RadicalGameEntry } from "@/lib/games/radical-game-data";
import {
  buildGameWordPool,
  defaultGameWordSource,
  type GameWordSource,
} from "@/lib/games/game-word-pool";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";

type Props = {
  lessonId: string;
  defaultEntries: RadicalGameEntry[];
  returnHref?: string;
  initialChallenge?: boolean;
  initialWordIds?: number[];
};

export function RadicalGamePageClient({
  lessonId,
  defaultEntries,
  returnHref,
  initialChallenge = false,
  initialWordIds = [],
}: Props) {
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wordSource, setWordSource] = useState<GameWordSource>("catalog");
  const [poolNote, setPoolNote] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [entries, setEntries] = useState<RadicalGameEntry[] | null>(
    initialWordIds.length > 0 ? null : defaultEntries
  );
  const [customWordSet, setCustomWordSet] = useState(initialWordIds.length > 0);
  const [ready, setReady] = useState(initialWordIds.length > 0);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    void getAuthenticatedUserId().then(({ userId }) => {
      const loggedIn = Boolean(userId);
      setIsLoggedIn(loggedIn);
      setWordSource(defaultGameWordSource(loggedIn));
    });
  }, []);

  const loadEntries = useCallback(
    async (wordIds: number[]) => {
      const res = await fetch(
        `/api/review/practice-radical?wordIds=${encodeURIComponent(wordIds.join(","))}`
      );
      const body = (await res.json()) as {
        entries?: RadicalGameEntry[];
        error?: string;
      };
      if (!res.ok || !body.entries?.length) {
        throw new Error(body.error ?? "Задлах өгөгдөл олдсонгүй.");
      }
      return body.entries;
    },
    []
  );

  useEffect(() => {
    if (!ready || !initialWordIds.length || entries) return;
    let cancelled = false;
    void loadEntries(initialWordIds)
      .then((loaded) => {
        if (!cancelled) {
          setEntries(loaded);
          setCustomWordSet(true);
        }
      })
      .catch(() => {
        if (!cancelled) setEntries(defaultEntries);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, initialWordIds, entries, loadEntries, defaultEntries]);

  const confirmSource = useCallback(async () => {
    if (!hydrated) return;
    setSourceLoading(true);
    try {
      const pool = await buildGameWordPool(wordSource, activeLevel);
      setPoolNote(pool.note);
      const loaded = await loadEntries(pool.wordIds);
      setEntries(loaded);
      setCustomWordSet(true);
      setReady(true);
    } catch {
      setEntries(defaultEntries);
      setCustomWordSet(false);
      setReady(true);
    } finally {
      setSourceLoading(false);
    }
  }, [wordSource, activeLevel, hydrated, loadEntries, defaultEntries]);

  const skipToDefault = useCallback(() => {
    setEntries(defaultEntries);
    setCustomWordSet(false);
    setReady(true);
  }, [defaultEntries]);

  if (!ready) {
    return (
      <GameShell mainClassName="mx-auto w-full max-w-[430px] lg:max-w-none px-4 pb-8">
        <div className="bs-mock-setup">
          <h1 className="bs-mock-title">Ханз задлах</h1>
          <p className="bs-mock-sub">Ямар үгсийн ханзыг задлах вэ?</p>
          <GameWordSourcePicker
            value={wordSource}
            onChange={setWordSource}
            isLoggedIn={isLoggedIn}
            poolNote={poolNote}
          />
          <button
            type="button"
            className="bs-mock-primary-btn mt-5"
            disabled={sourceLoading}
            onClick={() => void confirmSource()}
          >
            {sourceLoading ? "Бэлдэж байна…" : "Эхлэх →"}
          </button>
          <button
            type="button"
            className="bs-meaning-link mt-3 block w-full text-center"
            onClick={skipToDefault}
          >
            Жишээ ханзаар тоглох
          </button>
          <Link href="/games" className="bs-meaning-link mt-3 block text-center">
            ← Тоглоом руу
          </Link>
        </div>
      </GameShell>
    );
  }

  if (!entries) {
    return (
      <GameShell mainClassName="mx-auto w-full max-w-[430px] lg:max-w-none px-4 py-12 text-center text-sm text-[var(--app-muted)]">
        Ачааллаж байна…
      </GameShell>
    );
  }

  return (
    <RadicalGameShellClient
      lessonId={lessonId}
      entries={entries}
      returnHref={returnHref}
      customWordSet={customWordSet}
      initialChallenge={initialChallenge}
    />
  );
}
