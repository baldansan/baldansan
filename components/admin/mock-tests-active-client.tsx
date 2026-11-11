"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type TestLite = {
  id: string;
  title: string;
  hsk_level: number;
  total_questions: number;
  is_active: boolean;
};

type Props = { tests: TestLite[] };

/** /admin/mock-tests — тестүүдийг түвшнээр жагсааж нуух/харуулах. */
export function MockTestsActiveClient({ tests: initial }: Props) {
  const [tests, setTests] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<number>(1);

  const byLevel = useMemo(() => {
    const m = new Map<number, TestLite[]>();
    for (const t of tests) {
      const arr = m.get(t.hsk_level) ?? [];
      arr.push(t);
      m.set(t.hsk_level, arr);
    }
    return m;
  }, [tests]);

  async function toggle(t: TestLite) {
    setBusy(t.id);
    setError(null);
    const res = await fetch("/api/admin/mock-tests/active", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: t.id, is_active: !t.is_active }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setBusy(null);
    if (!res.ok || !data.ok) {
      setError(data.error ?? `Сервер ${res.status}`);
      return;
    }
    setTests((prev) => prev.map((x) => (x.id === t.id ? { ...x, is_active: !t.is_active } : x)));
  }

  const list = byLevel.get(level) ?? [];
  const activeCount = list.filter((t) => t.is_active).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map((lvl) => {
          const arr = byLevel.get(lvl) ?? [];
          const on = arr.filter((t) => t.is_active).length;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevel(lvl)}
              className={`rounded-full px-3 py-1.5 text-sm font-bold ring-1 ${
                level === lvl ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200"
              }`}
            >
              HSK {lvl} · {on}/{arr.length}
            </button>
          );
        })}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <p className="text-sm text-slate-600">
        HSK {level}: {activeCount} идэвхтэй / {list.length} нийт. Унтраасан тест суралцагчийн жагсаалт, өнөөдрийн
        сонсголд гарахгүй; өгөгдөл хадгалагдана.
      </p>

      <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-100">
        {list.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className={`text-sm font-bold ${t.is_active ? "text-slate-900" : "text-slate-400"}`}>
                {t.id}{" "}
                <span className="text-xs font-normal text-slate-500">
                  · {t.total_questions} асуулт
                </span>
              </p>
              <p className="truncate text-xs text-slate-500">{t.title}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link href={`/review/practice/${t.id}`} className="text-xs font-bold text-emerald-700 underline">
                нээх
              </Link>
              <button
                type="button"
                disabled={busy === t.id}
                onClick={() => void toggle(t)}
                className={`min-w-[88px] rounded-full px-3 py-1.5 text-xs font-extrabold ${
                  t.is_active ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-500"
                }`}
              >
                {busy === t.id ? "…" : t.is_active ? "Идэвхтэй" : "Нуусан"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
