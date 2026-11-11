"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { useWorkspaceRole } from "@/components/workspace/workspace-context";
import { ADMIN_NAV_SECTIONS } from "@/lib/admin/admin-nav";
import { TASK_GUIDES, type TaskGuide } from "@/lib/admin/task-guide";

const GROUPS: TaskGuide["group"][] = [
  "Анги, сурагч",
  "Даалгавар",
  "Тайлан",
  "Хичээлийн сан",
  "Бусад",
];

export function TaskGuideView() {
  const role = useWorkspaceRole();
  const isAdmin = role === "admin";
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const tasks = useMemo(
    () =>
      TASK_GUIDES.filter((t) => isAdmin || !t.adminOnly).filter((t) => {
        if (!q) return true;
        const hay = `${t.want} ${t.keywords} ${t.steps.join(" ")}`.toLowerCase();
        return q.split(/\s+/).every((word) => hay.includes(word));
      }),
    [q, isAdmin]
  );

  return (
    <TeacherShell active="help" showBottomNav={false}>
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Заавар</h1>
        <p className="text-sm text-slate-600">
          Юу хийхээ бичээд хай — алхам алхмаар заана.
        </p>
      </header>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
        <label className="flex flex-wrap items-center gap-3">
          <span className="text-base font-bold text-emerald-950">Би</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="даалгавар өгөх, сурагч нэмэх, тайлан…"
            className="min-w-0 flex-1 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-base"
            autoFocus
          />
          <span className="text-base font-bold text-emerald-950">хиймээр байна</span>
        </label>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 ring-1 ring-slate-200">
          «{query}» гэсэн заавар олдсонгүй. Өөр үгээр хайж үзээрэй (жишээ: «даалгавар», «код», «тайлан»).
        </p>
      ) : (
        GROUPS.map((group) => {
          const list = tasks.filter((t) => t.group === group);
          if (list.length === 0) return null;
          return (
            <section key={group}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                {group}
              </h2>
              <ul className="flex flex-col gap-2">
                {list.map((t) => {
                  const open = openId === t.id || (Boolean(q) && tasks.length <= 3);
                  return (
                    <li key={t.id} className="rounded-2xl bg-white ring-1 ring-slate-200">
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : t.id)}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      >
                        <span className="text-[15px] font-semibold text-slate-900">
                          Би <span className="text-emerald-700">{t.want}</span> хиймээр байна
                        </span>
                        <span className="shrink-0 text-sm text-slate-400">{open ? "▴" : "▾"}</span>
                      </button>
                      {open ? (
                        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                          <ol className="flex flex-col gap-2">
                            {t.steps.map((step, i) => (
                              <li key={step} className="flex gap-3 text-sm leading-6 text-slate-700">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                                  {i + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                          <Link
                            href={t.go.href}
                            className="mt-3 inline-flex rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                          >
                            {t.go.label} руу очих →
                          </Link>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-bold text-slate-900">Зүүн цэсэнд юу хаана байдаг вэ?</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {ADMIN_NAV_SECTIONS.map((section) => {
            const items = section.items.filter((i) => isAdmin || !i.adminOnly);
            if (items.length === 0) return null;
            return (
              <div key={section.title}>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  {section.title}
                </p>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {items.map((i) => (
                    <li key={i.href} className="text-sm">
                      <Link href={i.href} className="font-semibold text-slate-900 hover:text-emerald-700">
                        <span aria-hidden>{i.icon}</span> {i.label}
                      </Link>
                      {i.hint ? <p className="text-xs leading-5 text-slate-500">{i.hint}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        {isAdmin ? (
          <p className="mt-4 text-xs text-slate-500">
            Хичээл оруулах, нийтлэх зэрэг админы дэлгэрэнгүй заавар:{" "}
            <Link href="/admin/guide" className="font-semibold text-emerald-700 hover:underline">
              Админы заавар →
            </Link>
          </p>
        ) : null}
      </section>
    </TeacherShell>
  );
}
