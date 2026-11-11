"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { curriculumCourseLabel, type Classroom } from "@/lib/classroom/types";
import { getTeacherClassrooms } from "@/lib/supabase/classrooms";

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-white"
      title="Дарж хуулна"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
        Ангийн код
      </span>
      <span className="font-mono text-base font-bold tracking-[0.2em]">{code}</span>
      <span className="text-xs text-emerald-300">{copied ? "хууллаа ✓" : "хуулах"}</span>
    </button>
  );
}

export function TeacherClassesList() {
  const [classrooms, setClassrooms] = useState<Classroom[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void getTeacherClassrooms().then(({ data, error: loadError }) => {
      if (!alive) return;
      setError(loadError);
      setClassrooms(data ?? []);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <TeacherShell active="help" showBottomNav={false}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Миний ангиуд</h1>
          <p className="text-sm text-slate-600">
            Анги дээр дарж сурагчид, ахиц, даалгаврыг нь харна.
          </p>
        </div>
        <Link
          href="/teacher/classes/new"
          className="inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
        >
          + Шинэ анги үүсгэх
        </Link>
      </header>

      {classrooms === null ? (
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : classrooms.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-4xl" aria-hidden>
            👥
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            Одоогоор анги үүсгээгүй байна
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Анги үүсгэхэд 6 оронтой код гарна. Тэр кодыг сурагчдадаа өгвөл тэд апп
            дээрээ кодоо оруулаад таны ангид нэгдэнэ.
          </p>
          <Link
            href="/teacher/classes/new"
            className="mt-4 inline-flex rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white"
          >
            + Эхний ангиа үүсгэх
          </Link>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classrooms.map((cls) => (
            <article
              key={cls.id}
              className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-slate-900" translate="no">
                    {cls.name}
                  </h2>
                  <p className="text-sm text-emerald-700">
                    {[
                      ...new Set(
                        [cls.level, curriculumCourseLabel(cls.curriculumCourseId)]
                          .filter(Boolean)
                          .map((v) => String(v).trim())
                      ),
                    ].join(" · ") || "Түвшин заагаагүй"}
                  </p>
                </div>
                {cls.status === "archived" ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    Архивласан
                  </span>
                ) : null}
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">Сурагч</dt>
                  <dd className="text-2xl font-bold tabular-nums text-slate-900">
                    {cls.studentCount ?? 0}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">Өгсөн даалгавар</dt>
                  <dd className="text-2xl font-bold tabular-nums text-slate-900">
                    {cls.assignmentCount ?? 0}
                  </dd>
                </div>
              </dl>

              {cls.joinCode ? (
                <div className="mt-3">
                  <CopyCode code={cls.joinCode} />
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/teacher/classes/${cls.id}`}
                  className="flex-1 rounded-full bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Анги нээх →
                </Link>
                <Link
                  href={`/teacher/assignments/new?classroom=${cls.id}`}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Даалгавар өгөх
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </TeacherShell>
  );
}
