"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatLastActive } from "@/components/teacher/class-dashboard/shared";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { useTeacherAuth } from "@/components/teacher/teacher-auth-gate";
import { WeeklyReportToggle } from "@/components/teacher/weekly-report-toggle";
import { useWorkspaceRole } from "@/components/workspace/workspace-context";
import type { Classroom } from "@/lib/classroom/types";
import { getTeacherClassrooms } from "@/lib/supabase/classrooms";
import {
  getClassroomProgressAnalytics,
  getClassroomStudentProgress,
} from "@/lib/supabase/teacher-analytics";
import type {
  ClassroomProgressAnalytics,
  StudentProgressRow,
} from "@/lib/teacher/analytics-types";

type Tab = "class" | "student" | "parent" | "certificate";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "class", label: "Анги", icon: "👥" },
  { key: "student", label: "Сурагч", icon: "🧑‍🎓" },
  { key: "parent", label: "Эцэг эхэд", icon: "👪" },
  { key: "certificate", label: "Гэрчилгээ", icon: "🎖" },
];

function CopyButton({ text, label = "Бичвэрийг хуулах" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
    >
      {copied ? "Хууллаа ✓" : label}
    </button>
  );
}

/** Ангийн тоог энгийн үгээр тайлбарлана. Тоо зохиохгүй — байхгүй бол хэлэхгүй. */
function classSummaryLines(
  name: string,
  a: ClassroomProgressAnalytics,
  students: StudentProgressRow[]
): string[] {
  const lines: string[] = [];
  const linked = students.filter((s) => s.studentUserId);
  lines.push(
    `«${name}» ангид ${a.totalStudents} сурагч бүртгэлтэй${
      linked.length < a.totalStudents
        ? `, үүнээс ${linked.length} нь апп-д нэвтэрсэн`
        : ""
    }.`
  );
  if (a.totalStudents > 0) {
    lines.push(`${a.activeStudents} сурагч идэвхтэй суралцаж байна.`);
  }
  if (a.assignmentsCount > 0) {
    const verdict =
      a.completionRate >= 80
        ? "маш сайн"
        : a.completionRate >= 50
          ? "дунд зэрэг"
          : "сул — сануулах хэрэгтэй";
    lines.push(
      `Нийт ${a.assignmentsCount} даалгавар өгсөн, гүйцэтгэл ${a.completionRate}% (${verdict}).`
    );
  } else {
    lines.push("Одоогоор даалгавар өгөөгүй.");
  }
  if (a.averageQuizPercentage != null) {
    const verdict =
      a.averageQuizPercentage >= 80
        ? "сайн ойлгож байна"
        : a.averageQuizPercentage >= 60
          ? "дунд зэрэг ойлгож байна"
          : "ойлголт сул — давтлага хэрэгтэй";
    lines.push(`Дасгалын дундаж оноо ${a.averageQuizPercentage}% — ${verdict}.`);
  }
  const noWork = linked.filter((s) => s.assignmentsAssigned > 0 && s.assignmentsCompleted === 0);
  if (noWork.length > 0) {
    lines.push(
      `Нэг ч даалгавар хийгээгүй: ${noWork
        .slice(0, 6)
        .map((s) => s.displayName)
        .join(", ")}${noWork.length > 6 ? "…" : ""}.`
    );
  }
  const best = [...linked]
    .filter((s) => s.assignmentsAssigned > 0)
    .sort((x, y) => y.completionRate - x.completionRate)[0];
  if (best && best.completionRate > 0) {
    lines.push(`Хамгийн идэвхтэй: ${best.displayName} (${best.completionRate}%).`);
  }
  return lines;
}

function parentMessage(className: string, s: StudentProgressRow): string {
  const parts: string[] = [];
  parts.push(`Сайн байна уу? ${s.displayName}-ийн хятад хэлний сурлагын мэдээ («${className}» анги):`);
  if (s.assignmentsAssigned > 0) {
    parts.push(
      `• Даалгавар: ${s.assignmentsAssigned}-аас ${s.assignmentsCompleted}-ийг хийсэн (${s.completionRate}%).`
    );
  } else {
    parts.push("• Одоогоор даалгавар өгөөгүй байна.");
  }
  if (s.latestQuizPercentage != null) {
    parts.push(`• Сүүлийн дасгалын оноо: ${s.latestQuizPercentage}%.`);
  }
  if (s.learnedWordsCount != null && s.learnedWordsCount > 0) {
    parts.push(`• Сурсан үг: ${s.learnedWordsCount}.`);
  }
  parts.push(
    s.lastActivityAt
      ? `• Апп-д сүүлд орсон: ${formatLastActive(s.lastActivityAt).toLowerCase()}.`
      : "• Апп-д хараахан ороогүй байна."
  );
  const advice =
    s.assignmentsAssigned > 0 && s.completionRate < 50
      ? "Даалгавраа тогтмол хийхэд нь гэртээ дэмжиж, өдөрт 15 минут гаргуулж өгнө үү."
      : s.latestQuizPercentage != null && s.latestQuizPercentage < 60
        ? "Хичээлээ хийж байгаа ч оноо нь доогуур байна. Үгээ чангаар уншиж давтахад нь тусална уу."
        : "Сайн суралцаж байна. Энэ хэвээр нь үргэлжлүүлэхийг дэмжээрэй.";
  parts.push("", advice, "Баярлалаа. — Багш");
  return parts.join("\n");
}

export function TeacherReportsView() {
  const { loggedIn } = useTeacherAuth();
  const role = useWorkspaceRole();
  const [tab, setTab] = useState<Tab>("class");
  const [classes, setClasses] = useState<Classroom[] | null>(null);
  const [classId, setClassId] = useState("");
  const [analytics, setAnalytics] = useState<ClassroomProgressAnalytics | null>(null);
  const [students, setStudents] = useState<StudentProgressRow[]>([]);
  const [studentRowId, setStudentRowId] = useState("");
  const [loadingClass, setLoadingClass] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;
    let alive = true;
    void getTeacherClassrooms().then(({ data }) => {
      if (!alive) return;
      const list = data ?? [];
      setClasses(list);
      setClassId((prev) => prev || list[0]?.id || "");
    });
    return () => {
      alive = false;
    };
  }, [loggedIn]);

  useEffect(() => {
    if (!classId) return;
    let alive = true;
    void (async () => {
      setLoadingClass(true);
      const [a, p] = await Promise.all([
        getClassroomProgressAnalytics(classId),
        getClassroomStudentProgress(classId),
      ]);
      if (!alive) return;
      setAnalytics(a.data);
      setStudents(p.data ?? []);
      setStudentRowId((p.data ?? [])[0]?.studentRowId ?? "");
      setLoadingClass(false);
    })();
    return () => {
      alive = false;
    };
  }, [classId]);

  const selectedClass = classes?.find((c) => c.id === classId) ?? null;
  const summary = useMemo(
    () =>
      selectedClass && analytics
        ? classSummaryLines(selectedClass.name, analytics, students)
        : [],
    [selectedClass, analytics, students]
  );
  const student = students.find((s) => s.studentRowId === studentRowId) ?? null;
  const parentText =
    selectedClass && student ? parentMessage(selectedClass.name, student) : "";

  if (loggedIn === null || (loggedIn && classes === null)) {
    return (
      <TeacherShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      </TeacherShell>
    );
  }

  if (!loggedIn) {
    return (
      <TeacherShell active="help" showBottomNav={false}>
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold">Тайлан</h1>
          <p className="mt-2 text-sm text-slate-600">Тайлан харахын тулд нэвтэрнэ үү.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
          >
            Нэвтрэх
          </Link>
        </section>
      </TeacherShell>
    );
  }

  const classPicker =
    classes && classes.length > 0 ? (
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-slate-700">Анги:</span>
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
    ) : null;

  const noClass = (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <p className="text-sm text-slate-600">
        Тайлан гаргахын тулд эхлээд анги үүсгэж, сурагчдаа нэмнэ үү.
      </p>
      <Link
        href="/teacher/classes/new"
        className="mt-3 inline-flex rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
      >
        + Анги үүсгэх
      </Link>
    </section>
  );

  return (
    <TeacherShell active="help" showBottomNav={false}>
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Тайлан</h1>
        <p className="text-sm text-slate-600">
          Тоонуудыг энгийн үгээр тайлбарласан. Хуулаад шууд илгээж болно.
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 ${
              tab === t.key
                ? "bg-slate-900 text-white ring-slate-900"
                : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            <span aria-hidden>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ---------- АНГИ ---------- */}
      {tab === "class" ? (
        !selectedClass ? (
          noClass
        ) : (
          <>
            {classPicker}
            {loadingClass || !analytics ? (
              <p className="text-sm text-slate-600">Ачаалж байна…</p>
            ) : (
              <>
                <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                  <h2 className="text-base font-bold text-slate-900">
                    Товч дүгнэлт — энгийн үгээр
                  </h2>
                  <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-6 text-slate-800">
                    {summary.map((line) => (
                      <li key={line} translate="no">
                        • {line}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <CopyButton text={summary.join("\n")} label="Дүгнэлтийг хуулах" />
                    <Link
                      href={`/teacher/classes/${selectedClass.id}/report`}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                    >
                      🖨 Хэвлэх тайлан (PDF) нээх
                    </Link>
                    <Link
                      href={`/teacher/classes/${selectedClass.id}`}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                    >
                      Ангийн хуудас →
                    </Link>
                  </div>
                </section>

                <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { label: "Сурагч", value: String(analytics.totalStudents) },
                    { label: "Идэвхтэй сурагч", value: String(analytics.activeStudents) },
                    { label: "Даалгаврын гүйцэтгэл", value: `${analytics.completionRate}%` },
                    {
                      label: "Дасгалын дундаж",
                      value:
                        analytics.averageQuizPercentage != null
                          ? `${analytics.averageQuizPercentage}%`
                          : "—",
                    },
                  ].map((m) => (
                    <div key={m.label} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                      <p className="text-xs text-slate-500">{m.label}</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                        {m.value}
                      </p>
                    </div>
                  ))}
                </section>
              </>
            )}
            <WeeklyReportToggle />
          </>
        )
      ) : null}

      {/* ---------- СУРАГЧ ---------- */}
      {tab === "student" ? (
        !selectedClass ? (
          noClass
        ) : (
          <>
            {classPicker}
            {loadingClass ? (
              <p className="text-sm text-slate-600">Ачаалж байна…</p>
            ) : students.length === 0 ? (
              <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                Энэ ангид сурагч алга.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                      <th className="px-3 py-2.5 font-semibold">Сурагч</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Даалгавар</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Сүүлийн оноо</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Сурсан үг</th>
                      <th className="px-3 py-2.5 font-semibold">Сүүлд орсон</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.studentRowId} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2.5 font-semibold text-slate-900" translate="no">
                          {s.displayName}
                          {!s.studentUserId ? (
                            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              апп-д нэвтрээгүй
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {s.assignmentsAssigned > 0
                            ? `${s.assignmentsCompleted}/${s.assignmentsAssigned}`
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {s.latestQuizPercentage != null ? `${s.latestQuizPercentage}%` : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {s.learnedWordsCount ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {s.lastActivityAt ? formatLastActive(s.lastActivityAt) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {s.studentUserId ? (
                            <Link
                              href={`/teacher/classes/${selectedClass.id}/students/${s.studentUserId}`}
                              className="whitespace-nowrap text-xs font-semibold text-emerald-700 hover:underline"
                            >
                              Дэлгэрэнгүй →
                            </Link>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )
      ) : null}

      {/* ---------- ЭЦЭГ ЭХЭД ---------- */}
      {tab === "parent" ? (
        !selectedClass ? (
          noClass
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4">
              {classPicker}
              {students.length > 0 ? (
                <label className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-700">Сурагч:</span>
                  <select
                    value={studentRowId}
                    onChange={(e) => setStudentRowId(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2"
                  >
                    {students.map((s) => (
                      <option key={s.studentRowId} value={s.studentRowId}>
                        {s.displayName}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
            {!student ? (
              <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                Энэ ангид сурагч алга.
              </p>
            ) : (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900">
                  Эцэг эхэд илгээх бэлэн бичвэр
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Хуулаад Facebook, Viber, мессежээр илгээнэ. Илгээхээсээ өмнө хүссэнээрээ засаж болно.
                </p>
                <pre
                  className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-sans text-sm leading-6 text-slate-800"
                  translate="no"
                >
                  {parentText}
                </pre>
                <div className="mt-3">
                  <CopyButton text={parentText} />
                </div>
              </section>
            )}
          </>
        )
      ) : null}

      {/* ---------- ГЭРЧИЛГЭЭ ---------- */}
      {tab === "certificate" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">🎖 Гэрчилгээ</h2>
          <p className="mt-1 text-sm text-slate-600">
            Курсээ дүүргэсэн сурагчид нэр, курс, огноотой гэрчилгээ хэвлэж өгнө.
          </p>
          {role === "admin" ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/admin/center/certificate"
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Гэрчилгээ хэвлэх →
              </Link>
              <Link
                href="/admin/center/report"
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Төвийн нэгдсэн тайлан (хэвлэх)
              </Link>
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Гэрчилгээг одоогоор сургалтын төвийн админ хэвлэнэ. Админдаа хандана уу.
            </p>
          )}
        </section>
      ) : null}

      {role === "admin" ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-bold text-slate-700">Бусад тайлан (зөвхөн админд)</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href="/admin/analytics"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            >
              📈 Хичээл бүрийн гүйцэтгэл
            </Link>
            <Link
              href="/admin/center"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            >
              🏢 Бүлгүүдийг харьцуулах
            </Link>
            <Link
              href="/admin/learners"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            >
              🎓 Бүх суралцагч (A–F)
            </Link>
          </div>
        </section>
      ) : null}
    </TeacherShell>
  );
}
