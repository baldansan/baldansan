import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { fetchHskSourceLessonList } from "@/lib/admin/hsk-source-fetch";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Эх сурвалж — Удирдлагын хэсэг",
};

const STATUS_MN: Record<string, string> = {
  ocr: "Зөвхөн OCR",
  image_verified: "Зургаар тулгасан",
  reviewed: "Хүн хянасан",
};

export default async function AdminSourcePage() {
  const rows = await fetchHskSourceLessonList();
  const levels = Array.from(new Set(rows.map((r) => r.level))).sort();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Эх сурвалжийн сан"
        description="HSK Standard Course номын хичээл бүрийн бүх агуулга — сурах бичиг, багшийн ном, дасгалын ном — номд байгаа хэлбэрээр. Хичээл үйлдвэрлэхийн суурь; монгол орчуулга, заах тайлбар энд ороогүй."
      />

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          Одоогоор эх сурвалж ороогүй байна. <code>supabase/content/006_hsk3_source_lessons.sql</code>-ийг
          Supabase SQL editor дээр ажиллуулна.
        </p>
      ) : null}

      {levels.map((level) => {
        const lessons = rows.filter((r) => r.level === level);
        return (
          <section key={level} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              {level.toUpperCase()} · {lessons.length} хичээл
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/source/${r.id}`}
                    className="block rounded-xl border border-slate-200 px-3 py-2 transition hover:border-blue-400 hover:bg-blue-50"
                  >
                    <div className="text-xs text-slate-500">
                      {r.book} · {r.lesson}-р хичээл
                    </div>
                    <div className="text-base font-semibold text-slate-900">{r.title_zh}</div>
                    <div className="text-xs text-slate-600">{r.title_pinyin}</div>
                    <div className="mt-1 text-[11px] text-emerald-700">
                      {STATUS_MN[r.status] ?? r.status}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
