import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getAdminFeedback } from "@/lib/supabase/admin-feedback";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Алдааны мэдээлэл — Удирдлагын хэсэг",
};

const STAGE_LABEL: Record<string, string> = {
  report: "🐞 Алдаа",
  question: "👍👎 Асуулт",
  lesson_feedback: "📊 Хичээлийн хүндрэл",
};

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar", hour12: false });
  } catch {
    return iso;
  }
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage } = await searchParams;
  const activeStage = stage === "all" ? null : stage || "report";
  const { rows, warnings } = await getAdminFeedback({ stage: activeStage });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Алдааны мэдээлэл"
        description="Хэрэглэгч/багшийн «Алдаа мэдээлэх» товчоор ирсэн тэмдэглэл, дэлгэцийн зураг, хуудасны холбоос."
      />

      <div className="flex flex-wrap gap-2 text-sm">
        {[
          ["report", "🐞 Алдаа"],
          ["question", "👍👎 Асуулт"],
          ["lesson_feedback", "📊 Хүндрэл"],
          ["all", "Бүгд"],
        ].map(([key, label]) => {
          const on = (activeStage ?? "all") === key;
          return (
            <Link
              key={key}
              href={`/admin/feedback?stage=${key}`}
              className={`rounded-full px-3 py-1.5 font-semibold ring-1 ${
                on ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {warnings.length > 0 ? (
        <ul className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">Одоогоор мэдээлэл алга.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-3 sm:flex-row">
                {r.screenshotUrl ? (
                  <a
                    href={r.screenshotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200"
                    title="Зургийг томоор нээх"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.screenshotUrl}
                      alt="Дэлгэцийн зураг"
                      className="h-40 w-full object-cover object-top sm:w-56"
                      loading="lazy"
                    />
                  </a>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                      {STAGE_LABEL[r.stage] ?? r.stage}
                    </span>
                    <span>{fmt(r.createdAt)}</span>
                    {r.rating ? <span>· үнэлгээ: {r.rating}</span> : null}
                    {r.viewport ? <span>· {r.viewport}</span> : null}
                  </div>
                  {r.note ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-900">{r.note}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {r.pagePath ? (
                      <a href={r.pagePath} target="_blank" rel="noreferrer" className="font-semibold text-emerald-700 underline">
                        {r.pagePath}
                      </a>
                    ) : null}
                    {r.lessonId ? (
                      <Link href={`/admin/lessons/${r.lessonId}`} className="text-slate-600 underline">
                        Хичээл: {r.lessonId}
                      </Link>
                    ) : null}
                    {r.questionId ? <span className="text-slate-500">Асуулт: {r.questionId}</span> : null}
                    {r.userId ? (
                      <Link href={`/admin/learner?userId=${r.userId}`} className="text-slate-500 underline">
                        Хэрэглэгч
                      </Link>
                    ) : (
                      <span className="text-slate-400">Зочин</span>
                    )}
                  </div>
                  {r.userAgent ? (
                    <p className="mt-1 truncate text-[11px] text-slate-400" title={r.userAgent}>
                      {r.userAgent}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
