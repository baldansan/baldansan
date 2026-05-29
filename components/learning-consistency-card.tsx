"use client";

import Link from "next/link";
import type { LearningRetentionSummary } from "@/lib/learning-retention";

const WEEKDAY_LABELS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];

type Props = {
  summary: LearningRetentionSummary;
};

export function LearningConsistencyCard({ summary }: Props) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Learning consistency</h2>
      <p className="mt-1 text-sm text-slate-600">
        Өдөр бүр бага багаар сурах — streak болон өдрийн зорилго.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-emerald-50/80 p-4 text-center ring-1 ring-emerald-200">
          <p className="text-3xl font-bold text-emerald-700">{summary.currentStreak}</p>
          <p className="mt-1 text-xs font-medium text-slate-600">Одоогийн streak</p>
        </div>
        <div className="rounded-xl bg-emerald-50/80 p-4 text-center ring-1 ring-emerald-200">
          <p className="text-3xl font-bold text-emerald-700">{summary.longestStreak}</p>
          <p className="mt-1 text-xs font-medium text-slate-600">Хамгийн урт streak</p>
        </div>
        <div className="rounded-xl bg-emerald-50/80 p-4 text-center ring-1 ring-emerald-200">
          <p className="text-3xl font-bold text-emerald-700">
            {summary.activeDaysThisWeek}/7
          </p>
          <p className="mt-1 text-xs font-medium text-slate-600">Энэ 7 хоног</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-700">Сүүлийн 7 хоног</p>
        <div className="mt-3 flex justify-between gap-1">
          {summary.weekActivity.map((active, index) => (
            <div key={WEEKDAY_LABELS[index]} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`flex h-9 w-full max-w-[2.5rem] items-center justify-center rounded-lg text-xs font-semibold ${
                  active
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-400 ring-1 ring-slate-200"
                }`}
                title={active ? "Идэвхтэй" : "Амарсан"}
              >
                {active ? "✓" : "·"}
              </span>
              <span className="text-[10px] text-slate-500">{WEEKDAY_LABELS[index]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <p className="text-sm font-medium text-slate-800">
          Өдрийн зорилго: {summary.dailyGoal} сургалтын үйлдэл
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Хичээл үзэх, үг сурах, quiz өгөх — аль нэг нь тоологдоно.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Өнөөдөр: {summary.today.total}/{summary.dailyGoal}
          {summary.goalMet ? " — зорилго биелсэн" : ""}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/review"
          className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Daily review
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Dashboard
        </Link>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Сануулагч (push notification) — ирээдүйд нэмэгдэнэ. Одоогоор streak энэ төхөөрөмж +
        нэвтэрсэн аккаунтын ахицаас тооцогдоно.
      </p>
    </section>
  );
}
