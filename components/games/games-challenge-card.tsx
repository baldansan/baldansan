"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { fetchChallengeStatus, type ChallengeStatus } from "@/lib/social/challenges";
import { listLevelRooms, listMyRooms } from "@/lib/social/rooms";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";

/**
 * Группийн 7 хоногийн сорилт — чат руу ордоггүй хүнд ч Тоглоом хэсэгт харагдана.
 * Өөрийн түвшний чат, дараа нь гишүүн өрөөнүүдээс идэвхтэй сорилтыг хайна.
 */
export function GamesChallengeCard() {
  const { level, hydrated } = useActiveHskLevel();
  const [found, setFound] = useState<{ roomId: string; status: ChallengeStatus } | null>(null);

  useEffect(() => {
    if (!hydrated || !hasSupabaseConfig) return;
    let alive = true;
    void (async () => {
      const { userId } = await getAuthenticatedUserId();
      if (!userId) return;
      const [levels, mine] = await Promise.all([
        listLevelRooms().catch(() => ({ data: null })),
        listMyRooms().catch(() => ({ data: null })),
      ]);
      const tag = `HSK ${level}`;
      const ids: string[] = [];
      for (const r of levels.data ?? []) {
        if (r.title?.includes(tag) || r.topic === String(level)) ids.push(r.id);
      }
      for (const r of mine.data ?? []) if (!ids.includes(r.id)) ids.push(r.id);
      for (const roomId of ids.slice(0, 6)) {
        const status = await fetchChallengeStatus(roomId);
        if (!alive) return;
        if (status) {
          setFound({ roomId, status });
          return;
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [level, hydrated]);

  if (!found) return null;
  const { status, roomId } = found;
  const pct = status.target > 0 ? Math.min(100, Math.round((status.total / status.target) * 100)) : 0;

  return (
    <Link href={`/chat/${roomId}`} className="bs-chal mt-4 block">
      <div className="bs-chal-top">
        <span className="bs-chal-kicker">🏆 Манай группийн сорилт</span>
      </div>
      <p className="bs-chal-title">{status.title}</p>
      <div className="bs-chal-bar">
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="bs-chal-nums">
        <span>
          {status.total} / {status.target} үг
        </span>
        <span className="bs-chal-mine">чи {status.mine}</span>
      </div>
    </Link>
  );
}
