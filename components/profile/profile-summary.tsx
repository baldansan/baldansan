"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ProfileAchievementBadges } from "@/components/profile/profile-achievement-badges";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { fetchMyPoints } from "@/lib/points/rank";
import { getLocalWordSrsStats, readLocalStudiedWordIds } from "@/lib/srs/local-word-srs";
import { hasSupabaseConfig } from "@/lib/supabase/auth";
import { getUserWordSrsStats } from "@/lib/supabase/user-word-srs";

type Props = {
  userId: string | null;
  streak: number;
  completedLessons: number;
  /** Ахицын карт ба тэмдгийн хооронд орох мөрүүд (жишээ нь групп чат). */
  children?: ReactNode;
};

/** Профайлын товч хэсэг: «Миний ахиц» карт (үг · хичээл · оноо) + эвхээстэй тэмдгүүд. */
export function ProfileSummary({ userId, streak, completedLessons, children }: Props) {
  const { level: activeLevel } = useActiveHskLevel();
  const [studied, setStudied] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState(0);
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      if (userId && hasSupabaseConfig) {
        const [{ data }, p] = await Promise.all([
          getUserWordSrsStats(userId).catch(() => ({ data: null })),
          fetchMyPoints().catch(() => null),
        ]);
        if (!alive) return;
        setStudied(data?.studiedCount ?? 0);
        setAccuracy(data?.accuracyPct ?? 0);
        setPoints(p?.total ?? 0);
        return;
      }
      const local = getLocalWordSrsStats({}, new Map());
      if (!alive) return;
      setStudied(local.studiedCount || readLocalStudiedWordIds().length);
      setAccuracy(local.accuracyPct);
      setPoints(null);
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  return (
    <>
      <Link href="/progress" className="bs-pp-card">
        <span className="bs-pp-card-head">
          <span>Миний ахиц</span>
          <span aria-hidden>›</span>
        </span>
        <span className="bs-pp-card-stats">
          <span className="bs-pp-st">
            <b>{studied ?? "…"}</b>
            <i>үг</i>
          </span>
          <span className="bs-pp-st">
            <b>{completedLessons}</b>
            <i>хичээл</i>
          </span>
          <span className="bs-pp-st">
            {points == null && !userId ? (
              <>
                <b>🔥 {streak}</b>
                <i>өдөр</i>
              </>
            ) : (
              <>
                <b>{points ?? "…"}</b>
                <i>оноо</i>
              </>
            )}
          </span>
        </span>
      </Link>

      {children}

      <details className="bs-tm-card mt-2" style={{ display: "block" }}>
        <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
          <span className="bs-tm-card-ic" aria-hidden>🏆</span>
          <span className="flex-1">
            <span className="bs-tm-card-title">Амжилтын тэмдэг</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>▾</span>
        </summary>
        <div className="mt-3">
          <ProfileAchievementBadges
            hideTitle
            streak={streak}
            studiedCount={studied ?? 0}
            completedLessons={completedLessons}
            accuracyPct={accuracy}
            activeLevel={activeLevel}
          />
        </div>
      </details>
    </>
  );
}
