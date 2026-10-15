"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  BarChart,
  DistributionBar,
  DonutChart,
  Heatmap,
  LineChart,
  RankTable,
  StatTile,
  fmtNum,
  fmtPct,
  C,
} from "@/components/charts";
import { ClassTable, pctColor } from "@/components/organization/director/class-table";
import { DEMO_BADGE_LABEL, DEMO_DATA_NOTE } from "@/lib/demo-data";
import { buildDashboardMarkdown } from "@/lib/organization/dashboard-markdown";
import type { OrganizationDashboard } from "@/lib/organization/dashboard-types";
import { TEACHER_COMPARISON_CAVEAT } from "@/lib/reports/center-report";

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="print-box rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <p className="text-sm text-slate-500">{children}</p>;

const PRINT_CSS = `@media print { header, footer, nav, [data-print-hide] { display: none !important; } body { background:#fff !important; } .print-box { break-inside: avoid; box-shadow:none !important; } }`;

export function DirectorDashboard({ organizationId, data }: { organizationId: string; data: OrganizationDashboard }) {
  const hasDemo = data.all != null;
  const [showDemo, setShowDemo] = useState(() => hasDemo && data.real.classes.length === 0);
  const [copied, setCopied] = useState(false);
  const d = showDemo && data.all ? data.all : data.real;
  const h = d.hero;
  const name = data.organizationName ?? "Байгууллага";
  const md = useMemo(() => buildDashboardMarkdown(name, d), [name, d]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const pts = data.pointsAvailable;
  const classBars = [...d.classes]
    .sort((a, b) => (b.avgPoints ?? -1) - (a.avgPoints ?? -1))
    .map((c) => ({ label: c.name, value: pts ? c.avgPoints : c.activePct, sub: c.teacherName }));
  const missedAreas = d.weakAreas.filter((a) => a.wrong > 0);
  const attRows = d.classes.filter((c) => c.attendance.present + c.attendance.late + c.attendance.absent + c.attendance.excused > 0);

  return (
    <div className="flex flex-col gap-5">
      <style>{PRINT_CSS}</style>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/organization/${organizationId}`} data-print-hide className="text-sm text-slate-600 hover:text-emerald-600">← Байгууллагын нүүр</Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{name}</h1>
          <p className="text-sm text-slate-600">Захирлын самбар · бүх анги, бүх багш нэг дэлгэцэнд</p>
        </div>
        <div className="flex flex-wrap gap-2" data-print-hide>
          <button type="button" onClick={() => void copy()} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
            {copied ? "Хуулагдлаа!" : "Markdown хуулах"}
          </button>
          <button type="button" onClick={() => window.print()} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200">Хэвлэх</button>
          <Link href={`/organization/${organizationId}/dashboard/pilot`} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200">Пилотын бэлэн байдал</Link>
        </div>
      </header>

      {hasDemo ? (
        <div className="print-box flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold ring-1 ring-amber-200">{DEMO_BADGE_LABEL}</span>
          <span className="min-w-0 flex-1">{showDemo ? DEMO_DATA_NOTE : `${data.demoClassCount} жишээ анги нуугдсан байна.`}</span>
          <button type="button" aria-pressed={showDemo} data-print-hide onClick={() => setShowDemo((v) => !v)} className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold">
            {showDemo ? "Жишээг нуух" : "Жишээг харуулах"}
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Сурагчид" value={fmtNum(h.students)} hint="бүртгэлтэй" spark={h.activeSpark} />
        <StatTile label="Багш" value={fmtNum(h.teachers)} hint="анги хариуцсан" />
        <StatTile label="Анги" value={fmtNum(h.classes)} hint="нийт" />
        <StatTile label="7 хоногт идэвхтэй" value={fmtPct(h.activePct)} delta={h.activePctDelta} deltaUnit=" п.п" />
        <StatTile label="Дундаж ирц" value={fmtPct(h.attendancePct)} hint="ирсэн + хоцорсон" />
        <StatTile label="Шалгалтад тэнцсэн" value={fmtPct(h.examPassPct)} hint="ангийн шалгалтууд" />
        <StatTile label="Оноо (7 хоног)" value={pts ? fmtNum(h.pointsWeek) : "—"} delta={pts ? h.pointsDelta : null} hint={pts ? undefined : "оноо идэвхжээгүй"} />
        <StatTile label="Өнөөдөр идэвхтэй" value={fmtNum(h.activeToday)} hint="сурагч" />
      </div>

      <Section title="Анги бүрээр" hint="Баганын нэр дээр дарж эрэмбэлнэ. Ангийн нэр дээр дарвал ангийн хуудас руу орно.">
        {d.classes.length === 0 ? <Empty>Анги бүртгэгдээгүй байна.</Empty> : (
          <div className="flex flex-col gap-5">
            <BarChart data={classBars} unit={pts ? "" : "%"} highlight ariaLabel={pts ? "Ангиудын дундаж оноо" : "Ангиудын идэвхтэй сурагчийн хувь"} />
            <p className="-mt-3 text-xs text-slate-500">{pts ? "Сурагч бүрийн дундаж оноогоор." : "Оноо идэвхжээгүй тул идэвхтэй сурагчийн хувиар."} Ногоон = тэргүүлэгч, улаан = анхаарах.</p>
            <ClassTable classes={d.classes} />
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-600">Үнэлгээний түвшин (A–F):</p>
              <p className="text-xs text-slate-500">A маш сайн · B сайн · C дунд · D сул · F хангалтгүй · саарал = үнэлэхэд эрт.</p>
            </div>
          </div>
        )}
      </Section>

      <Section title="Багш нарын үзүүлэлт">
        <p className="print-box mb-3 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-700 ring-1 ring-slate-200">{TEACHER_COMPARISON_CAVEAT}</p>
        {d.teachers.length === 0 ? <Empty>Багш оноогдсон анги алга.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  {["Багш", "Анги", "Сурагч", "Дундаж оноо", "Ирц", "Шалгалт тэнцсэн", "Даалгавар", "Цаг/сурагч", "Идэвхтэй"].map((t, i) => (
                    <th key={t} className={`px-2 py-2 font-semibold ${i ? "text-right" : ""}`}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.teachers.map((t) => (
                  <tr key={t.teacherId ?? "none"} className="print-box border-b border-slate-100">
                    <td className="px-2 py-2 font-semibold text-slate-900">{t.name}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{t.classes}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{t.students}</td>
                    <td className="px-2 py-2 text-right font-semibold tabular-nums">{t.avgPoints ?? "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums" style={{ color: pctColor(t.attendancePct) }}>{fmtPct(t.attendancePct)}</td>
                    <td className="px-2 py-2 text-right tabular-nums" style={{ color: pctColor(t.examPassPct) }}>{fmtPct(t.examPassPct)}</td>
                    <td className="px-2 py-2 text-right tabular-nums" style={{ color: pctColor(t.completionPct) }}>{fmtPct(t.completionPct)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{t.hoursPerStudent ?? "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums" style={{ color: pctColor(t.activePct) }}>{fmtPct(t.activePct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Сүүлийн 30 хоног" hint="Өдөр бүр идэвхтэй байсан сурагчийн тоо ба суралцсан минут.">
          <div className="flex flex-col gap-4">
            <LineChart labels={d.daily.labels} series={[{ name: "Идэвхтэй сурагч", values: d.daily.active }]} ariaLabel="Өдөр бүрийн идэвхтэй сурагч" />
            <LineChart labels={d.daily.labels} series={[{ name: "Суралцсан минут", values: d.daily.minutes }]} ariaLabel="Өдөр бүрийн суралцсан минут" />
          </div>
        </Section>
        <Section title="Ангиуд × сүүлийн 8 долоо хоног" hint="Тухайн долоо хоногт идэвхтэй байсан сурагчийн хувь.">
          <Heatmap rowLabels={d.classes.map((c) => c.name)} colLabels={d.weekLabels} values={d.classes.map((c) => c.weekly)} unit="%" ariaLabel="Ангиудын долоо хоног тутмын идэвх" />
        </Section>
      </div>

      <Section title="Сул тал — сургуулиар" hint="Сүүлийн 30 хоногийн хариултаас.">
        {missedAreas.length === 0 ? <Empty>Хангалттай хариулт хараахан цугларсангүй.</Empty> : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-600">Алдааны хуваарилалт</p>
              <DonutChart slices={missedAreas.map((a) => ({ label: a.label, value: a.wrong }))} centerValue={fmtNum(missedAreas.reduce((s, a) => s + a.wrong, 0))} centerLabel="алдаа" ariaLabel="Алдаа хэсгээр" />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-600">Хэсэг бүрийн зөв хариултын хувь</p>
              <BarChart data={d.weakAreas.map((a) => ({ label: a.label, value: a.accuracyPct, sub: `${a.total} хариулт` }))} unit="%" highlight ariaLabel="Хэсэг бүрийн зөв хариулт" />
            </div>
          </div>
        )}
        <h3 className="mt-5 text-sm font-semibold text-slate-900">Хамгийн их алдсан 10 асуулт</h3>
        {d.missed.length === 0 ? <Empty>Нэг асуултыг 3-аас дээш удаа хариулсан өгөгдөл алга.</Empty> : (
          <ol className="m-0 mt-2 list-none divide-y divide-slate-100 p-0">
            {d.missed.map((q, i) => (
              <li key={q.key} className="print-box flex items-center gap-3 py-2 text-sm">
                <span className="w-5 text-right text-xs font-bold text-slate-400">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-slate-900">{q.text ?? `Асуулт ${q.questionId}`}</p>
                  <p className="truncate text-xs text-slate-500">Хичээл: {q.lessonId} · {q.attempts} хариулт</p>
                </div>
                <div className="w-28 shrink-0">
                  <p className="text-right text-sm font-bold tabular-nums" style={{ color: C.bad }}>{q.wrongPct}% буруу</p>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ background: C.track }}><div className="h-full" style={{ width: `${q.wrongPct}%`, background: C.bad }} /></div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Шилдэг сурагчид" hint={pts ? "Оноогоор, 10 хүртэл." : undefined}>
          <RankTable rows={d.top.map((t) => ({ id: t.userId, rank: t.rank, name: t.name, value: t.points, delta: t.delta, percentile: t.percentile, badge: t.isDemo ? DEMO_BADGE_LABEL : undefined }))} unit=" оноо" empty={pts ? "Оноотой сурагч хараахан алга." : "Оноо тооцоолол идэвхжээгүй байна."} />
        </Section>
        <Section title="Анхаарах сурагчид" hint="7+ хоног идэвхгүй, ирц 70%-иас доош, сүүлийн шалгалтад тэнцээгүй.">
          {d.attention.length === 0 ? <Empty>Анхаарах сурагч алга — сайн байна.</Empty> : (
            <ul className="m-0 list-none divide-y divide-slate-100 p-0">
              {d.attention.map((p) => (
                <li key={p.id} className="print-box py-2">
                  <p className="text-sm font-semibold text-slate-900">{p.name} <span className="font-normal text-slate-500">· {p.className}</span></p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {p.reasons.map((r) => <span key={r} className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">{r}</span>)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Ирц" hint="Сүүлийн 90 хоногийн бүртгэл, анги бүрээр.">
        {attRows.length === 0 ? <Empty>Ирц бүртгэгдээгүй байна.</Empty> : (
          <div className="flex flex-col gap-3">
            {attRows.map((c) => (
              <div key={c.classroomId} className="print-box grid grid-cols-[120px_1fr_48px] items-center gap-3 text-sm">
                <span className="truncate text-slate-700">{c.name}</span>
                <DistributionBar height={12} ariaLabel={`${c.name} ирц`} segments={[
                  { label: "Ирсэн", value: c.attendance.present, color: "#047857" },
                  { label: "Хоцорсон", value: c.attendance.late, color: "#fbbf24" },
                  { label: "Тасалсан", value: c.attendance.absent, color: "#dc2626" },
                  { label: "Чөлөөтэй", value: c.attendance.excused, color: "#94a3b8" },
                ]} />
                <span className="text-right font-semibold tabular-nums" style={{ color: pctColor(c.attendancePct) }}>{fmtPct(c.attendancePct)}</span>
              </div>
            ))}
            <p className="flex flex-wrap gap-x-4 text-xs text-slate-600">
              {[["Ирсэн", "#047857"], ["Хоцорсон", "#fbbf24"], ["Тасалсан", "#dc2626"], ["Чөлөөтэй", "#94a3b8"]].map(([l, c]) => (
                <span key={l} className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: c }} />{l}</span>
              ))}
            </p>
          </div>
        )}
      </Section>

      <Section title="Шалгалтууд" hint="Ангийн сүүлийн 5 шалгалт. Өгөөгүй сурагчийг 0 гэж тооцоогүй.">
        {d.exams.length === 0 ? <Empty>Ангиар товлосон шалгалт алга.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                {["Анги", "Шалгалт", "Огноо", "Өгсөн", "Дундаж", "Тэнцсэн"].map((t, i) => <th key={t} className={`px-2 py-2 font-semibold ${i > 2 ? "text-right" : ""}`}>{t}</th>)}
              </tr></thead>
              <tbody>
                {d.exams.map((e) => (
                  <tr key={e.examId} className="print-box border-b border-slate-100">
                    <td className="px-2 py-2 font-semibold text-slate-900">{e.classroomName}</td>
                    <td className="px-2 py-2 text-slate-700">{e.title}</td>
                    <td className="px-2 py-2 text-slate-500">{e.date ?? "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{e.sat}/{e.total}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{fmtPct(e.avgPct)}</td>
                    <td className="px-2 py-2 text-right font-semibold tabular-nums" style={{ color: pctColor(e.passPct) }}>{fmtPct(e.passPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {data.warnings.length > 0 ? (
        <details className="text-xs text-slate-500" data-print-hide>
          <summary className="cursor-pointer">Зарим өгөгдлийг уншиж чадсангүй ({data.warnings.length})</summary>
          <ul className="mt-1 list-disc pl-5">{[...new Set(data.warnings)].slice(0, 12).map((w) => <li key={w}>{w}</li>)}</ul>
        </details>
      ) : null}
    </div>
  );
}
