"use client";

import { C, DonutChart, type DonutSlice } from "@/components/charts";
import {
  WEAK_SPOT_AREA_ICONS,
  WEAK_SPOT_AREA_LABELS,
  MIN_AREA_ATTEMPTS,
} from "@/lib/analytics/weak-spots";
import type { ComposerPrefill } from "@/components/teacher/class-assignment-composer";
import { WEAK_THRESHOLD_PCT, type ClassInsights } from "@/lib/teacher/class-insights";
import { Pct } from "./shared";

export type AssignRequest = Omit<ComposerPrefill, "key">;

type Props = {
  insights: ClassInsights;
  onAssign: (req: AssignRequest) => void;
};

export function WeakSpotsTab({ insights, onAssign }: Props) {
  const areas = insights.areas.filter((a) => a.total > 0);
  const slices: DonutSlice[] = areas
    .filter((a) => a.wrong > 0)
    .map((a) => ({ label: WEAK_SPOT_AREA_LABELS[a.area], value: a.wrong }));
  const totalWrong = areas.reduce((n, a) => n + a.wrong, 0);

  if (areas.length === 0) {
    return (
      <p className="rounded-xl bg-white p-5 text-sm text-slate-600 ring-1 ring-slate-200">
        Асуултын оролдлого хараахан бүртгэгдээгүй байна — сурагчид дасгал хийсний дараа энд
        гарна.
      </p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Алдааны хуваарилалт</h3>
        <p className="mb-3 mt-1 text-xs text-slate-500">Ангийн нийт буруу хариултын хэсгээр хуваарилалт.</p>
        <DonutChart
          slices={slices}
          centerValue={String(totalWrong)}
          centerLabel="буруу хариулт"
          ariaLabel="Ангийн алдааны хэсгээр хуваарилалт"
        />
        {insights.truncated ? (
          <p className="mt-3 text-xs text-amber-700">
            Оролдлого олон тул зөвхөн хамгийн сүүлийн хэсгийг тооцлоо.
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        {areas.map((a) => {
          const label = WEAK_SPOT_AREA_LABELS[a.area];
          const lessonTitle = a.suggestedLessonId
            ? (insights.lessonTitles[a.suggestedLessonId] ?? a.suggestedLessonId)
            : null;
          return (
            <article key={a.area} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  <span aria-hidden="true">{WEAK_SPOT_AREA_ICONS[a.area]} </span>
                  {label}
                </h3>
                <p className="text-xs text-slate-500">
                  Ангийн зөв хариулт <Pct value={a.accuracy} /> · {a.wrong}/{a.total} буруу
                </p>
              </header>

              {a.weakStudents.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  {WEAK_THRESHOLD_PCT}%-иас доош зөв хариулсан сурагч алга
                  (дор хаяж {MIN_AREA_ATTEMPTS} хариулттай).
                </p>
              ) : (
                <>
                  <p className="mt-3 text-xs font-medium text-slate-600">
                    {WEAK_THRESHOLD_PCT}%-иас доош ({a.weakStudents.length} сурагч)
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {a.weakStudents.map((s) => (
                      <li
                        key={s.userId}
                        className="rounded-full bg-slate-50 px-2.5 py-1 text-xs ring-1 ring-slate-200"
                        translate="no"
                      >
                        {s.name}{" "}
                        <b className="tabular-nums" style={{ color: C.bad }}>
                          {s.accuracy}%
                        </b>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        onAssign({
                          studentUserIds: a.weakStudents.map((s) => s.userId),
                          lessonId: a.suggestedLessonId,
                          assignmentType: "review",
                          title: lessonTitle
                            ? `${label} — ${lessonTitle} давтах`
                            : `${label} — давтлага`,
                          instructions: `${label} хэсэгт алдсан асуултуудаа дахин ажиллана уу.`,
                        })
                      }
                      className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
                    >
                      Энэ бүлэгт даалгавар өгөх
                    </button>
                    {lessonTitle ? (
                      <span className="text-xs text-slate-500">
                        Санал болгох хичээл: <b className="text-slate-700">{lessonTitle}</b>
                      </span>
                    ) : null}
                  </div>
                </>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
