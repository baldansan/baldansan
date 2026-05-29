"use client";

import { ACHIEVEMENTS } from "@/lib/engagement/achievements";
import { getAchievementsUnified } from "@/lib/engagement/engagement-service";
import { useEffect, useState } from "react";
import type { UserAchievement } from "@/lib/engagement/types";

export function AchievementList() {
  const [earned, setEarned] = useState<UserAchievement[]>([]);

  useEffect(() => {
    void getAchievementsUnified().then(setEarned);
  }, []);

  const earnedKeys = new Set(earned.map((item) => item.achievementKey));
  const all = Object.values(ACHIEVEMENTS);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Achievements</h2>
      <p className="mt-1 text-sm text-slate-600">
        {earned.length}/{all.length} unlocked
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {all.map((def) => {
          const unlocked = earnedKeys.has(def.key);
          const row = earned.find((item) => item.achievementKey === def.key);
          return (
            <li
              key={def.key}
              className={`rounded-xl p-4 ring-1 ${
                unlocked
                  ? "bg-emerald-50 ring-emerald-200"
                  : "bg-slate-50 ring-slate-200 opacity-70"
              }`}
            >
              <p className="font-semibold text-slate-900">{def.title}</p>
              <p className="mt-1 text-sm text-slate-600">{def.description}</p>
              {row ? (
                <p className="mt-2 text-xs text-emerald-700">
                  {new Date(row.earnedAt).toLocaleDateString()}
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Locked</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
