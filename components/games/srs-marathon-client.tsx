"use client";

import { useCallback, useEffect, useState } from "react";
import { HskQuizGameClient } from "@/components/games/hsk-quiz-game-client";
import { GameShell } from "@/components/games/game-shell";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import {
  buildGameWordPool,
  defaultGameWordSource,
} from "@/lib/games/game-word-pool";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";

export function SrsMarathonClient() {
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [wordIds, setWordIds] = useState<string | null>(null);
  const [poolNote, setPoolNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWordIds = useCallback(async () => {
    if (!hydrated) return;
    setLoading(true);

    let source = defaultGameWordSource(false);
    if (hasSupabaseConfig) {
      const { userId } = await getAuthenticatedUserId();
      source = defaultGameWordSource(Boolean(userId));
    }

    const pool = await buildGameWordPool(source, activeLevel);
    setPoolNote(pool.note);
    setWordIds(pool.wordIds.length >= 4 ? pool.wordIds.join(",") : "");
    setLoading(false);
  }, [activeLevel, hydrated]);

  useEffect(() => {
    void loadWordIds();
  }, [loadWordIds]);

  if (!hydrated || loading) {
    return (
      <GameShell mainClassName="mx-auto w-full max-w-[430px] lg:max-w-none px-4 py-12 text-center text-sm text-[var(--app-muted)]">
        SRS үгс ачааллаж байна…
      </GameShell>
    );
  }

  if (!wordIds) {
    return (
      <GameShell mainClassName="mx-auto w-full max-w-[430px] lg:max-w-none px-4 py-12 text-center text-sm text-red-600">
        Давталтын үг олдсонгүй. Эхлээд Давтах хэсэгт орно уу.
      </GameShell>
    );
  }

  return (
    <>
      {poolNote ? (
        <p className="mx-auto mb-2 max-w-[430px] px-4 text-center text-xs font-semibold text-amber-700">
          {poolNote}
        </p>
      ) : null}
      <HskQuizGameClient
        config={{
          title: "SRS марафон",
          deckPath: "/api/games/srs-marathon-deck",
          gameType: "srs-marathon",
          extraQuery: `wordIds=${encodeURIComponent(wordIds)}`,
          questionSeconds: 12,
        }}
      />
    </>
  );
}
