"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DonutChart, LineChart, StatTile, fmtNum, fmtPct } from "@/components/charts";
import { PublicPageShell } from "@/components/public-page-shell";
import { ClassAssignmentComposer } from "@/components/teacher/class-assignment-composer";
import { GradeChip, Pct, WeakAreaChip, formatLastActive } from "@/components/teacher/class-dashboard/shared";
import { WEAK_SPOT_AREA_LABELS } from "@/lib/analytics/weak-spots";
import { formatDuration, fetchStudentTimeline, type TimelineDay } from "@/lib/points/report";
import { getClassroomById } from "@/lib/supabase/classrooms";
import { getClassroomStudentProgress } from "@/lib/supabase/teacher-analytics";
import { fetchStudentDetail, type StudentDetail } from "@/lib/teacher/class-insights";

type Props = { classroomId: string; studentUserId: string };

const STATUS_LABEL: Record<string, string> = {
  completed: "Дууссан",
  in_progress: "Хийгдэж байна",
  not_started: "Эхлээгүй",
};

function Card({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Ulaanbaatar" });
}

export function StudentDetailView({ classroomId, studentUserId }: Props) {
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [className, setClassName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let off = false;
    void (async () => {
      setLoading(true);
      const [progress, cls, tl] = await Promise.all([
        getClassroomStudentProgress(classroomId),
        getClassroomById(classroomId),
        fetchStudentTimeline({ userId: studentUserId, days: 14 }),
      ]);
      if (off) return;
      setClassName(cls.data?.name ?? null);
      setTimeline(tl);
      if (progress.error || !progress.data) {
        setError(progress.error ?? "Сурагчийн мэдээлэл татаж чадсангүй.");
        setLoading(false);
        return;
      }
      const res = await fetchStudentDetail(classroomId, studentUserId, progress.data);
      if (off) return;
      setDetail(res.data);
      setError(res.data ? res.error : (res.error ?? "Сурагч олдсонгүй."));
      setLoading(false);
    })();
    return () => {
      off = true;
    };
  }, [classroomId, studentUserId, reloadKey]);

  if (loading) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      </PublicPageShell>
    );
  }

  if (!detail) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">{error ?? "Сурагч олдсонгүй."}</p>
        <Link href={`/teacher/classes/${classroomId}`} className="mt-2 text-sm text-emerald-600">
          ← Ангид буцах
        </Link>
      </PublicPageShell>
    );
  }

  const p = detail.points;
  const slices = detail.areaStats
    .filter((a) => a.wrong > 0)
    .map((a) => ({ label: WEAK_SPOT_AREA_LABELS[a.area], value: a.wrong }));
  const sparkPoints = detail.daily.points.slice(-14);
  const hours30 = detail.minutes30 / 60;

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href={`/teacher/classes/${classroomId}`}
          className="text-sm font-medium text-slate-600 hover:text-emerald-600"
        >
          ← {className ?? "Анги"}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight" translate="no">
            {detail.name}
          </h1>
          <GradeChip grade={detail.grade} />
          <WeakAreaChip area={detail.weakArea} />
        </div>
        {error ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{error}</p>
        ) : null}
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Сурагчийн үзүүлэлтүүд">
        <StatTile
          label="Оноо"
          value={fmtNum(p?.total ?? 0)}
          delta={p ? p.last7d - p.prev7d : null}
          deltaUnit=" оноо"
          spark={sparkPoints}
        />
        <StatTile
          label="Ангийн байр"
          value={detail.rank != null ? `#${detail.rank}` : "—"}
          hint={detail.classSize ? `${detail.classSize} сурагчаас` : undefined}
        />
        <StatTile
          label="Зэрэг"
          value={detail.grade === "unrated" ? "—" : detail.grade}
          hint={detail.gradeScore != null ? `${detail.gradeScore} оноо` : "үнэлэхэд эрт"}
        />
        <StatTile
          label="Зөв хариулт"
          value={fmtPct(detail.accuracy)}
          hint={`${detail.attempts} хариултаас`}
        />
        <StatTile label="Ирц (30 хоног)" value={fmtPct(detail.attendancePct)} hint="ирцийн бүртгэлээс" />
        <StatTile
          label="Суралцсан (30 хоног)"
          value={detail.minutes30 > 0 ? `${fmtNum(hours30, 1)} цаг` : "—"}
          hint="апп дээр зарцуулсан"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Өдрийн оноо" hint="Сүүлийн 30 өдөр">
          <LineChart
            labels={detail.daily.labels}
            series={[{ name: "Оноо", values: detail.daily.points }]}
            ariaLabel="Сүүлийн 30 өдрийн оноо"
          />
        </Card>
        <Card title="Өдрийн суралцсан минут" hint="Сүүлийн 30 өдөр">
          <LineChart
            labels={detail.daily.labels}
            series={[{ name: "Минут", values: detail.daily.minutes }]}
            unit=""
            ariaLabel="Сүүлийн 30 өдрийн суралцсан минут"
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Сул тал" hint="Буруу хариултын хэсгээр хуваарилалт">
          {slices.length > 0 ? (
            <DonutChart
              slices={slices}
              centerValue={String(slices.reduce((n, s) => n + s.value, 0))}
              centerLabel="буруу"
              ariaLabel="Сурагчийн алдааны хэсгээр хуваарилалт"
            />
          ) : (
            <p className="text-sm text-slate-500">Алдсан хариулт бүртгэгдээгүй байна.</p>
          )}
        </Card>

        <Card title="Дээд оноотой хичээлүүд" hint="Хичээлийн дасгалын хамгийн сайн дүн">
          {detail.records.length === 0 ? (
            <p className="text-sm text-slate-500">Дасгалын дүн алга.</p>
          ) : (
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="py-1.5 pr-2 font-semibold">Хичээл</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Дээд</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Оролд.</th>
                    <th className="py-1.5 pl-2 text-right font-semibold">Сүүлд</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.records.map((r) => (
                    <tr key={r.lessonId} className="border-b border-slate-100 last:border-0">
                      <td className="max-w-[12rem] truncate py-1.5 pr-2" translate="no">
                        {r.title ?? r.lessonId}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <Pct value={r.bestScorePct} />
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{r.attempts}</td>
                      <td className="py-1.5 pl-2 text-right text-xs text-slate-500">{formatLastActive(r.lastAttemptAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card title="Сүүлийн алдаанууд" hint="Асуулт болон сурагчийн өгсөн хариулт">
        {detail.mistakes.length === 0 ? (
          <p className="text-sm text-slate-500">Алдсан хариулт алга.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {detail.mistakes.map((m, i) => (
              <li key={`${m.questionId}-${i}`} className="py-2 text-sm">
                <p className="break-words font-medium text-slate-900" translate="no">
                  {m.text ?? `Асуулт ${m.questionId}`}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  <span translate="no">{detail.lessonTitles[m.lessonId] ?? m.lessonId}</span> · {shortDate(m.at)} · Хариулсан:{" "}
                  <b className="text-red-700" translate="no">
                    {m.selected ?? "—"}
                  </b>{" "}
                  · Зөв:{" "}
                  <b className="text-emerald-700" translate="no">
                    {m.correct ?? "—"}
                  </b>
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Өгсөн даалгаврууд" hint="Ангийн болон зөвхөн энэ сурагчид онилсон">
          {detail.assignments.length === 0 ? (
            <p className="text-sm text-slate-500">Даалгавар алга.</p>
          ) : (
            <ul className="flex max-h-72 flex-col divide-y divide-slate-100 overflow-auto">
              {detail.assignments.map((a) => (
                <li key={a.assignmentId} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="min-w-0">
                    <Link
                      href={`/teacher/assignments/${a.assignmentId}`}
                      className="block truncate font-medium text-emerald-700"
                      translate="no"
                    >
                      {a.title}
                    </Link>
                    <span className="text-xs text-slate-500">
                      {a.targeted ? "Зөвхөн энэ сурагчид" : "Бүх ангид"}
                      {a.dueDate ? ` · дуусах ${a.dueDate}` : ""}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-xs font-semibold ${
                      a.status === "completed" ? "text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    {STATUS_LABEL[a.status] ?? a.status}
                    {a.quizPercentage != null ? ` · ${a.quizPercentage}%` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Хурдан сорилууд">
          {detail.quizzes.length === 0 ? (
            <p className="text-sm text-slate-500">Хурдан сорил өгөөгүй байна.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {detail.quizzes.map((q) => (
                <li key={q.quizId} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate" translate="no">
                    {q.title}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {shortDate(q.submittedAt)} · <Pct value={q.scorePct} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Сүүлийн 14 хоногийн үйл ажиллагаа" hint="Хэзээ юу хийсэн, хэдэн оноо авсан">
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-500">Үйл ажиллагаа бүртгэгдээгүй.</p>
        ) : (
          <div className="flex max-h-96 flex-col gap-3 overflow-auto">
            {timeline.slice(0, 10).map((d) => (
              <div key={d.day}>
                <p className="text-xs font-semibold text-slate-500">
                  {d.day} · {d.totalPoints > 0 ? `+${d.totalPoints} оноо` : "оноогүй"}
                  {d.totalSeconds > 0 ? ` · ${formatDuration(d.totalSeconds)}` : ""}
                </p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {d.entries.slice(0, 8).map((e, i) => (
                    <li key={`${e.at}-${i}`} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="w-12 shrink-0 text-xs tabular-nums text-slate-400">{e.time}</span>
                      <span aria-hidden="true">{e.icon}</span>
                      <span className="min-w-0 flex-1 truncate" translate="no">
                        {e.title}
                        {e.detail ? <span className="text-slate-400"> · {e.detail}</span> : null}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-slate-500">
                        {e.points > 0 ? `+${e.points}` : e.seconds > 0 ? formatDuration(e.seconds) : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Даалгавар өгөх</h2>
        <p className="mt-1 text-sm text-slate-600">
          Зөвхөн <span translate="no">{detail.name}</span> харах даалгавар.
        </p>
        <div className="mt-3">
          <ClassAssignmentComposer
            classroomId={classroomId}
            lockedStudentIds={[studentUserId]}
            lockedLabel={detail.name}
            prefill={
              detail.weakArea
                ? {
                    key: 1,
                    studentUserIds: [studentUserId],
                    lessonId: null,
                    title: `${WEAK_SPOT_AREA_LABELS[detail.weakArea]} — давтлага`,
                    instructions: `${WEAK_SPOT_AREA_LABELS[detail.weakArea]} хэсэгт алдсан асуултуудаа дахин ажиллана уу.`,
                  }
                : null
            }
            onCreated={() => setReloadKey((k) => k + 1)}
          />
        </div>
      </section>
    </PublicPageShell>
  );
}
