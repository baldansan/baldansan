"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnalyticsMetricCard } from "@/components/admin/analytics-metric-card";
import { ImprovementPromptCopyButton } from "@/components/admin/improvement-prompt-card";
import { buildVocabularyImprovementPrompt } from "@/lib/admin/improvement-prompts";
import type {
  VocabularyEngagementLevel,
  VocabularyEngagementRow,
} from "@/lib/supabase/admin-analytics";

type EngagementFilter = "all" | VocabularyEngagementLevel;

type Props = {
  overview: {
    totalVocabularyWords: number;
    learnedRows: number;
    uniqueLearnedWords: number;
    wordsNeverLearned: number;
    words: VocabularyEngagementRow[];
    warnings: string[];
  };
  initialLessonFilter?: string;
};

/** Display-only labels. Keys stay as the raw engagement values. */
const ENGAGEMENT_LABEL: Record<string, string> = {
  high: "Өндөр",
  medium: "Дунд",
  low: "Бага",
  none: "Алга",
};

function engagementBadge(level: VocabularyEngagementLevel) {
  switch (level) {
    case "high":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "medium":
      return "bg-sky-50 text-sky-800 ring-sky-200";
    case "low":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

export function VocabularyInsightsView({
  overview,
  initialLessonFilter,
}: Props) {
  const [query, setQuery] = useState("");
  const [lessonFilter, setLessonFilter] = useState(initialLessonFilter ?? "all");
  const [hskFilter, setHskFilter] = useState("all");
  const [engagementFilter, setEngagementFilter] =
    useState<EngagementFilter>("all");

  const lessonOptions = useMemo(() => {
    const ids = new Map<string, string>();
    for (const row of overview.words) {
      ids.set(row.lessonId, row.lessonTitle);
    }
    return [...ids.entries()].sort(
      (a, b) => Number(a[0]) - Number(b[0])
    );
  }, [overview.words]);

  const hskOptions = useMemo(() => {
    const levels = new Set<string>();
    for (const row of overview.words) {
      if (row.hskLevel) levels.add(row.hskLevel);
    }
    return [...levels].sort();
  }, [overview.words]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return overview.words.filter((row) => {
      if (lessonFilter !== "all" && row.lessonId !== lessonFilter) return false;
      if (hskFilter !== "all" && row.hskLevel !== hskFilter) return false;
      if (engagementFilter !== "all" && row.engagement !== engagementFilter) {
        return false;
      }
      if (!q) return true;
      return (
        row.chinese.includes(q) ||
        row.pinyin.toLowerCase().includes(q) ||
        row.mongolian.toLowerCase().includes(q)
      );
    });
  }, [overview.words, query, lessonFilter, hskFilter, engagementFilter]);

  const mostLearned = useMemo(
    () =>
      [...filtered]
        .filter((w) => w.learnedCount > 0)
        .sort((a, b) => b.learnedCount - a.learnedCount)
        .slice(0, 15),
    [filtered]
  );

  const leastLearned = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => a.learnedCount - b.learnedCount)
        .slice(0, 15),
    [filtered]
  );

  function WordTable({
    rows,
    showAttention,
  }: {
    rows: VocabularyEngagementRow[];
    showAttention?: boolean;
  }) {
    if (rows.length === 0) {
      return <p className="mt-3 text-sm text-slate-500">Тохирох үг алга.</p>;
    }
    return (
      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Хятад</th>
              <th className="px-4 py-3">Пиньинь</th>
              <th className="px-4 py-3">Монгол</th>
              <th className="px-4 py-3">HSK</th>
              <th className="px-4 py-3">Сурсан</th>
              <th className="px-4 py-3">Идэвх</th>
              <th className="px-4 py-3">Хичээл</th>
              <th className="px-4 py-3">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.vocabularyWordId}>
                <td className="px-4 py-3 font-medium">{row.chinese}</td>
                <td className="px-4 py-3 text-slate-600">{row.pinyin || "—"}</td>
                <td className="px-4 py-3">{row.mongolian}</td>
                <td className="px-4 py-3">{row.hskLevel || "—"}</td>
                <td className="px-4 py-3">{row.learnedCount}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${engagementBadge(row.engagement)}`}
                  >
                    {ENGAGEMENT_LABEL[row.engagement] ?? row.engagement}
                  </span>
                  {showAttention && row.learnedCount === 0 ? (
                    <span className="ml-1 text-xs text-amber-700">Анхаарах</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{row.lessonId}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 text-xs">
                    <Link
                      href={`/admin/analytics/lessons/${row.lessonId}`}
                      className="font-medium text-emerald-700 hover:text-emerald-800"
                    >
                      Тайлан
                    </Link>
                    <Link
                      href={`/admin/lessons/${row.lessonId}/edit`}
                      className="font-medium text-slate-600 hover:text-emerald-700"
                    >
                      Засах
                    </Link>
                    {(showAttention || row.engagement === "low" || row.engagement === "none") ? (
                      <ImprovementPromptCopyButton
                        label="Үгийн сайжруулах prompt үүсгэх"
                        prompt={buildVocabularyImprovementPrompt(row)}
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Үгсийн сангийн дүн шинжилгээ
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Суралцагчид ямар үгсийг хамгийн их сурч, ямар үгс орхигдож
          байгааг харна.
        </p>
      </section>

      {overview.warnings.length > 0 ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">Тайлангийн анхааруулга</p>
          <ul className="mt-2 list-inside list-disc">
            {overview.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Хураангуй</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AnalyticsMetricCard
            label="Нийт үг"
            value={overview.totalVocabularyWords}
          />
          <AnalyticsMetricCard
            label="Сурсан бүртгэл"
            value={overview.learnedRows}
          />
          <AnalyticsMetricCard
            label="Давхардалгүй сурсан үг"
            value={overview.uniqueLearnedWords}
          />
          <AnalyticsMetricCard
            label="Огт сураагүй үг"
            value={overview.wordsNeverLearned}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Шүүлт</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input
            type="search"
            placeholder="Хятад / пиньинь / монголоор хайх…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={lessonFilter}
            onChange={(e) => setLessonFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">Бүх хичээл</option>
            {lessonOptions.map(([id, title]) => (
              <option key={id} value={id}>
                {id} — {title}
              </option>
            ))}
          </select>
          <select
            value={hskFilter}
            onChange={(e) => setHskFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">Бүх HSK түвшин</option>
            {hskOptions.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <select
            value={engagementFilter}
            onChange={(e) =>
              setEngagementFilter(e.target.value as EngagementFilter)
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">Бүх идэвх</option>
            <option value="high">Өндөр</option>
            <option value="medium">Дунд</option>
            <option value="low">Бага</option>
            <option value="none">Алга</option>
          </select>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Хамгийн их сурсан үг
        </h2>
        <WordTable rows={mostLearned} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Хамгийн бага сурсан / огт сураагүй үг
        </h2>
        <WordTable rows={leastLearned} showAttention />
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/analytics"
          className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
        >
          Тайлан руу буцах
        </Link>
        <Link
          href="/admin/analytics/questions"
          className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Асуултын дүн шинжилгээ
        </Link>
      </div>
    </div>
  );
}
