import Link from "next/link";

import type { AdminOverview, CourseOverviewRow } from "@/lib/supabase/admin-overview";

/** Хувийн зурвас — ногоон (≥90), шар (≥50), улаан. */
function barColor(p: number): string {
  if (p >= 90) return "bg-emerald-500";
  if (p >= 50) return "bg-amber-400";
  return "bg-rose-400";
}

export function PercentBar({
  pct,
  label,
  hint,
  href,
}: {
  pct: number;
  label: string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 shrink-0 truncate text-sm font-medium text-slate-800">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-11 shrink-0 text-right text-sm font-bold tabular-nums text-slate-900">{pct}%</span>
      {hint ? <span className="hidden w-36 shrink-0 truncate text-xs text-slate-500 sm:inline">{hint}</span> : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block rounded-lg px-2 hover:bg-slate-50">
      {body}
    </Link>
  ) : (
    <div className="px-2">{body}</div>
  );
}

function BigStat({ value, label, sub, href }: { value: string; label: string; sub?: string; href: string }) {
  return (
    <Link href={href} className="admin-panel flex flex-col gap-1 p-4 transition hover:border-emerald-300 hover:shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-3xl font-bold tabular-nums text-slate-900">{value}</span>
      {sub ? <span className="text-xs text-slate-500">{sub}</span> : null}
      <span className="mt-1 text-xs font-semibold text-emerald-700">Дэлгэрэнгүй →</span>
    </Link>
  );
}

function CourseGroup({ title, rows }: { title: string; rows: CourseOverviewRow[] }) {
  if (rows.length === 0) return null;
  const total = rows.reduce((s, r) => s + r.total, 0);
  const avail = rows.reduce((s, r) => s + r.available, 0);
  const p = total ? Math.round((avail / total) * 100) : 0;
  return (
    <details className="admin-panel p-4" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="font-bold text-slate-900">{title}</span>
        <span className="text-sm text-slate-600">
          {avail}/{total} хичээл нийтлэгдсэн · <b className="text-slate-900">{p}%</b>
        </span>
      </summary>
      <div className="mt-3 divide-y divide-slate-100">
        {rows.map((r) => (
          <PercentBar
            key={r.courseId}
            pct={r.pct}
            label={r.title}
            hint={`${r.available} бэлэн · ${r.draft} ноорог${r.archived ? ` · ${r.archived} архив` : ""}`}
            href={`/admin/lessons?q=${encodeURIComponent(r.courseId)}`}
          />
        ))}
      </div>
    </details>
  );
}

export function AdminOverviewPanel({ data }: { data: AdminOverview }) {
  const groups: { title: string; family: CourseOverviewRow["family"] }[] = [
    { title: "HSK (насанд хүрэгчид)", family: "HSK" },
    { title: "YCT (хүүхэд)", family: "YCT" },
    { title: "发展汉语 (их сургууль)", family: "发展汉语" },
    { title: "Бусад курс", family: "Бусад" },
  ];
  const mockWithTests = data.mock.filter((m) => m.tests > 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Гол 4 тоо — дарахад тухайн хуудас руу орно */}
      <section aria-label="Нэг харцаар" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <BigStat
          label="Хичээл нийтлэгдсэн"
          value={`${data.coursesTotal.pct}%`}
          sub={`${data.coursesTotal.available} / ${data.coursesTotal.total} хичээл`}
          href="/admin/lessons"
        />
        <BigStat
          label="Шалгалтын тайлбар"
          value={`${data.mockTotal.explainedPct}%`}
          sub={`${data.mockTotal.tests} тест · ${data.mockTotal.questions} асуулт`}
          href="/admin/mock-tests/tutor-notes"
        />
        <BigStat
          label="Засагдаагүй алдаа"
          value={String(data.feedback.open)}
          sub={`нийт ${data.feedback.total} мэдээлэл`}
          href="/admin/feedback"
        />
        <BigStat label="Суралцагчид" value="→" sub="Үнэлгээ, идэвх, бүлэг" href="/admin/learners" />
      </section>

      {/* Контент курс бүрээр */}
      <section aria-labelledby="ov-courses" className="flex flex-col gap-3">
        <div>
          <h2 id="ov-courses" className="admin-section-title">Хичээлийн бэлэн байдал — курс бүрээр</h2>
          <p className="admin-section-desc">Хувь = нийтлэгдсэн хичээл / нийт хичээл. Мөрөн дээр дарвал тухайн курсын жагсаалт нээгдэнэ.</p>
        </div>
        {groups.map((g) => (
          <CourseGroup key={g.family} title={g.title} rows={data.courses.filter((r) => r.family === g.family)} />
        ))}
      </section>

      {/* Загвар шалгалт түвшин бүрээр */}
      <section aria-labelledby="ov-mock" className="admin-panel p-4">
        <h2 id="ov-mock" className="admin-section-title">Загвар шалгалт (真题) — түвшин бүрээр</h2>
        <p className="admin-section-desc">Тайлбар = монгол тайлбартай асуултын хувь · Багш = «хувийн багш» тэмдэглэлтэй · Аудио = сонсголын асуулт аудио хэсэгтэй.</p>
        {mockWithTests.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Шалгалт оруулаагүй байна.</p>
        ) : (
          <div className="admin-table-wrap mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Түвшин</th>
                  <th className="py-2 pr-3">Тест</th>
                  <th className="py-2 pr-3">Асуулт</th>
                  <th className="py-2 pr-3">Тайлбар</th>
                  <th className="py-2 pr-3">Багш</th>
                  <th className="py-2 pr-3">Аудио</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockWithTests.map((m) => (
                  <tr key={m.level} className="hover:bg-slate-50">
                    <td className="py-2 pr-3 font-semibold text-slate-900">
                      <Link href={`/admin/mock-tests/tutor-notes?level=${m.level}`} className="hover:text-emerald-700">
                        HSK {m.level}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{m.tests}</td>
                    <td className="py-2 pr-3 tabular-nums">{m.questions}</td>
                    <td className="py-2 pr-3"><MiniPct p={m.explainedPct} /></td>
                    <td className="py-2 pr-3"><MiniPct p={m.tutorPct} /></td>
                    <td className="py-2 pr-3"><MiniPct p={m.audioPct} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {data.warnings.length > 0 ? (
        <p className="text-xs text-amber-700">{data.warnings.join(" · ")}</p>
      ) : null}
    </div>
  );
}

function MiniPct({ p }: { p: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <span className={`block h-full ${barColor(p)}`} style={{ width: `${p}%` }} />
      </span>
      <span className="tabular-nums font-semibold text-slate-800">{p}%</span>
    </span>
  );
}
