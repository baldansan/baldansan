"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { isCustomAssignment, type Assignment } from "@/lib/classroom/types";
import { getTeacherAssignments } from "@/lib/supabase/classrooms";
import { getTeacherAssignmentSummary } from "@/lib/supabase/teacher-analytics";
import type { TeacherAssignmentSummaryItem } from "@/lib/teacher/analytics-types";

const TYPE_LABELS: Record<string, string> = {
  full_lesson: "Бүтэн хичээл",
  watch: "Бичлэг үзэх",
  vocabulary: "Үг цээжлэх",
  quiz: "Дасгал",
  review: "Давталт",
};

type Tab = "open" | "done" | "curriculum";

function formatDue(iso: string | null): { text: string; late: boolean } {
  if (!iso) return { text: "Хугацаагүй", late: false };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { text: "Хугацаагүй", late: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return {
    text: `${d.getMonth() + 1}-р сарын ${d.getDate()} хүртэл`,
    late: d.getTime() < today.getTime(),
  };
}

export function TeacherAssignmentsList() {
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [summary, setSummary] = useState<Map<string, TeacherAssignmentSummaryItem>>(
    new Map()
  );
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("open");

  useEffect(() => {
    let alive = true;
    void Promise.all([getTeacherAssignments(), getTeacherAssignmentSummary()]).then(
      ([list, sum]) => {
        if (!alive) return;
        setError(list.error);
        setAssignments(list.data ?? []);
        setSummary(new Map((sum.data ?? []).map((s) => [s.assignmentId, s])));
      }
    );
    return () => {
      alive = false;
    };
  }, []);

  const groups = useMemo(() => {
    const all = assignments ?? [];
    const isDone = (a: Assignment) => {
      const s = summary.get(a.id);
      return Boolean(s && s.totalCount > 0 && s.completedCount >= s.totalCount);
    };
    return {
      open: all.filter((a) => !a.isCurriculum && !isDone(a)),
      done: all.filter((a) => !a.isCurriculum && isDone(a)),
      curriculum: all.filter((a) => a.isCurriculum),
    };
  }, [assignments, summary]);

  const list = groups[tab];
  const byClass = useMemo(() => {
    const map = new Map<string, { name: string; items: Assignment[] }>();
    for (const a of list) {
      const cur = map.get(a.classroomId);
      if (cur) cur.items.push(a);
      else map.set(a.classroomId, { name: a.classroomName ?? "Анги", items: [a] });
    }
    return [...map.entries()];
  }, [list]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "open", label: "Хийгдэж байгаа", count: groups.open.length },
    { key: "done", label: "Бүгд хийсэн", count: groups.done.length },
    { key: "curriculum", label: "Заавал хөтөлбөр", count: groups.curriculum.length },
  ];

  return (
    <TeacherShell active="help" showBottomNav={false}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Даалгавар</h1>
          <p className="text-sm text-slate-600">
            Таны өгсөн даалгаврууд — хэдэн сурагч хийснийг шууд харна.
          </p>
        </div>
        <Link
          href="/teacher/assignments/new"
          className="inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
        >
          📝 Даалгавар өгөх
        </Link>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${
              tab === t.key
                ? "bg-slate-900 text-white ring-slate-900"
                : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label} <span className="opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      {assignments === null ? (
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : list.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <p className="text-sm text-slate-600">
            {tab === "open"
              ? "Хийгдэж байгаа даалгавар алга."
              : tab === "done"
                ? "Бүх сурагч хийж дуусгасан даалгавар одоогоор алга."
                : "Ангид заавал хөтөлбөр тохируулаагүй байна. Ангийн хуудасны «Бүртгэл» хэсгээс тохируулна."}
          </p>
          {tab === "open" ? (
            <Link
              href="/teacher/assignments/new"
              className="mt-4 inline-flex rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
            >
              Даалгавар өгөх →
            </Link>
          ) : null}
        </section>
      ) : (
        byClass.map(([classId, group]) => (
          <section key={classId}>
            <h2 className="mb-2 text-sm font-bold text-slate-700">
              <Link
                href={`/teacher/classes/${classId}`}
                className="hover:text-emerald-700 hover:underline"
                translate="no"
              >
                👥 {group.name}
              </Link>{" "}
              <span className="font-normal text-slate-500">({group.items.length})</span>
            </h2>
            <ul className="flex flex-col gap-2">
              {group.items.map((a) => {
                const s = summary.get(a.id);
                const due = formatDue(a.dueDate);
                const total = s?.totalCount ?? 0;
                const done = s?.completedCount ?? 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <li key={a.id}>
                    <Link
                      href={`/teacher/assignments/${a.id}`}
                      className="flex flex-col gap-2 rounded-2xl bg-white p-4 ring-1 ring-slate-200 hover:ring-emerald-300 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900" translate="no">
                          {a.title}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                          <span>
                            {isCustomAssignment(a.lessonId)
                              ? "Багшийн өөрийн даалгавар"
                              : (TYPE_LABELS[a.assignmentType] ?? a.assignmentType)}
                          </span>
                          <span className={due.late && pct < 100 ? "font-semibold text-red-600" : ""}>
                            · {due.text}
                            {due.late && pct < 100 ? " (хугацаа дууссан)" : ""}
                          </span>
                          {a.targetStudentUserId ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900">
                              Зөвхөн нэг сурагчид
                            </span>
                          ) : null}
                          {a.attachment ? <span>· 📎 файлтай</span> : null}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 sm:w-64">
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : "bg-emerald-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-24 text-right text-xs font-semibold tabular-nums text-slate-700">
                          {total > 0 ? `${done}/${total} хийсэн` : "—"}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </TeacherShell>
  );
}
