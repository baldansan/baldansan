"use client";

import { useRef, useState } from "react";

type VideoItem = { id: string; title_mn: string | null; series_id: string | null; episode_no: number | null };

/**
 * «Хадмалын үгийг бүтнээр нь нийлүүлэх» — бүх бичлэгийн хадмалыг нэг нэгээр нь
 * дахин задалж, ганц ханзаар тасарсан хэсгийг толь бичгийн бүтэн үг болгоно.
 * Орчуулга, цаг хөндөгдөхгүй. Дахин дарахад аюулгүй (өөрчлөгдөөгүй мөрийг алгасна).
 */
export function BichlegResegmentCard() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const stopRef = useRef(false);

  async function run() {
    setRunning(true);
    setSummary(null);
    setFailed([]);
    stopRef.current = false;
    try {
      const listRes = await fetch("/api/admin/bichleg/resegment");
      const list = (await listRes.json()) as { ok: boolean; videos?: VideoItem[]; error?: string };
      if (!list.ok || !list.videos) throw new Error(list.error ?? "Бичлэгийн жагсаалт авч чадсангүй.");

      let changedRows = 0;
      let before = 0;
      let after = 0;
      const errors: string[] = [];
      for (let i = 0; i < list.videos.length; i += 1) {
        if (stopRef.current) break;
        const v = list.videos[i];
        const label = `${v.series_id ?? "—"}${v.episode_no != null ? ` · ${v.episode_no}-р анги` : ""}`;
        setProgress({ done: i, total: list.videos.length, current: label });
        try {
          const res = await fetch("/api/admin/bichleg/resegment", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ videoId: v.id }),
          });
          const data = (await res.json()) as {
            ok: boolean;
            changedRows?: number;
            wordsBefore?: number;
            wordsAfter?: number;
            error?: string;
          };
          if (!data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
          changedRows += data.changedRows ?? 0;
          before += data.wordsBefore ?? 0;
          after += data.wordsAfter ?? 0;
        } catch (e) {
          errors.push(`${label}: ${e instanceof Error ? e.message : "алдаа"}`);
        }
        setProgress({ done: i + 1, total: list.videos.length, current: label });
      }
      setFailed(errors);
      setSummary(
        `${stopRef.current ? "Зогсоолоо. " : "Дууслаа ✓ "}${changedRows} мөр шинэчлэгдэж, ${Math.max(0, before - after)} тасархай хэсэг бүтэн үг болж нийллээ.`
      );
    } catch (e) {
      setSummary(e instanceof Error ? e.message : "Алдаа гарлаа.");
    } finally {
      setRunning(false);
    }
  }

  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <h2 className="text-base font-bold text-slate-900">Хадмалын үгийг бүтнээр нь нийлүүлэх</h2>
      <p className="mt-1 text-sm text-slate-600">
        Бичлэг үзэхэд ханз ханзаар тасарч харагддаг үгсийг (жишээ нь 图书 + 馆) толь бичгийн бүтэн үг
        (图书馆) болгож нийлүүлнэ. Орчуулга, цаг хөндөгдөхгүй. Бүх бичлэгт нэг удаа ажиллуулахад хангалттай —
        шинээр нэмэх бичлэг автоматаар ингэж орно. Цонхоо хаалгүй хүлээгээрэй.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={running}
          onClick={() => void run()}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {running ? "Ажиллаж байна…" : "Бүх бичлэгт ажиллуулах"}
        </button>
        {running ? (
          <button
            type="button"
            onClick={() => {
              stopRef.current = true;
            }}
            className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-300"
          >
            Зогсоох
          </button>
        ) : null}
      </div>
      {progress ? (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {progress.done} / {progress.total} бичлэг · {progress.current}
          </p>
        </div>
      ) : null}
      {summary ? <p className="mt-2 text-sm font-semibold text-slate-800">{summary}</p> : null}
      {failed.length ? (
        <ul className="mt-2 list-disc pl-5 text-xs text-rose-600">
          {failed.slice(0, 20).map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
