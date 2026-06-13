"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  LearnerDetailData,
  LearnerOption,
} from "@/lib/supabase/admin-learner";

type Props = {
  learners: LearnerOption[];
  detail: LearnerDetailData;
};

function formatTime(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("mn-MN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const STAGE_LABEL: Record<string, string> = {
  grammar: "Дүрэм",
  grammar_exercise: "Дүрэм/дасгал",
  hsk1: "HSK 1",
  hsk2: "HSK 2",
  hsk3: "HSK 3",
  hsk4: "HSK 4",
  hsk5: "HSK 5",
  hsk6: "HSK 6",
  quiz: "Сорил",
  mock_exam: "Mock",
  word_practice: "Үг",
  order: "Эвлүүлэх",
  subject: "Өгүүлэгдэхүүн",
  predicate: "Өгүүлэхүүн",
};

export function LearnerDetailView({ learners, detail }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("user") ?? detail.userId;

  return (
    <div className="flex flex-col gap-6">
      <div className="admin-panel p-5">
        <label className="text-sm font-semibold text-slate-700">
          Суралцагч сонгох
        </label>
        <select
          className="admin-input mt-2 max-w-lg"
          value={selected}
          onChange={(e) =>
            router.push(`/admin/learner?user=${encodeURIComponent(e.target.value)}`)
          }
        >
          {learners.map((l) => (
            <option key={l.userId} value={l.userId}>
              {l.userId.slice(0, 8)}… — {l.attemptCount} оролдлого
            </option>
          ))}
        </select>
        {detail.userId ? (
          <p className="mt-2 font-mono text-xs text-slate-500">
            user_id: {detail.userId}
          </p>
        ) : null}
      </div>

      {detail.warnings.length > 0 ? (
        <div className="admin-panel border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ul className="list-inside list-disc">
            {detail.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section>
        <h2 className="admin-section-title">Прогресс</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="admin-panel p-4 text-center">
            <p className="text-2xl font-black text-emerald-700">
              {detail.completedLessons}
            </p>
            <p className="text-xs font-bold text-slate-500">Дуусгасан хичээл</p>
          </div>
          <div className="admin-panel p-4 text-center">
            <p className="text-2xl font-black text-emerald-700">
              {detail.srsWordCount}
            </p>
            <p className="text-xs font-bold text-slate-500">SRS үг</p>
          </div>
          <div className="admin-panel p-4 text-center">
            <p className="text-2xl font-black text-emerald-700">
              {detail.recentAttempts.length}
            </p>
            <p className="text-xs font-bold text-slate-500">Сүүлийн оролдлого</p>
          </div>
          <div className="admin-panel p-4 text-center">
            <p className="text-2xl font-black text-emerald-700">
              {detail.feedback.length}
            </p>
            <p className="text-xs font-bold text-slate-500">Feedback</p>
          </div>
        </div>
      </section>

      {detail.mockAttempts.length > 0 ? (
        <section className="admin-panel overflow-x-auto p-0">
          <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
            Mock exam түүх
          </h3>
          <table className="admin-table w-full text-sm">
            <thead>
              <tr>
                <th>Test</th>
                <th>Оноо</th>
                <th>Дууссан</th>
              </tr>
            </thead>
            <tbody>
              {detail.mockAttempts.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono text-xs">{m.testId}</td>
                  <td>
                    {m.score ?? "—"}/{m.maxScore ?? "—"}
                  </td>
                  <td>{m.finishedAt ? formatDate(m.finishedAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <section className="admin-panel overflow-x-auto p-0">
        <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
          Сүүлийн үйлдлүүд
        </h3>
        {detail.recentAttempts.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">Өгөгдөл байхгүй.</p>
        ) : (
          <table className="admin-table w-full min-w-[720px] text-sm">
            <thead>
              <tr>
                <th>Цаг</th>
                <th>Хичээл</th>
                <th>Стади</th>
                <th>Асуулт</th>
                <th>Оролд.</th>
                <th>Үр дүн</th>
                <th>Хугацаа</th>
              </tr>
            </thead>
            <tbody>
              {detail.recentAttempts.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap text-xs">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="font-mono text-xs">{row.lessonId}</td>
                  <td>{STAGE_LABEL[row.stage] ?? row.stage}</td>
                  <td className="font-mono text-xs">{row.questionId}</td>
                  <td className="text-center">{row.attemptNumber}</td>
                  <td>{row.isCorrect ? "✓" : "✗"}</td>
                  <td>{formatTime(row.timeSpentMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="admin-panel overflow-x-auto p-0">
        <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
          Хүндрэлтэй цэгүүд (энэ хүн)
        </h3>
        {detail.hardSpots.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">Одоогоор байхгүй.</p>
        ) : (
          <table className="admin-table w-full min-w-[560px] text-sm">
            <thead>
              <tr>
                <th>Хичээл</th>
                <th>Асуулт</th>
                <th>Стади</th>
                <th>Буруу</th>
                <th>Нийт</th>
                <th>Дунд хугацаа</th>
              </tr>
            </thead>
            <tbody>
              {detail.hardSpots.map((row) => (
                <tr key={`${row.lessonId}-${row.questionId}`}>
                  <td className="font-mono text-xs">{row.lessonId}</td>
                  <td className="font-mono text-xs">{row.questionId}</td>
                  <td>{STAGE_LABEL[row.stage] ?? row.stage}</td>
                  <td className="font-bold text-red-600">{row.wrongCount}</td>
                  <td>{row.totalAttempts}</td>
                  <td>{formatTime(row.avgTimeMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="admin-panel overflow-x-auto p-0">
          <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
            Дүрэм — хамгийн их андуурсан
          </h3>
          {detail.grammarHardSpots.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">
              HSK дүрмийн дасгалын өгөгдөл байхгүй.
            </p>
          ) : (
            <table className="admin-table w-full min-w-[560px] text-sm">
              <thead>
                <tr>
                  <th>Хичээл</th>
                  <th>Дүрмийн цэг</th>
                  <th>Асуулт</th>
                  <th>Оролд.</th>
                  <th>Андуурсан</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {detail.grammarHardSpots.map((row) => (
                  <tr key={`${row.lessonId}-${row.questionId}`}>
                    <td className="font-mono text-xs">{row.lessonId}</td>
                    <td>{row.pointLabel}</td>
                    <td>{row.questionLabel}</td>
                    <td className="text-center">{row.totalAttempts}</td>
                    <td className="text-center font-bold text-red-600">
                      {row.wrongCount}
                    </td>
                    <td className="text-center font-bold">{row.wrongPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="admin-panel overflow-x-auto p-0">
          <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
            Хэлзүй — хамгийн их андуурсан даалгавар
          </h3>
          {detail.helzuiHardSpots.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">
              Хэлзүйн суурь курсын өөрийн үнэлгээний өгөгдөл байхгүй.
            </p>
          ) : (
            <table className="admin-table w-full min-w-[560px] text-sm">
              <thead>
                <tr>
                  <th>Модуль</th>
                  <th>Өгүүлбэр</th>
                  <th>Оролд.</th>
                  <th>Андуурсан</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {detail.helzuiHardSpots.map((row) => (
                  <tr key={row.questionId}>
                    <td>{row.moduleTitle}</td>
                    <td className="zh text-base font-semibold">{row.sentenceZh}</td>
                    <td className="text-center">{row.totalAttempts}</td>
                    <td className="text-center font-bold text-red-600">
                      {row.wrongCount}
                    </td>
                    <td className="text-center font-bold">{row.wrongPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="admin-panel overflow-x-auto p-0">
        <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
          Бүх feedback
        </h3>
        {detail.feedback.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">Feedback байхгүй.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {detail.feedback.map((row) => (
              <li key={row.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {formatDate(row.createdAt)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold">
                    {row.stage}
                  </span>
                  {row.rating ? (
                    <span className="text-xs font-bold">{row.rating}</span>
                  ) : null}
                  {row.lessonId ? (
                    <Link
                      href={`/admin/analytics/lessons/${row.lessonId}`}
                      className="font-mono text-xs text-emerald-700 hover:underline"
                    >
                      {row.lessonId}
                    </Link>
                  ) : null}
                </div>
                {row.note ? (
                  <p className="mt-1 text-slate-700">{row.note}</p>
                ) : null}
                {row.pagePath ? (
                  <p className="mt-1 font-mono text-xs text-slate-400">
                    {row.pagePath}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
