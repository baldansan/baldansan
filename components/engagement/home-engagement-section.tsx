"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStreakUnified } from "@/lib/retention/retention-service";
import {
  getRemindersUnified,
  getWeeklyReportUnified,
} from "@/lib/engagement/engagement-service";

export function HomeEngagementSection() {
  const [streak, setStreak] = useState(0);
  const [goalPercent, setGoalPercent] = useState(0);
  const [reminders, setReminders] = useState(0);
  const [activeDays, setActiveDays] = useState(0);

  useEffect(() => {
    async function load() {
      const [retention, reminderList, report] = await Promise.all([
        getStreakUnified(),
        getRemindersUnified(),
        getWeeklyReportUnified(),
      ]);
      setStreak(retention.currentStreak);
      setGoalPercent(retention.goalProgress.overallPercent);
      setReminders(reminderList.filter((item) => item.enabled).length);
      setActiveDays(report.activeDays);
    }
    void load();
  }, []);

  const cards = [
    { title: "Streak", value: `${streak} өдөр`, href: "/dashboard" },
    { title: "Daily goal", value: `${goalPercent}%`, href: "/dashboard" },
    { title: "Reminders", value: String(reminders), href: "/reminders" },
    { title: "Weekly", value: `${activeDays}/7`, href: "/weekly-report" },
  ];

  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
        Өдөр бүр бага багаар
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-100 hover:ring-emerald-300"
          >
            <p className="text-sm font-medium text-slate-600">{card.title}</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{card.value}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
