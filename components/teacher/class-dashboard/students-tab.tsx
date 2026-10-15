"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { C } from "@/components/charts";
import { compareNullable, type StudentInsight } from "@/lib/teacher/class-insights";
import { GradeChip, Pct, TrendBadge, WeakAreaChip, formatLastActive } from "./shared";

type Key =
  | "name"
  | "grade"
  | "points"
  | "accuracy"
  | "weak"
  | "last"
  | "att"
  | "trend";

const GRADE_ORDER: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, F: 1, unrated: 0 };

const COLS: { key: Key; label: string; num?: boolean }[] = [
  { key: "name", label: "Сурагч" },
  { key: "grade", label: "Зэрэг" },
  { key: "points", label: "Оноо · байр", num: true },
  { key: "accuracy", label: "Зөв хариулт", num: true },
  { key: "weak", label: "Сул тал" },
  { key: "last", label: "Сүүлд идэвхтэй" },
  { key: "att", label: "Ирц", num: true },
  { key: "trend", label: "7 хоног", num: true },
];

function value(s: StudentInsight, key: Key): number | string | null {
  switch (key) {
    case "name":
      return s.name;
    case "grade":
      return s.gradeScore ?? GRADE_ORDER[s.grade] - 10;
    case "points":
      return s.points;
    case "accuracy":
      return s.accuracy;
    case "weak":
      return s.weakAreaAccuracy;
    case "last":
      return s.lastActiveAt ? new Date(s.lastActiveAt).getTime() : null;
    case "att":
      return s.attendancePct;
    case "trend":
      return s.trend;
  }
}

type Props = {
  classroomId: string;
  students: StudentInsight[];
  unlinkedCount: number;
};

export function StudentsTab({ classroomId, students, unlinkedCount }: Props) {
  const router = useRouter();
  const [key, setKey] = useState<Key>("points");
  const [dir, setDir] = useState<1 | -1>(-1);

  const rows = useMemo(() => {
    return [...students].sort((a, b) => {
      const x = value(a, key);
      const y = value(b, key);
      if (typeof x === "string" && typeof y === "string") return x.localeCompare(y, "mn") * dir;
      return compareNullable(x as number | null, y as number | null, dir);
    });
  }, [students, key, dir]);

  function sortBy(next: Key) {
    if (next === key) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setKey(next);
      setDir(next === "name" ? 1 : -1);
    }
  }

  function open(userId: string) {
    router.push(`/teacher/classes/${classroomId}/students/${userId}`);
  }

  if (students.length === 0) {
    return (
      <p className="rounded-xl bg-white p-5 text-sm text-slate-600 ring-1 ring-slate-200">
        Апп-д холбогдсон сурагч алга. Сурагчдыг урих эсвэл нэгдэх кодоор нэмнэ үү.
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              {COLS.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`px-3 py-2.5 font-semibold ${c.num ? "text-right" : ""}`}
                  aria-sort={key === c.key ? (dir === 1 ? "ascending" : "descending") : "none"}
                >
                  <button
                    type="button"
                    onClick={() => sortBy(c.key)}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    {c.label}
                    <span aria-hidden="true" className="text-[10px]" style={{ color: key === c.key ? C.brand : C.muted }}>
                      {key === c.key ? (dir === 1 ? "▲" : "▼") : "↕"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr
                key={s.userId}
                tabIndex={0}
                onClick={() => open(s.userId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") open(s.userId);
                }}
                className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-emerald-50/50 focus:bg-emerald-50/50 focus:outline-none"
              >
                <td className="px-3 py-2.5 font-medium text-slate-900" translate="no">
                  {s.name}
                </td>
                <td className="px-3 py-2.5">
                  <GradeChip grade={s.grade} />
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  <b>{s.points.toLocaleString("en-US")}</b>
                  <span className="text-slate-500"> · {s.rank != null ? `#${s.rank}` : "—"}</span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Pct value={s.accuracy} />
                </td>
                <td className="px-3 py-2.5">
                  <WeakAreaChip area={s.weakArea} />
                </td>
                <td className="px-3 py-2.5 text-slate-600">{formatLastActive(s.lastActiveAt)}</td>
                <td className="px-3 py-2.5 text-right">
                  <Pct value={s.attendancePct} />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <TrendBadge delta={s.last7d === 0 && s.prev7d === 0 ? null : s.trend} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Зэрэг: A–F нь сүүлийн дасгал, даалгаврын гүйцэтгэл, үгийн сангаар. «Сул тал» нь
        дор хаяж 10 хариулттай үед л гарна. Мөр дарж сурагчийн дэлгэрэнгүйг үзнэ.
        {unlinkedCount > 0
          ? ` ${unlinkedCount} сурагч апп-д холбогдоогүй тул жагсаалтад ороогүй.`
          : ""}
      </p>
    </div>
  );
}
