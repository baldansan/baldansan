import { TEACHER_COMPARISON_CAVEAT } from "@/lib/reports/center-report";
import { mdRow } from "@/lib/reports/format";
import type { DashSnapshot } from "@/lib/organization/dashboard-types";

const p = (v: number | null) => (v == null ? "—" : `${Math.round(v)}%`);
const x = (v: number | null) => (v == null ? "—" : String(Math.round(v)));

export function buildDashboardMarkdown(name: string, d: DashSnapshot): string {
  const h = d.hero;
  const L: string[] = [
    `# ${name} — Захирлын самбар`,
    "",
    `Огноо: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "## Ерөнхий үзүүлэлт",
    "",
    `- Сурагч: ${h.students} · Багш: ${h.teachers} · Анги: ${h.classes}`,
    `- 7 хоногт идэвхтэй: ${p(h.activePct)}${h.activePctDelta == null ? "" : ` (${h.activePctDelta >= 0 ? "▲" : "▼"} ${Math.abs(h.activePctDelta)}%)`}`,
    `- Дундаж ирц: ${p(h.attendancePct)}`,
    `- Шалгалтад тэнцсэн: ${p(h.examPassPct)}`,
    `- 7 хоногийн оноо: ${x(h.pointsWeek)}`,
    `- Өнөөдөр идэвхтэй: ${h.activeToday}`,
    "",
    "## Анги бүрээр",
    "",
    "| Анги | Багш | Сурагч | Идэвх | Ирц | Шалгалт | Дасгал | Цаг | Оноо | Байр |",
    "|---|---|---|---|---|---|---|---|---|---|",
    ...d.classes.map((c) =>
      mdRow([c.name, c.teacherName, c.students, p(c.activePct), p(c.attendancePct), p(c.examAvgPct), p(c.quizAccuracyPct), c.hoursPerStudent ?? "—", x(c.avgPoints), c.pointsRank ?? "—"])
    ),
    "",
    "## Багш нарын үзүүлэлт",
    "",
    TEACHER_COMPARISON_CAVEAT,
    "",
    "| Багш | Анги | Сурагч | Дундаж оноо | Ирц | Шалгалт тэнцсэн | Даалгавар | Идэвх |",
    "|---|---|---|---|---|---|---|---|",
    ...d.teachers.map((t) =>
      mdRow([t.name, t.classes, t.students, x(t.avgPoints), p(t.attendancePct), p(t.examPassPct), p(t.completionPct), p(t.activePct)])
    ),
    "",
  ];
  if (d.weakAreas.length) {
    L.push("## Сул тал", "", ...d.weakAreas.map((a) => `- ${a.label}: зөв ${p(a.accuracyPct)} (${a.total} хариулт)`), "");
  }
  if (d.attention.length) {
    L.push("## Анхаарах сурагчид", "", ...d.attention.map((a) => `- ${a.name} (${a.className}): ${a.reasons.join(", ")}`), "");
  }
  if (d.exams.length) {
    L.push("## Сүүлийн шалгалтууд", "", ...d.exams.map((e) => `- ${e.classroomName} · ${e.title}: дундаж ${p(e.avgPct)}, тэнцсэн ${p(e.passPct)} (${e.sat}/${e.total})`), "");
  }
  return L.join("\n");
}
