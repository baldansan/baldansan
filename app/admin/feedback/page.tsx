import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getAdminFeedback } from "@/lib/supabase/admin-feedback";
import { FeedbackResolveButton } from "@/components/admin/feedback-resolve-button";
import { prettyCourseTitle } from "@/lib/classroom/course-label";
import {
  getLearnerNameMap,
  learnerDisplayLabel,
  type LearnerNameMap,
} from "@/lib/supabase/admin-learner-grades";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LessonInfo = { title: string; courseId: string };

/** Бүлгийн гарчигт хичээлийн ID биш НЭРИЙГ нь харуулахын тулд. */
async function readLessonInfo(ids: string[]): Promise<Map<string, LessonInfo>> {
  const map = new Map<string, LessonInfo>();
  if (ids.length === 0) return map;
  try {
    const client = await createServerSupabaseClient();
    if (!client) return map;
    const { data } = await client
      .from("lessons")
      .select("id, title, course_id")
      .in("id", ids.slice(0, 300));
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      map.set(String(row.id), {
        title: String(row.title ?? row.id),
        courseId: String(row.course_id ?? ""),
      });
    }
  } catch {
    /* гарчиггүй ч хуудас ажиллана */
  }
  return map;
}

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
  searchParams: Promise<{ stage?: string; done?: string }>;
}) {
  const { stage, done } = await searchParams;
  const activeStage = stage === "all" ? null : stage || "report";
  const resolvedFilter = done === "all" ? null : done === "yes" ? "resolved" : "open";
  const { rows, warnings } = await getAdminFeedback({
    stage: activeStage,
    resolved: resolvedFilter,
    limit: 500,
  });

  // Хичээлээр (хичээлгүй бол хуудсаар) бүлэглэнэ — олон мэдээлэлтэй нь дээрээ.
  const groupMap = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = r.lessonId
      ? `lesson:${r.lessonId}`
      : `page:${(r.pagePath ?? "").split("?")[0] || "—"}`;
    const list = groupMap.get(key);
    if (list) list.push(r);
    else groupMap.set(key, [r]);
  }
  const groups = [...groupMap.entries()].sort((a, b) => b[1].length - a[1].length);
  const lessonIds = groups
    .filter(([k]) => k.startsWith("lesson:"))
    .map(([k]) => k.slice(7));
  const [lessonInfo, names] = await Promise.all([
    readLessonInfo(lessonIds),
    getLearnerNameMap().catch(() => ({}) as LearnerNameMap),
  ]);
  const qs = (next: { stage?: string; done?: string }) => {
    const p = new URLSearchParams();
    p.set("stage", next.stage ?? (activeStage ?? "all"));
    p.set("done", next.done ?? (done || "no"));
    return `/admin/feedback?${p.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Алдааны мэдээлэл"
        description="Хэрэглэгчдийн «Алдаа мэдээлэх» товчоор ирсэн мэдээлэл — хичээлээр бүлэглэсэн. Засаад «Засагдсан» дарвал жагсаалтаас гарна."
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
              href={qs({ stage: key })}
              className={`rounded-full px-3 py-1.5 font-semibold ring-1 ${
                on ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {[
          ["no", "⏳ Үлдсэн"],
          ["yes", "✓ Засагдсан"],
          ["all", "Бүгд"],
        ].map(([key, label]) => {
          const on = (done || "no") === key;
          return (
            <Link
              key={key}
              href={qs({ done: key })}
              className={`rounded-full px-3 py-1.5 font-semibold ring-1 ${
                on ? "bg-slate-800 text-white ring-slate-800" : "bg-white text-slate-700 ring-slate-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
        <span className="self-center text-xs text-slate-500">{rows.length} мөр</span>
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
        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-500">
            {groups.length} бүлэг · олон хүн мэдээлсэн нь дээрээ. Бүлэг дээр дарж дэлгэнэ.
          </p>
          {groups.map(([key, list], index) => {
            const isLesson = key.startsWith("lesson:");
            const id = key.slice(key.indexOf(":") + 1);
            const info = isLesson ? lessonInfo.get(id) : undefined;
            const openIds = list.filter((r) => !r.resolvedAt).map((r) => r.id);
            return (
              <details
                key={key}
                open={index === 0}
                className="rounded-2xl bg-slate-50 ring-1 ring-slate-200"
              >
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span
                    className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-bold ${
                      list.length >= 5
                        ? "bg-red-500 text-white"
                        : list.length >= 2
                          ? "bg-amber-400 text-slate-900"
                          : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {list.length}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">
                      {isLesson
                        ? `${info ? `${prettyCourseTitle(info.courseId)} · ${info.title}` : `Хичээл ${id}`}`
                        : `Хуудас: ${id}`}
                    </span>
                    <span className="text-xs text-slate-500">
                      {list.length} мэдээлэл · сүүлийнх {fmt(list[0].createdAt)}
                    </span>
                  </span>
                  {isLesson ? (
                    <Link
                      href={`/admin/lessons/${id}/edit`}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                    >
                      ✏️ Хичээл засах
                    </Link>
                  ) : null}
                  {openIds.length > 1 ? (
                    <FeedbackResolveButton
                      ids={openIds}
                      resolved={false}
                      label={`Бүгдийг (${openIds.length}) засагдсан болгох`}
                    />
                  ) : null}
                </summary>
                <ul className="flex flex-col gap-3 border-t border-slate-200 p-3">
                  {list.map((r) => (
                <li
                  key={r.id}
                  className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ${r.resolvedAt ? "ring-emerald-200 opacity-80" : "ring-slate-200"}`}
                >
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
                        <span className="ml-auto">
                          <FeedbackResolveButton id={r.id} resolved={Boolean(r.resolvedAt)} />
                        </span>
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
                        {r.questionId ? <span className="text-slate-500">Асуулт: {r.questionId}</span> : null}
                        {r.userId ? (
                          <Link href={`/admin/learner?user=${r.userId}`} className="text-slate-600 underline">
                            👤{" "}
                            {learnerDisplayLabel(
                              r.userId,
                              names[r.userId]?.displayName,
                              names[r.userId]?.email
                            )}
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
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
