"use client";

import { useEffect, useState } from "react";
import { getAchievementsUnified } from "@/lib/engagement/engagement-service";
import { getAllLessonProgress } from "@/lib/progress";
import {
  PROFILE_BADGE_DEFS,
  type ProfileBadgeContext,
} from "@/lib/temee/profile-badges";
import type { ActiveHskLevel } from "@/lib/hsk/active-hsk-level";

type Props = {
  streak: number;
  studiedCount: number;
  completedLessons: number;
  accuracyPct: number;
  activeLevel: ActiveHskLevel;
};

export function ProfileAchievementBadges({
  streak,
  studiedCount,
  completedLessons,
  accuracyPct,
  activeLevel,
}: Props) {
  const [earnedKeys, setEarnedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    void getAchievementsUnified().then((rows) => {
      setEarnedKeys(new Set(rows.map((r) => r.achievementKey)));
    });
  }, []);

  const lessons = Object.values(getAllLessonProgress());
  const startedLessons = lessons.filter((l) => l.startedAt).length;

  const ctx: ProfileBadgeContext = {
    streak,
    studiedCount,
    completedLessons,
    startedLessons,
    accuracyPct,
    activeLevel,
    earnedAchievementKeys: earnedKeys,
  };

  return (
    <>
      <p className="bs-tm-sec">🏆 Амжилтын тэмдэг</p>
      <div className="bs-tm-badges">
        {PROFILE_BADGE_DEFS.map((badge) => {
          const on = badge.isEarned(ctx);
          return (
            <div
              key={badge.id}
              className={`bs-tm-bdg${on ? " bs-tm-bdg--on" : " bs-tm-bdg--off"}`}
              style={on && badge.bgOn ? { background: badge.bgOn } : undefined}
            >
              <span aria-hidden>{badge.emoji}</span>
              <span>{badge.label}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
