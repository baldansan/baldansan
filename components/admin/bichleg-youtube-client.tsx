"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import { validateBichlegVideoJson } from "@/lib/import/bichleg-video-validate";
import type { BichlegImportApiResult } from "@/lib/import/bichleg-video-types";

const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700";

type SeriesOption = { id: string; title: string; episodeCount: number };

type Word = { zh: string; pinyin: string; mn: string; key?: boolean };
type Row = {
  start: number;
  end: number;
  zh: string;
  pinyin: string;
  words: Word[];
  mn: string;
};

type FetchResponse = {
  ok?: boolean;
  error?: string;
  youtubeId?: string;
  titleZh?: string;
  lines?: { start: number; end: number; zh: string }[];
  already?: { id: string; titleMn: string | null } | null;
  hasTranslateKey?: boolean;
};

const TRANSLATE_CHUNK = 40;
const BUILD_CHUNK = 200;
const MAX_LINES = 900;

function clock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Серверийн алдаа (${res.status}). Дахин оролдоно уу.`);
  }
}

export function BichlegYoutubeClient({ seriesOptions }: { seriesOptions: SeriesOption[] }) {
  const [url, setUrl] = useState("");
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ href: string; count: number } | null>(null);

  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [titleZh, setTitleZh] = useState("");
  const [titleMn, setTitleMn] = useState("");
  const [hskLevel, setHskLevel] = useState("3");
  const [seriesId, setSeriesId] = useState("");
  const [episodeNo, setEpisodeNo] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const runRef = useRef(0);

  // YouTube хуудаснаас шууд дамжуулсан өгөгдөл: /admin/bichleg/youtube#yt=<JSON {id, tr}>
  useEffect(() => {
    if (!window.location.hash.startsWith("#yt=")) return;
    try {
      const data = JSON.parse(decodeURIComponent(window.location.hash.slice(4))) as {
        id?: string;
        tr?: string;
      };
      if (data.id) setUrl(`https://www.youtube.com/watch?v=${data.id}`);
      if (data.tr) setPasted(data.tr);
    } catch {
      // буруу өгөгдөл — тоохгүй
    }
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const reset = useCallback(() => {
    runRef.current += 1;
    setRows([]);
    setYoutubeId(null);
    setTitleZh("");
    setTitleMn("");
    setSaved(null);
    setSaveErrors([]);
    setNotice(null);
    setError(null);
  }, []);

  const start = useCallback(async () => {
    reset();
    const run = runRef.current;
    setBusy("Хадмал уншиж байна…");

    try {
      const data = await postJson<FetchResponse>("/api/admin/bichleg/youtube/fetch", {
        url,
        pasted,
      });
      if (run !== runRef.current) return;

      if (data.youtubeId) setYoutubeId(data.youtubeId);
      if (data.titleZh) setTitleZh(data.titleZh);

      if (!data.ok || !data.lines?.length) {
        setError(data.error ?? "Хадмал уншиж чадсангүй.");
        return;
      }

      const notes: string[] = [];
      if (data.already) {
        notes.push(
          `Энэ бичлэг аль хэдийн орсон байна («${data.already.titleMn ?? data.already.id}»). Хадгалбал шинэчлэгдэнэ.`
        );
      }
      let lines = data.lines;
      if (lines.length > MAX_LINES) {
        lines = lines.slice(0, MAX_LINES);
        notes.push(`Хэт урт бичлэг — эхний ${MAX_LINES} мөрийг л авлаа.`);
      }
      setNotice(notes.join(" ") || null);

      if (data.hasTranslateKey === false) {
        setError(
          "Орчуулгын түлхүүр тохируулаагүй байна: Vercel → Settings → Environment Variables дээр ANTHROPIC_API_KEY нэмээд дахин deploy хийнэ үү."
        );
        return;
      }

      const titleSource = data.titleZh ?? "";
      const draft: Row[] = lines.map((l) => ({ ...l, pinyin: "", words: [], mn: "" }));
      setRows(draft);

      // 1) Үг задлах + пиньинь
      const buildAll = (async () => {
        for (let i = 0; i < lines.length; i += BUILD_CHUNK) {
          const chunk = lines.slice(i, i + BUILD_CHUNK);
          const built = await postJson<{
            ok?: boolean;
            error?: string;
            rows?: { zh: string; pinyin: string; words: Word[] }[];
          }>("/api/admin/bichleg/youtube/build", { lines: chunk.map((l) => l.zh) });
          if (!built.ok || !built.rows) throw new Error(built.error ?? "Үг задлахад алдаа.");
          if (run !== runRef.current) return;
          const got = built.rows;
          setRows((prev) =>
            prev.map((r, idx) =>
              idx >= i && idx < i + got.length ? { ...r, ...got[idx - i] } : r
            )
          );
        }
      })();

      // 2) Монгол орчуулга (дараалан — өмнөх хэсгийг контекст болгоно)
      const translateAll = (async () => {
        for (let i = 0; i < lines.length; i += TRANSLATE_CHUNK) {
          if (run !== runRef.current) return;
          setBusy(`Орчуулж байна… ${Math.min(i + TRANSLATE_CHUNK, lines.length)}/${lines.length}`);
          const chunk = lines.slice(i, i + TRANSLATE_CHUNK).map((l, k) => ({ n: i + k + 1, zh: l.zh }));
          const prev = lines
            .slice(Math.max(0, i - 8), i)
            .map((l, k) => `${Math.max(0, i - 8) + k + 1}|${l.zh}`);
          const res = await postJson<{
            ok?: boolean;
            error?: string;
            mn?: Record<string, string>;
            titleMn?: string;
          }>("/api/admin/bichleg/youtube/translate", {
            titleZh: titleSource,
            lines: chunk,
            prev,
            wantTitle: i === 0,
          });
          if (!res.ok || !res.mn) throw new Error(res.error ?? "Орчуулахад алдаа.");
          if (run !== runRef.current) return;
          const mn = res.mn;
          if (res.titleMn) setTitleMn((cur) => cur || res.titleMn || "");
          setRows((prevRows) =>
            prevRows.map((r, idx) => (mn[String(idx + 1)] ? { ...r, mn: mn[String(idx + 1)] } : r))
          );
        }
      })();

      await Promise.all([buildAll, translateAll]);
    } catch (e) {
      if (run === runRef.current) {
        setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
      }
    } finally {
      if (run === runRef.current) setBusy(null);
    }
  }, [pasted, reset, url]);

  const save = useCallback(async () => {
    if (!youtubeId) return;
    setSaveErrors([]);
    setError(null);

    const usable = rows.filter((r) => r.words.length > 0);
    const empty = usable.filter((r) => !r.mn.trim()).length;
    if (!titleMn.trim()) {
      setSaveErrors(["Монгол гарчиг бичнэ үү."]);
      return;
    }
    if (empty > 0) {
      setSaveErrors([`${empty} мөр орчуулгагүй байна — бөглөх эсвэл устгана уу.`]);
      return;
    }

    const videoId = `yt-${youtubeId}`;
    const raw = {
      video_id: videoId,
      youtube_id: youtubeId,
      title_zh: titleZh,
      title_mn: titleMn.trim(),
      source: "YouTube",
      source_url: `https://www.youtube.com/watch?v=${youtubeId}`,
      hsk_level: Number(hskLevel),
      tags: ["youtube"],
      ...(seriesId ? { series_id: seriesId, episode_no: Number(episodeNo) } : {}),
      subtitles: usable.map((r, i) => ({
        index: i + 1,
        start: r.start,
        end: r.end,
        zh: r.zh,
        pinyin: r.pinyin,
        mn: r.mn.trim(),
        words: r.words,
      })),
    };

    const checked = validateBichlegVideoJson(raw, `${videoId}.json`);
    if (!checked.ok || !("payload" in checked) || !checked.payload) {
      setSaveErrors(checked.errors.slice(0, 12));
      return;
    }

    setBusy("Апп-д нэмж байна…");
    try {
      const result = await postJson<BichlegImportApiResult>("/api/admin/import/bichleg", {
        packages: [checked.payload],
        fileNames: [`${videoId}.json`],
      });
      if (!result.ok) {
        setSaveErrors(result.errors?.length ? result.errors : ["Хадгалахад алдаа гарлаа."]);
        return;
      }
      setSaved({
        href: `/bichleg/${seriesId || "other"}/${videoId}`,
        count: usable.length,
      });
    } catch (e) {
      setSaveErrors([e instanceof Error ? e.message : "Хадгалахад алдаа гарлаа."]);
    } finally {
      setBusy(null);
    }
  }, [episodeNo, hskLevel, rows, seriesId, titleMn, titleZh, youtubeId]);

  const ready = rows.length > 0 && !busy && rows.every((r) => r.words.length > 0);
  const working = Boolean(busy);

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">YouTube холбоосоор бичлэг нэмэх</h1>
          <p className="mt-1 text-sm text-slate-600">
            Холбоос, хятад хадмал хоёрыг наахад пиньинь, үгийн утга, монгол орчуулга автоматаар гарна.
          </p>
        </div>
        <Link href="/admin/bichleg" className={btnGhost}>
          ← Бичлэг удирдлага
        </Link>
      </div>

      <AdminEditorSection title="1. Холбоос ба хадмал">
        <label className="block text-sm font-medium text-slate-800">
          YouTube холбоос
          <input
            className={adminInputClass}
            placeholder="https://www.youtube.com/watch?v=…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={working}
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-800">
          Хятад хадмал (YouTube-ээс хуулж наана)
          <textarea
            className={`${adminInputClass} min-h-44 font-mono`}
            placeholder={"0:05\n大家好，今天我们来聊一聊…\n0:09\n…"}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            disabled={working}
          />
        </label>
        <p className="mt-1 text-xs text-slate-500">
          YouTube дээр бичлэгийн тайлбарыг дэлгээд «Транскрипт харуулах» (Show transcript)-ыг дарна. Гарсан
          цагтай текстийг бүхэлд нь сонгож хуулаад энд наана. SRT файлын агуулга ч болно.
        </p>
        <button
          type="button"
          className={`${btnPrimary} mt-4`}
          onClick={start}
          disabled={working || !url.trim() || !pasted.trim()}
        >
          {working ? "Түр хүлээнэ үү…" : "Пиньинь, орчуулга гаргах"}
        </button>

        <div className="mt-4 space-y-3">
          {busy ? (
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
              {busy}
            </div>
          ) : null}
          <AdminAlert error={error} />
          {notice ? (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
              {notice}
            </div>
          ) : null}
        </div>
      </AdminEditorSection>

      {youtubeId && rows.length > 0 ? (
        <>
          <AdminEditorSection title="2. Бичлэгийн мэдээлэл">
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`}
                alt=""
                className="h-auto w-full rounded-xl sm:w-56"
              />
              <div className="flex-1 space-y-3">
                <p className="text-sm text-slate-600">{titleZh}</p>
                <label className="block text-sm font-medium text-slate-800">
                  Монгол гарчиг
                  <input
                    className={adminInputClass}
                    value={titleMn}
                    onChange={(e) => setTitleMn(e.target.value)}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <label className="block text-sm font-medium text-slate-800">
                    HSK түвшин
                    <select
                      className={adminInputClass}
                      value={hskLevel}
                      onChange={(e) => setHskLevel(e.target.value)}
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          HSK {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-800">
                    Цуврал
                    <select
                      className={adminInputClass}
                      value={seriesId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSeriesId(id);
                        const s = seriesOptions.find((o) => o.id === id);
                        setEpisodeNo(s ? String(s.episodeCount + 1) : "");
                      }}
                    >
                      <option value="">Цувралгүй (Бусад бичлэг)</option>
                      {seriesOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  {seriesId ? (
                    <label className="block text-sm font-medium text-slate-800">
                      Анги №
                      <input
                        className={adminInputClass}
                        inputMode="numeric"
                        value={episodeNo}
                        onChange={(e) => setEpisodeNo(e.target.value.replace(/\D/g, ""))}
                      />
                    </label>
                  ) : null}
                </div>
              </div>
            </div>
          </AdminEditorSection>

          <AdminEditorSection
            title={`3. Хадмал шалгах (${rows.length} мөр)`}
            description="Монгол орчуулгыг шууд засаж болно. Хэрэггүй мөрийг × дарж хасна."
          >
            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {rows.map((r, i) => (
                <div
                  key={`${r.start}-${i}`}
                  className="grid grid-cols-[3rem_1fr_auto] items-start gap-2 rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100"
                >
                  <span className="pt-1 text-xs tabular-nums text-slate-500">{clock(r.start)}</span>
                  <div className="min-w-0">
                    <p className="text-base text-slate-900">{r.zh}</p>
                    {r.pinyin ? <p className="text-xs text-slate-500">{r.pinyin}</p> : null}
                    <input
                      className={`${adminInputClass} ${r.mn.trim() || working ? "" : "border-red-300"}`}
                      value={r.mn}
                      placeholder={working ? "орчуулж байна…" : "монгол орчуулга"}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((row, idx) => (idx === i ? { ...row, mn: e.target.value } : row))
                        )
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="rounded-full px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    aria-label="Мөр хасах"
                    disabled={working}
                    onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {saveErrors.length ? <AdminAlert error={saveErrors.join(" · ")} /> : null}
              {saved ? (
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
                  {saved.count} мөртэй бичлэг апп-д орлоо ✓{" "}
                  <Link href={saved.href} className="font-semibold underline" target="_blank">
                    Апп дээр үзэх
                  </Link>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <button type="button" className={btnPrimary} disabled={!ready} onClick={save}>
                  Апп-д нэмэх
                </button>
                {saved ? (
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => {
                      reset();
                      setUrl("");
                      setPasted("");
                    }}
                  >
                    Дараагийн бичлэг
                  </button>
                ) : null}
              </div>
            </div>
          </AdminEditorSection>
        </>
      ) : null}
    </div>
  );
}
