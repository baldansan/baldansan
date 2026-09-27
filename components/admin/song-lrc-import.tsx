"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import type {
  BichlegImportApiResult,
  BichlegSeriesPayload,
  BichlegVideoPayload,
} from "@/lib/import/bichleg-video-types";
import {
  buildSongLyricLines,
  extractYouTubeId,
  formatLrcClock,
  parseLrc,
  splitLines,
} from "@/lib/songs/lrc";

const btnPrimary =
  "inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700";

export type SongSeriesOption = {
  id: string;
  title_mn: string | null;
  title_zh: string | null;
  hsk_level?: number | null;
};

/** Үндсэн songs-* цувралууд (DB-д байхгүй бол «шинэ» гэж үүсгэнэ). */
const DEFAULT_SONG_SERIES: SongSeriesOption[] = [
  { id: "songs-kids", title_mn: "Хүүхдийн дуу", title_zh: "儿歌", hsk_level: 1 },
  { id: "songs-2000s", title_mn: "Хит дуу 2000-аад", title_zh: "流行歌曲 2000s", hsk_level: 3 },
  { id: "songs-2010s", title_mn: "Хит дуу 2010-аад", title_zh: "流行歌曲 2010s", hsk_level: 3 },
  { id: "songs-2020s", title_mn: "Хит дуу 2020-иод", title_zh: "流行歌曲 2020s", hsk_level: 3 },
];

const NEW_SERIES = "__new__";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

type Props = {
  /** DB-д байгаа songs-* цувралууд (server page-ээс). */
  songSeries?: SongSeriesOption[];
};

export function SongLrcImport({ songSeries = [] }: Props) {
  const seriesOptions = useMemo(() => {
    const byId = new Map<string, SongSeriesOption>();
    for (const s of DEFAULT_SONG_SERIES) byId.set(s.id, s);
    for (const s of songSeries) byId.set(s.id, s);
    return Array.from(byId.values());
  }, [songSeries]);
  const existingIds = useMemo(() => new Set(songSeries.map((s) => s.id)), [songSeries]);

  const [youtube, setYoutube] = useState("");
  const [titleZh, setTitleZh] = useState("");
  const [titleMn, setTitleMn] = useState("");
  const [artist, setArtist] = useState("");
  const [year, setYear] = useState("");
  const [seriesId, setSeriesId] = useState<string>("songs-kids");
  const [newSeriesId, setNewSeriesId] = useState("");
  const [newSeriesTitle, setNewSeriesTitle] = useState("");
  const [hskLevel, setHskLevel] = useState("1");
  const [offset, setOffset] = useState("0");
  const [lrc, setLrc] = useState("");
  const [pinyinText, setPinyinText] = useState("");
  const [mnText, setMnText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    videoId: string;
    seriesId: string;
    count: number;
  } | null>(null);

  const youtubeId = useMemo(() => extractYouTubeId(youtube), [youtube]);
  const pinyinLines = useMemo(() => splitLines(pinyinText), [pinyinText]);
  const mnLines = useMemo(() => splitLines(mnText), [mnText]);
  const lines = useMemo(
    () => buildSongLyricLines(parseLrc(lrc), pinyinLines, mnLines),
    [lrc, pinyinLines, mnLines]
  );
  const pinyinMissing = lines.length > 0 && lines.some((l) => !l.pinyin);
  const pinyinCountMismatch =
    pinyinText.trim().length > 0 &&
    pinyinLines.filter(Boolean).length !== lines.length;
  const mnCountMismatch =
    mnText.trim().length > 0 && mnLines.filter(Boolean).length !== lines.length;

  const resolvedSeriesId =
    seriesId === NEW_SERIES
      ? newSeriesId.trim().startsWith("songs-")
        ? newSeriesId.trim()
        : `songs-${slugify(newSeriesId)}`
      : seriesId;

  // video_id = song-<youtubeId> — нэг дууг дахин оруулахад upsert болно.
  const videoId = youtubeId ? `song-${youtubeId}` : "";

  const canSubmit =
    Boolean(youtubeId) &&
    titleZh.trim().length > 0 &&
    lines.length > 0 &&
    Boolean(resolvedSeriesId) &&
    !busy;

  async function postImport(body: {
    series?: BichlegSeriesPayload[];
    packages?: BichlegVideoPayload[];
    fileNames?: string[];
  }): Promise<BichlegImportApiResult | null> {
    const response = await fetch("/api/admin/import/bichleg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    try {
      return JSON.parse(text) as BichlegImportApiResult;
    } catch {
      setError(`Оруулахад алдаа (${response.status}): ${text.slice(0, 200) || "Хариу буруу"}`);
      return null;
    }
  }

  async function handleSubmit() {
    if (!youtubeId) {
      setError("YouTube холбоос эсвэл ID буруу.");
      return;
    }
    if (!titleZh.trim()) {
      setError("Дууны нэр (中文) заавал.");
      return;
    }
    if (!lines.length) {
      setError("LRC-д цагтай мөр олдсонгүй — [mm:ss.xx]歌词 хэлбэрээр бичнэ үү.");
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);

    try {
      // Цуврал байхгүй бол эхлээд үүсгэнэ (songs-* → kind: song).
      const needSeries = !existingIds.has(resolvedSeriesId);
      if (needSeries) {
        const preset = seriesOptions.find((s) => s.id === resolvedSeriesId);
        const seriesPayload: BichlegSeriesPayload = {
          id: resolvedSeriesId,
          titleZh: preset?.title_zh ?? null,
          titleMn:
            preset?.title_mn ??
            (newSeriesTitle.trim() || resolvedSeriesId.replace(/^songs-/, "")),
          descriptionMn: null,
          coverUrl: null,
          hskLevel: preset?.hsk_level ?? (Number(hskLevel) || null),
          kind: "song",
        };
        const seriesResult = await postImport({ series: [seriesPayload] });
        if (!seriesResult) return;
        if (!seriesResult.ok) {
          setError(
            seriesResult.errors?.join(" · ") ?? "Цуврал үүсгэхэд алдаа гарлаа."
          );
          return;
        }
      }

      const yearNum = Number(year);
      const pkg: BichlegVideoPayload = {
        videoId,
        youtubeId,
        titleZh: titleZh.trim(),
        titleMn: titleMn.trim() || titleZh.trim(),
        source: "youtube",
        sourceUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
        hskLevel: Number(hskLevel) || null,
        durationSec: null,
        syncOffsetSec: Number(offset) || 0,
        tags: ["song"],
        seriesId: resolvedSeriesId,
        episodeNo: null,
        kind: "song",
        artist: artist.trim() || null,
        year: Number.isFinite(yearNum) && yearNum > 0 ? yearNum : null,
        subtitles: lines.map((l) => ({
          idx: l.idx,
          startSec: l.start_sec,
          endSec: l.end_sec,
          speaker: null,
          zh: l.zh,
          pinyin: l.pinyin,
          mn: l.mn,
          words: [],
          slangNote: null,
        })),
      };

      const res = await postImport({
        packages: [pkg],
        fileNames: [`${videoId}.json`],
      });
      if (!res) return;
      if (!res.ok) {
        setError(
          res.errors?.length
            ? res.errors.join(" · ")
            : "Дуу оруулахад алдаа гарлаа."
        );
        return;
      }
      setResult({ videoId, seriesId: resolvedSeriesId, count: lines.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Оруулахад алдаа гарлаа.");
    } finally {
      setBusy(false);
    }
  }

  function clearForm() {
    setYoutube("");
    setTitleZh("");
    setTitleMn("");
    setArtist("");
    setYear("");
    setLrc("");
    setPinyinText("");
    setMnText("");
    setOffset("0");
    setResult(null);
    setError(null);
  }

  return (
    <AdminEditorSection
      title="🎵 Дуу нэмэх (LRC)"
      description="YouTube дуу + [mm:ss.xx]歌词 мөрүүд → /bichleg/song/<id> karaoke хуудас. Пиньинь, монгол мөрийг мөр бүрд нэг нэгээр бичнэ."
    >
      <div className="grid gap-3 sm:grid-cols-2" data-testid="song-lrc-form">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">YouTube URL эсвэл ID *</span>
          <input
            className={adminInputClass}
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… эсвэл 11 тэмдэгт ID"
          />
          {youtube && !youtubeId ? (
            <span className="mt-1 block text-xs text-red-700">ID танигдсангүй.</span>
          ) : youtubeId ? (
            <span className="mt-1 block text-xs text-slate-500">ID: {youtubeId} · video_id: {videoId}</span>
          ) : null}
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Дууны нэр (中文) *</span>
          <input className={adminInputClass} value={titleZh} onChange={(e) => setTitleZh(e.target.value)} placeholder="两只老虎" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Дууны нэр (монгол)</span>
          <input className={adminInputClass} value={titleMn} onChange={(e) => setTitleMn(e.target.value)} placeholder="Хоёр бар" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Дуучин</span>
          <input className={adminInputClass} value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="—" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Он</span>
          <input className={adminInputClass} value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" placeholder="2015" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">HSK түвшин</span>
          <select className={adminInputClass} value={hskLevel} onChange={(e) => setHskLevel(e.target.value)}>
            {[1, 2, 3, 4, 5, 6].map((l) => (
              <option key={l} value={String(l)}>HSK{l}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Цуврал</span>
          <select className={adminInputClass} value={seriesId} onChange={(e) => setSeriesId(e.target.value)}>
            {seriesOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} — {s.title_mn ?? s.title_zh ?? ""}{existingIds.has(s.id) ? "" : " (шинэ)"}
              </option>
            ))}
            <option value={NEW_SERIES}>+ Шинэ цуврал үүсгэх…</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Цаг зөрүү (с)</span>
          <input className={adminInputClass} value={offset} onChange={(e) => setOffset(e.target.value)} inputMode="decimal" />
        </label>
        {seriesId === NEW_SERIES ? (
          <>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Шинэ цуврал id (songs-…)</span>
              <input className={adminInputClass} value={newSeriesId} onChange={(e) => setNewSeriesId(e.target.value)} placeholder="songs-1990s" />
              {newSeriesId ? <span className="mt-1 block text-xs text-slate-500">→ {resolvedSeriesId}</span> : null}
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Шинэ цувралын нэр (монгол)</span>
              <input className={adminInputClass} value={newSeriesTitle} onChange={(e) => setNewSeriesTitle(e.target.value)} placeholder="Хит дуу 1990-ээд" />
            </label>
          </>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">LRC (中文歌词) *</span>
          <textarea
            className={`${adminInputClass} min-h-[220px] font-mono text-xs`}
            value={lrc}
            onChange={(e) => setLrc(e.target.value)}
            placeholder={"[00:12.50]第一句歌词\n[00:16.00]第二句歌词\n(цаггүй мөрийг алгасна)"}
            spellCheck={false}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Пиньинь (мөр бүрд нэг)</span>
          <textarea
            className={`${adminInputClass} min-h-[220px] text-xs`}
            value={pinyinText}
            onChange={(e) => setPinyinText(e.target.value)}
            placeholder={"dì yī jù gē cí\ndì èr jù gē cí"}
            spellCheck={false}
          />
          {pinyinMissing ? (
            <span className="mt-1 block text-xs text-amber-700">
              Пиньинь хоосон мөр бий — пиньинь дараа нь засварлагчаар (TS пиньинь сан байхгүй).
            </span>
          ) : null}
          {pinyinCountMismatch ? (
            <span className="mt-1 block text-xs text-red-700">
              Пиньинь мөрийн тоо ({pinyinLines.filter(Boolean).length}) LRC мөрийн тоотой ({lines.length}) таарахгүй.
            </span>
          ) : null}
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Монгол орчуулга (мөр бүрд нэг)</span>
          <textarea
            className={`${adminInputClass} min-h-[220px] text-xs`}
            value={mnText}
            onChange={(e) => setMnText(e.target.value)}
            placeholder={"Эхний мөр\nХоёр дахь мөр"}
          />
          {mnCountMismatch ? (
            <span className="mt-1 block text-xs text-red-700">
              Монгол мөрийн тоо ({mnLines.filter(Boolean).length}) LRC мөрийн тоотой ({lines.length}) таарахгүй.
            </span>
          ) : null}
        </label>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Зохиогчийн эрхтэй дууны бүтэн үгийг оруулахдаа эрхийн асуудлыг өөрсдөө хариуцна; уламжлалт 儿歌 (нийтийн өмч) чөлөөтэй.
      </p>

      {lines.length ? (
        <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-200" data-testid="song-lrc-preview">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Цаг</th>
                <th className="px-3 py-2">中文</th>
                <th className="px-3 py-2">Пиньинь</th>
                <th className="px-3 py-2">Монгол</th>
              </tr>
            </thead>
            <tbody translate="no">
              {lines.map((l) => (
                <tr key={l.idx} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 text-slate-500">{l.idx}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-600">
                    {formatLrcClock(l.start_sec)} → {formatLrcClock(l.end_sec)}
                  </td>
                  <td className="hanzi whitespace-nowrap px-3 py-1.5 text-sm font-semibold text-slate-900">{l.zh}</td>
                  <td className="px-3 py-1.5 text-slate-700">{l.pinyin || <span className="text-amber-600">—</span>}</td>
                  <td className="px-3 py-1.5 text-slate-700">{l.mn || <span className="text-slate-400">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : lrc.trim() ? (
        <p className="mt-3 text-sm text-amber-700">Цагтай мөр олдсонгүй — [mm:ss.xx] эсвэл [mm:ss] хэлбэрээр бичнэ үү.</p>
      ) : null}

      {error ? <div className="mt-3"><AdminAlert error={error} /></div> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} disabled={!canSubmit} onClick={() => void handleSubmit()}>
          {busy ? "Оруулж байна…" : `Дуу оруулах (${lines.length} мөр)`}
        </button>
        <button type="button" className={btnGhost} onClick={clearForm}>
          Цэвэрлэх
        </button>
      </div>

      {result ? (
        <div className="mt-4 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <p className="text-sm font-semibold text-emerald-900">
            {result.videoId}: {result.count} мөр орлоо ✓ ({result.seriesId})
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/bichleg/song/${encodeURIComponent(result.videoId)}`} className={btnPrimary}>
              Нээх
            </Link>
            <Link href="/admin/bichleg" className={btnGhost}>
              Хадмал засварлагч
            </Link>
          </div>
          <p className="mt-2 text-xs text-emerald-800">
            Цаг зөрүү, мөр устгах — «Бичлэг удирдлага» → {result.seriesId} цуврал.
          </p>
        </div>
      ) : null}
    </AdminEditorSection>
  );
}
