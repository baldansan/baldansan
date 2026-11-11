import { createAnonServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Сурагчийн ахиц — Бөөндөө Сурцгаая",
  robots: { index: false, follow: false },
};

type ReportAssignment = {
  title: string;
  due_date: string | null;
  status: string;
  quiz_percentage: number | null;
  completed_at: string | null;
};

type Report = {
  studentName: string;
  className: string | null;
  assignments: ReportAssignment[];
  lastActiveAt: string | null;
  learnedWords: number;
  answers30d: number;
  correct30d: number;
};

function dayText(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}-р сарын ${d.getDate()}`;
}

function lastActiveText(iso: string | null, now: number): string {
  if (!iso) return "Хараахан ороогүй";
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (!Number.isFinite(days)) return "—";
  if (days <= 0) return "Өнөөдөр";
  if (days === 1) return "Өчигдөр";
  return `${days} өдрийн өмнө`;
}

async function loadReport(
  token: string
): Promise<{ report: Report | null; now: number }> {
  const now = Date.now();
  if (!/^[a-f0-9]{32,80}$/.test(token)) return { report: null, now };
  const client = createAnonServerSupabaseClient();
  if (!client) return { report: null, now };
  const { data, error } = await client.rpc("get_student_report", { p_token: token });
  if (error || !data) return { report: null, now };
  return { report: data as Report, now };
}

/** Эцэг эхийн холбоос: нэвтрэлтгүй, зөвхөн нэг сурагчийн ахицын хураангуй. */
export default async function ParentReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { report, now } = await loadReport(token);

  if (!report) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10 text-center">
        <p className="text-4xl">🔗</p>
        <h1 className="mt-3 text-xl font-bold text-slate-900">Холбоос хүчингүй байна</h1>
        <p className="mt-2 text-sm text-slate-600">
          Энэ холбоос буруу эсвэл устгагдсан байна. Багшаас шинэ холбоос авна уу.
        </p>
      </main>
    );
  }

  const done = report.assignments.filter((a) => a.status === "completed");
  const pending = report.assignments.filter((a) => a.status !== "completed");
  const total = report.assignments.length;
  const pct = total > 0 ? Math.round((done.length / total) * 100) : null;
  const accuracy =
    report.answers30d > 0 ? Math.round((report.correct30d / report.answers30d) * 100) : null;
  const inactiveDays = report.lastActiveAt
    ? Math.floor((now - new Date(report.lastActiveAt).getTime()) / 86_400_000)
    : null;

  const verdict =
    total > 0 && pending.length === 0
      ? { tone: "bg-emerald-50 border-emerald-200", text: "Бүх даалгавраа хийсэн. Сайн байна! 👏" }
      : inactiveDays == null || inactiveDays >= 7
        ? {
            tone: "bg-red-50 border-red-200",
            text: "Сүүлийн 7 хоногт апп-даа ороогүй байна. Өдөрт 15 минут гаргуулахад тань тусална уу.",
          }
        : pending.length > 0
          ? {
              tone: "bg-amber-50 border-amber-200",
              text: `${pending.length} даалгавар хийгээгүй байна. Доорх жагсаалтаас харна уу.`,
            }
          : { tone: "bg-emerald-50 border-emerald-200", text: "Тогтмол суралцаж байна." };

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-white px-4 py-8 text-slate-900 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
        Бөөндөө Сурцгаая · Эцэг эхэд
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight" translate="no">
        {report.studentName}
      </h1>
      {report.className ? (
        <p className="text-sm text-slate-600" translate="no">
          «{report.className}» анги · хятад хэл
        </p>
      ) : null}

      <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-6 ${verdict.tone}`}>
        {verdict.text}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs text-slate-500">Даалгавар</dt>
          <dd className="text-2xl font-bold tabular-nums">
            {total > 0 ? `${done.length}/${total}` : "—"}
          </dd>
          <p className="text-[11px] text-slate-500">{pct != null ? `${pct}% хийсэн` : "өгөөгүй"}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs text-slate-500">Апп-д сүүлд орсон</dt>
          <dd className="text-lg font-bold">{lastActiveText(report.lastActiveAt, now)}</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs text-slate-500">Зөв хариулт (30 хоног)</dt>
          <dd className="text-2xl font-bold tabular-nums">
            {accuracy != null ? `${accuracy}%` : "—"}
          </dd>
          <p className="text-[11px] text-slate-500">{report.answers30d} асуултад хариулсан</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs text-slate-500">Сурсан үг</dt>
          <dd className="text-2xl font-bold tabular-nums">{report.learnedWords}</dd>
        </div>
      </dl>

      {pending.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-base font-bold">⏳ Хийгээгүй даалгавар ({pending.length})</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {pending.map((a, i) => (
              <li
                key={`${a.title}-${i}`}
                className="rounded-xl bg-red-50 px-3 py-2 text-sm ring-1 ring-red-100"
              >
                <p className="font-semibold" translate="no">
                  {a.title}
                </p>
                <p className="text-xs text-slate-600">
                  {a.due_date ? `${dayText(a.due_date)} хүртэл` : "Хугацаагүй"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {done.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-base font-bold">✅ Хийсэн даалгавар ({done.length})</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {done.map((a, i) => (
              <li
                key={`${a.title}-${i}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm ring-1 ring-emerald-100"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold" translate="no">
                    {a.title}
                  </span>
                  <span className="text-xs text-slate-600">{dayText(a.completed_at)}</span>
                </span>
                {a.quiz_percentage != null ? (
                  <b className="shrink-0 tabular-nums">{a.quiz_percentage}%</b>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">
        Энэ хуудас шууд шинэчлэгддэг — дараа дахин нээхэд хамгийн сүүлийн мэдээлэл гарна.
        <br />
        Холбоосыг зөвхөн багш танд илгээсэн. Бусдад дамжуулахгүй байхыг зөвлөж байна.
      </p>
    </main>
  );
}
