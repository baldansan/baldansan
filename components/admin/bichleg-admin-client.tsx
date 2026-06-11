"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import type {
  AdminEpisodeRow,
  AdminSeriesRow,
} from "@/lib/admin/bichleg-admin-server";
import type { VideoSeriesInfo } from "@/lib/bichleg/types";

const btnPrimary =
  "inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50";
const btnDanger =
  "inline-flex rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700";

type Props = {
  initialSeries: AdminSeriesRow[];
};

export function BichlegAdminClient({ initialSeries }: Props) {
  const router = useRouter();
  const [seriesList, setSeriesList] = useState(initialSeries);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seriesDetail, setSeriesDetail] = useState<VideoSeriesInfo | null>(null);
  const [episodes, setEpisodes] = useState<AdminEpisodeRow[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteSeriesConfirm, setDeleteSeriesConfirm] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [offsetDrafts, setOffsetDrafts] = useState<Record<string, string>>({});

  const loadSeriesDetail = useCallback(async (seriesId: string) => {
    setLoadingDetail(true);
    setError(null);
    setSelectedId(seriesId);
    setDeleteSeriesConfirm("");

    try {
      const res = await fetch(
        `/api/admin/bichleg/series/${encodeURIComponent(seriesId)}`
      );
      const data = (await res.json()) as {
        ok?: boolean;
        series?: VideoSeriesInfo;
        episodes?: AdminEpisodeRow[];
        error?: string;
      };

      if (!res.ok || !data.series) {
        setError(data.error ?? "Цуврал ачаалахад алдаа.");
        setSeriesDetail(null);
        setEpisodes([]);
        return;
      }

      setSeriesDetail(data.series);
      setEpisodes(data.episodes ?? []);
      const drafts: Record<string, string> = {};
      for (const ep of data.episodes ?? []) {
        drafts[ep.id] = String(ep.sync_offset_sec);
      }
      setOffsetDrafts(drafts);
    } catch {
      setError("Цуврал ачаалахад алдаа гарлаа.");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  async function saveOffset(videoId: string) {
    const raw = offsetDrafts[videoId];
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      setError("sync_offset_sec тоо оруулна уу.");
      return;
    }

    setBusy(`offset-${videoId}`);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/bichleg/videos/${encodeURIComponent(videoId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sync_offset_sec: value }),
        }
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Хадгалахад алдаа.");
        return;
      }
      setEpisodes((prev) =>
        prev.map((ep) =>
          ep.id === videoId ? { ...ep, sync_offset_sec: value } : ep
        )
      );
    } catch {
      setError("Хадгалахад алдаа гарлаа.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteEpisode(videoId: string, label: string) {
    if (!window.confirm(`«${label}» ангийг устгах уу? Хадмал хамт устана.`)) {
      return;
    }

    setBusy(`del-${videoId}`);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/bichleg/videos/${encodeURIComponent(videoId)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Устгахад алдаа.");
        return;
      }

      setEpisodes((prev) => prev.filter((ep) => ep.id !== videoId));
      setSeriesList((prev) =>
        prev.map((s) =>
          s.id === selectedId
            ? { ...s, episode_count: Math.max(0, s.episode_count - 1) }
            : s
        )
      );
      router.refresh();
    } catch {
      setError("Устгахад алдаа гарлаа.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteSeries() {
    if (!seriesDetail) return;
    const expected = seriesDetail.title_mn?.trim() ?? "";
    if (deleteSeriesConfirm.trim() !== expected) {
      setError(`Баталгаажуулахын тулд «${expected}» гэж яг бичнэ үү.`);
      return;
    }

    if (
      !window.confirm(
        `«${expected}» цуврал болон бүх ${episodes.length} ангийг бүхэлд нь устгах уу?`
      )
    ) {
      return;
    }

    setBusy("del-series");
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/bichleg/series/${encodeURIComponent(seriesDetail.id)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmTitle: deleteSeriesConfirm.trim() }),
        }
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Цуврал устгахад алдаа.");
        return;
      }

      setSeriesList((prev) => prev.filter((s) => s.id !== seriesDetail.id));
      setSelectedId(null);
      setSeriesDetail(null);
      setEpisodes([]);
      setDeleteSeriesConfirm("");
      router.refresh();
    } catch {
      setError("Цуврал устгахад алдаа гарлаа.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Бичлэг удирдлага</h1>
          <p className="mt-1 text-sm text-slate-600">
            Цуврал, анги, хадмалын цаг зөрүүг удирдана.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/import/bichleg" className={btnPrimary}>
            Импортлох
          </Link>
          <Link href="/bichleg" className={btnGhost}>
            /bichleg нээх
          </Link>
        </div>
      </div>

      {error ? <AdminAlert error={error} /> : null}

      {!selectedId ? (
        <AdminEditorSection
          title="Цувралууд"
          description="Цуврал дээр дарж ангиудыг харна."
        >
          {seriesList.length ? (
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Цуврал</th>
                    <th className="px-4 py-3">Анги</th>
                    <th className="px-4 py-3">HSK</th>
                    <th className="px-4 py-3">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {seriesList.map((series) => (
                    <tr
                      key={series.id}
                      className="cursor-pointer border-t border-slate-100 hover:bg-emerald-50/60"
                      onClick={() => void loadSeriesDetail(series.id)}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {series.title_mn ?? series.title_zh ?? series.id}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {series.episode_count}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {series.hsk_level ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {series.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Цуврал байхгүй.{" "}
              <Link href="/admin/import/bichleg" className="font-medium text-emerald-700">
                Импортлох
              </Link>{" "}
              хуудас руу очно уу.
            </p>
          )}
        </AdminEditorSection>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            className="w-fit text-sm font-medium text-emerald-700 hover:text-emerald-800"
            onClick={() => {
              setSelectedId(null);
              setSeriesDetail(null);
              setEpisodes([]);
              setDeleteSeriesConfirm("");
            }}
          >
            ← Цувралууд руу буцах
          </button>

          <AdminEditorSection
            title={seriesDetail?.title_mn ?? seriesDetail?.id ?? "Цуврал"}
            description={
              loadingDetail
                ? "Ачаалж байна…"
                : `${episodes.length} анги · HSK ${seriesDetail?.hsk_level ?? "—"}`
            }
          >
            {episodes.length ? (
              <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-3">№</th>
                      <th className="px-3 py-3">Гарчиг</th>
                      <th className="px-3 py-3">YouTube</th>
                      <th className="px-3 py-3">Мөр</th>
                      <th className="px-3 py-3">Цаг зөрүү</th>
                      <th className="px-3 py-3">Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {episodes.map((ep) => (
                      <tr key={ep.id} className="border-t border-slate-100">
                        <td className="px-3 py-3 font-semibold text-slate-900">
                          {ep.episode_no ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {ep.title_mn ?? ep.title_zh ?? ep.id}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-500">
                          {ep.youtube_id}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {ep.subtitle_count}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.1"
                              className={`${adminInputClass} !mt-0 w-24`}
                              value={offsetDrafts[ep.id] ?? "0"}
                              onChange={(e) =>
                                setOffsetDrafts((prev) => ({
                                  ...prev,
                                  [ep.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              type="button"
                              className={btnGhost}
                              disabled={busy === `offset-${ep.id}`}
                              onClick={() => void saveOffset(ep.id)}
                            >
                              Хадгал
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            className={btnDanger}
                            disabled={busy === `del-${ep.id}`}
                            onClick={() =>
                              void deleteEpisode(
                                ep.id,
                                ep.episode_no != null
                                  ? `${ep.episode_no}-р анги`
                                  : ep.title_mn ?? ep.id
                              )
                            }
                          >
                            Устгах
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Энэ цувралд анги байхгүй.</p>
            )}
          </AdminEditorSection>

          {seriesDetail ? (
            <section className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200 sm:p-6">
              <h2 className="text-base font-semibold text-red-900">
                Цуврал бүхэлд нь устгах
              </h2>
              <p className="mt-1 text-sm text-red-800">
                Бүх анги болон хадмал нэг дор устана. Баталгаажуулахын тулд доор
                цувралын нэрийг яг бичнэ үү:{" "}
                <strong>{seriesDetail.title_mn}</strong>
              </p>
              <input
                type="text"
                className={`${adminInputClass} mt-3 max-w-md`}
                placeholder={seriesDetail.title_mn ?? ""}
                value={deleteSeriesConfirm}
                onChange={(e) => setDeleteSeriesConfirm(e.target.value)}
              />
              <button
                type="button"
                className={`${btnDanger} mt-3`}
                disabled={busy === "del-series"}
                onClick={() => void deleteSeries()}
              >
                Цуврал устгах
              </button>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
