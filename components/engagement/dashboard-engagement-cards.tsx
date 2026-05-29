"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getAchievementsUnified,
  getRemindersUnified,
  getUnreadCountUnified,
  getWeeklyReportUnified,
} from "@/lib/engagement/engagement-service";

export function DashboardEngagementCards() {
  const [unread, setUnread] = useState(0);
  const [achievementCount, setAchievementCount] = useState(0);
  const [reminderCount, setReminderCount] = useState(0);
  const [weekActiveDays, setWeekActiveDays] = useState(0);

  useEffect(() => {
    async function load() {
      const [notifications, achievements, reminders, report] = await Promise.all([
        getUnreadCountUnified(),
        getAchievementsUnified(),
        getRemindersUnified(),
        getWeeklyReportUnified(),
      ]);
      setUnread(notifications);
      setAchievementCount(achievements.length);
      setReminderCount(reminders.filter((item) => item.enabled).length);
      setWeekActiveDays(report.activeDays);
    }
    void load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

  const cards = [
    {
      title: "Notifications",
      value: unread,
      href: "/notifications",
      label: unread > 0 ? "Unread" : "All caught up",
    },
    {
      title: "Achievements",
      value: achievementCount,
      href: "/profile",
      label: "Badges earned",
    },
    {
      title: "Reminders",
      value: reminderCount,
      href: "/reminders",
      label: "Study reminders",
    },
    {
      title: "This week",
      value: weekActiveDays,
      href: "/weekly-report",
      label: "Active days",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-emerald-200"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {card.title}
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{card.value}</p>
          <p className="mt-1 text-xs text-slate-600">{card.label}</p>
        </Link>
      ))}
    </section>
  );
}

export function DashboardEngagementQuickActions() {
  const links = [
    { href: "/reminders", label: "Study reminders" },
    { href: "/weekly-report", label: "Weekly report" },
    { href: "/study-plan", label: "Study plan" },
    { href: "/notifications", label: "Notifications" },
  ];

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Engagement</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
