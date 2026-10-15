"use client";

import { C } from "@/components/charts";
import type { ClassInsights } from "@/lib/teacher/class-insights";
import type { AssignRequest } from "./weak-spots-tab";

type Props = {
  insights: ClassInsights;
  onAssign: (req: AssignRequest) => void;
};

function shorten(text: string, n = 140): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

export function MissedQuestionsTab({ insights, onAssign }: Props) {
  const rows = insights.missed;
  if (rows.length === 0) {
    return (
      <p className="rounded-xl bg-white p-5 text-sm text-slate-600 ring-1 ring-slate-200">
        Хамгийн их алдсан асуулт тодорхойлоход оролдлого хүрэлцэхгүй байна (асуулт бүр дор хаяж
        2 удаа хариулагдсан байх ёстой).
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-2">
      {rows.map((q, i) => {
        const lesson = insights.lessonTitles[q.lessonId] ?? q.lessonId;
        return (
          <li
            key={`${q.lessonId}-${q.questionId}`}
            className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 w-6 shrink-0 text-right text-sm font-bold tabular-nums text-slate-400">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium text-slate-900" translate="no">
                  {q.text ? shorten(q.text) : `Асуулт ${q.questionId}`}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  <span translate="no">{lesson}</span>
                  {q.correctAnswer ? (
                    <>
                      {" "}
                      · Зөв хариулт: <b className="text-slate-700" translate="no">{shorten(q.correctAnswer, 60)}</b>
                    </>
                  ) : null}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 w-40 max-w-[50%] overflow-hidden rounded-full" style={{ background: C.track }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${q.wrongPct}%`, background: q.wrongPct >= 50 ? C.bad : C.brand }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-slate-700">
                    <b>{q.wrongPct}%</b> буруу · {q.wrong}/{q.attempts}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600" translate="no">
                  {q.students
                    .slice(0, 6)
                    .map((s) => s.name)
                    .join(", ")}
                  {q.students.length > 6 ? ` +${q.students.length - 6}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onAssign({
                    studentUserIds: q.students.map((s) => s.userId),
                    lessonId: q.lessonId,
                    assignmentType: "review",
                    title: `${lesson} — алдсан асуултууд давтах`,
                    instructions: q.text
                      ? `Дараах асуулт дээр алдсан байна: «${shorten(q.text, 100)}». Хичээлээ дахин үзээд асуултаа ажиллана уу.`
                      : "Алдсан асуултуудаа давтана уу.",
                  })
                }
                className="shrink-0 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                Давтуулах
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
