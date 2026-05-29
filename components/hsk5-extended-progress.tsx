"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getAllQuizResultsSmart,
  getTotalLearnedWords,
  type QuizResultEntry,
} from "@/lib/progress";
import { getLearnerDashboardStats } from "@/lib/learner-progress";

type Props = {
  lessonIds: string[];
};

export function Hsk5ExtendedProgress({ lessonIds }: Props) {
  const [completed, setCompleted] = useState(0);
  const [learnedWords, setLearnedWords] = useState(0);
  const [quizCount, setQuizCount] = useState(0);

  useEffect(() => {
    async function refresh() {
      const stats = await getLearnerDashboardStats(lessonIds);
      setCompleted(stats.completedLessons);
      setLearnedWords(Math.max(stats.learnedWords, getTotalLearnedWords()));
      const quizzes: QuizResultEntry[] = await getAllQuizResultsSmart();
      setQuizCount(quizzes.length);
    }
    void refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [lessonIds]);

  const total = lessonIds.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Progress summary</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Lessons done</p>
          <p className="text-xl font-bold text-slate-900">
            {completed}/{total}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Learned words</p>
          <p className="text-xl font-bold text-slate-900">{learnedWords}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Quiz attempts</p>
          <p className="text-xl font-bold text-slate-900">{quizCount}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
          <p className="text-xs text-emerald-700">Course %</p>
          <p className="text-xl font-bold text-emerald-800">{pct}%</p>
        </div>
      </div>
      <Link
        href="/dashboard"
        className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:underline"
      >
        Full dashboard →
      </Link>
    </section>
  );
}
