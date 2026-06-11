"use client";

import { useCallback, useEffect, useState } from "react";
import { HskQuizGameClient } from "@/components/games/hsk-quiz-game-client";
import { GameShell } from "@/components/games/game-shell";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { buildLocalQueue } from "@/lib/srs/local-word-srs";
import { fetchHskWordsByLevel } from "@/lib/supabase/hsk-words";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { getDueWordQueue } from "@/lib/supabase/user-word-srs";

export function SrsMarathonClient() {
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [wordIds, setWordIds] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWordIds = useCallback(async () => {
    if (!hydrated) return;
    setLoading(true);

    let ids: number[] = [];

    if (hasSupabaseConfig) {
      const { userId } = await getAuthenticatedUserId();
      if (userId) {
        const { items } = await getDueWordQueue(userId, activeLevel, 15);
        ids = items.map((i) => i.word.id!).filter(Boolean);
      }
    }

    if (ids.length < 4) {
      const { data: words } = await fetchHskWordsByLevel(activeLevel, {
        limit: 120,
      });
      const localQueue = buildLocalQueue(words, activeLevel, 15);
      ids = localQueue.map((i) => i.word.id!).filter(Boolean);
      if (ids.length < 4) {
        ids = (words ?? [])
          .map((w) => w.id)
          .filter((id): id is number => id != null)
          .slice(0, 20);
      }
    }

    setWordIds(ids.length >= 4 ? ids.join(",") : "");
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
    <HskQuizGameClient
      config={{
        title: "SRS марафон",
        deckPath: "/api/games/srs-marathon-deck",
        gameType: "srs-marathon",
        extraQuery: `wordIds=${encodeURIComponent(wordIds)}`,
        questionSeconds: 12,
      }}
    />
  );
}
