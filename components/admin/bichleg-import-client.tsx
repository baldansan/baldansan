"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  AdminAlert,
  AdminCollapsibleSection,
  AdminEditorSection,
} from "@/components/admin/admin-editor-ui";
import type {
  BichlegFileValidation,
  BichlegImportApiResult,
  BichlegSeriesPayload,
  BichlegVideoPayload,
} from "@/lib/import/bichleg-video-types";
import {
  formatFilePreviewLine,
  parseBichlegJsonFileText,
} from "@/lib/import/bichleg-video-validate";

const btnPrimary =
  "inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700";

type FileEntry = BichlegFileValidation & { id: string };

function makeId(fileName: string): string {
  return `${fileName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readJsonFiles(files: File[]): Promise<FileEntry[]> {
  const jsonFiles = files.filter((f) => f.name.toLowerCase().endsWith(".json"));
  const entries: FileEntry[] = [];

  for (const file of jsonFiles) {
    const text = await file.text();
    const validation = parseBichlegJsonFileText(text, file.name);
    entries.push({ ...validation, id: makeId(file.name) });
  }

  return entries;
}

export function BichlegImportClient() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [importResult, setImportResult] = useState<BichlegImportApiResult | null>(
    null
  );
  const [busy, setBusy] = useState<"parse" | "import" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    done: number;
    total: number;
    current?: string;
  } | null>(null);

  const validSeriesEntries = useMemo(
    () => entries.filter((entry) => entry.ok && entry.kind === "series" && entry.seriesPayload),
    [entries]
  );
  const validVideoEntries = useMemo(
    () => entries.filter((entry) => entry.ok && entry.kind === "video" && entry.payload),
    [entries]
  );
  const validEntries = useMemo(
    () => [...validSeriesEntries, ...validVideoEntries],
    [validSeriesEntries, validVideoEntries]
  );
  const invalidEntries = useMemo(
    () => entries.filter((entry) => !entry.ok),
    [entries]
  );
  const canImport = validEntries.length > 0 && busy === null;

  const addFiles = useCallback(async (files: FileList | File[]) => {
    setBusy("parse");
    setError(null);
    setImportResult(null);

    try {
      const next = await readJsonFiles(Array.from(files));
      if (next.length === 0) {
        setError(".json файл сонгоно уу.");
        return;
      }

      setEntries((prev) => {
        const byName = new Map(prev.map((item) => [item.fileName, item]));
        for (const item of next) {
          byName.set(item.fileName, item);
        }
        return Array.from(byName.values());
      });
    } catch {
      setError("Файл уншихад алдаа гарлаа.");
    } finally {
      setBusy(null);
    }
  }, []);

  function clearAll() {
    setEntries([]);
    setImportResult(null);
    setError(null);
  }

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

    const responseText = await response.text();
    try {
      return JSON.parse(responseText) as BichlegImportApiResult;
    } catch {
      setError(
        `Оруулахад алдаа (${response.status}): ${responseText.slice(0, 200) || "Хариу буруу"}`
      );
      return null;
    }
  }

  async function handleImport() {
    if (!validEntries.length) {
      setError("Шалгалт давсан файл байхгүй.");
      return;
    }

    setBusy("import");
    setError(null);
    setImportResult(null);

    const seriesPayloads = validSeriesEntries.map(
      (entry) => entry.seriesPayload as BichlegSeriesPayload
    );
    const videoEntries = validVideoEntries;
    const totalSteps =
      (seriesPayloads.length ? 1 : 0) + videoEntries.length;
    const allResults: BichlegImportApiResult["results"] = [];
    let step = 0;

    try {
      if (seriesPayloads.length) {
        setImportProgress({
          done: step,
          total: totalSteps,
          current: "Цувралын тодорхойлолт",
        });
        const seriesResult = await postImport({ series: seriesPayloads });
        if (!seriesResult) return;
        allResults.push(...seriesResult.results);
        if (!seriesResult.ok) {
          setError("Цуврал оруулахад алдаа гарлаа.");
          setImportResult({ ok: false, results: allResults });
          return;
        }
        step += 1;
      }

      for (const entry of videoEntries) {
        setImportProgress({
          done: step,
          total: totalSteps,
          current: entry.fileName,
        });

        const oneResult = await postImport({
          packages: [entry.payload as BichlegVideoPayload],
          fileNames: [entry.fileName],
        });
        if (!oneResult) return;

        allResults.push(...oneResult.results);
        step += 1;
        setImportProgress({ done: step, total: totalSteps, current: entry.fileName });
      }

      const finalOk = allResults.length > 0 && allResults.every((r) => r.ok);
      setImportResult({ ok: finalOk, results: allResults });

      if (!finalOk) {
        setError("Зарим файл оруулагдаагүй — доорх үр дүнг шалгана уу.");
      }
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Оруулахад алдаа гарлаа."
      );
    } finally {
      setBusy(null);
      setImportProgress(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/import"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          ← Import hub
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Бичлэг хадмал импорт
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          kxcc-ep1.json маягийн богино видеоны хадмал файлыг Supabase-д оруулна.
          series.json байвал эхлээд цуврал үүсгэнэ. Шалгалт давсан файлыг л оруулна.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          <Link href="/admin/bichleg" className="font-medium text-emerald-700">
            Бичлэг удирдлага
          </Link>{" "}
          — цуврал устгах, цаг зөрүү засах.
        </p>
      </div>

      <AdminEditorSection
        title="JSON файлууд"
        description="Нэг эсвэл хэд хэдэн .json файл чирч оруулна уу (drag & drop эсвэл сонгох)."
      >
        <div
          className={`rounded-2xl border-2 border-dashed px-5 py-10 text-center transition-colors ${
            dragOver
              ? "border-emerald-400 bg-emerald-50"
              : "border-slate-200 bg-slate-50"
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) {
              void addFiles(e.dataTransfer.files);
            }
          }}
        >
          <p className="text-sm font-semibold text-slate-800">
            JSON файлуудаа энд чирнэ үү
          </p>
          <p className="mt-1 text-xs text-slate-500">эсвэл доорх товчоор сонгоно</p>
          <label className={`${btnPrimary} mt-4 cursor-pointer`}>
            Файл сонгох
            <input
              type="file"
              accept=".json,application/json"
              multiple
              className="sr-only"
              onChange={(event) => {
                const list = event.target.files;
                if (list?.length) void addFiles(list);
                event.target.value = "";
              }}
            />
          </label>
        </div>

        {entries.length ? (
          <p className="mt-3 text-sm text-slate-600">
            Нийт <strong>{entries.length}</strong> файл — шалгалт давсан{" "}
            <strong className="text-emerald-700">{validEntries.length}</strong>, алдаатай{" "}
            <strong className="text-red-700">{invalidEntries.length}</strong>
          </p>
        ) : null}
      </AdminEditorSection>

      {error ? <AdminAlert error={error} /> : null}

      {invalidEntries.length ? (
        <section className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200 sm:p-6">
          <h2 className="text-base font-semibold text-red-900">
            Алдаатай файл ({invalidEntries.length})
          </h2>
          <p className="mt-1 text-sm text-red-800">
            Эдгээр файлыг оруулахгүй. Алдааг засаад дахин нэмнэ үү.
          </p>
          <ul className="mt-4 space-y-3">
            {invalidEntries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-red-100"
              >
                <p className="text-sm font-semibold text-red-900">{entry.fileName}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-900">
                  {entry.errors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {validEntries.length ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Шалгалт давсан ({validEntries.length})
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {validEntries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl bg-emerald-50/70 px-4 py-3 ring-1 ring-emerald-100"
              >
                <strong>{entry.fileName}</strong>
                <span className="mt-1 block text-slate-600">
                  {formatFilePreviewLine(entry)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {validEntries.length ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPrimary}
            disabled={!canImport}
            onClick={() => {
              void handleImport();
            }}
          >
            {busy === "import"
              ? importProgress
                ? `Оруулж байна… ${importProgress.done}/${importProgress.total}`
                : "Оруулж байна…"
              : "Supabase-д оруулах"}
          </button>
          <button type="button" className={btnGhost} onClick={clearAll}>
            Цэвэрлэх
          </button>
          <Link href="/bichleg" className={btnGhost}>
            /bichleg нээх
          </Link>
        </div>
      ) : null}

      {importProgress ? (
        <div className="rounded-xl bg-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            {importProgress.done}/{importProgress.total} файл
            {importProgress.current ? ` — ${importProgress.current}` : ""}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${importProgress.total ? (importProgress.done / importProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {importResult?.results?.length ? (
        <section
          className={`rounded-2xl p-5 ring-1 sm:p-6 ${
            importResult.ok
              ? "bg-emerald-50 ring-emerald-200"
              : "bg-amber-50 ring-amber-200"
          }`}
        >
          <h2 className="text-base font-semibold text-slate-900">Үр дүн</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {importResult.results.map((item) => (
              <li
                key={`${item.fileName}-${item.videoId ?? "x"}`}
                className={`rounded-xl px-4 py-3 ring-1 ${
                  item.ok
                    ? "bg-white/80 text-emerald-900 ring-emerald-100"
                    : "bg-white/80 text-red-900 ring-red-100"
                }`}
              >
                {item.message ??
                  (item.ok
                    ? `${item.fileName}: амжилттай`
                    : `${item.fileName}: алдаа`)}
                {item.errors?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {item.errors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AdminCollapsibleSection
        title="Файлын бүтэц"
        description="Нэг видео = нэг JSON файл (data/videos/*.json-тай ижил)."
      >
        <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
          {`// series.json
{
  "id": "kxcc",
  "title_zh": "开心锤锤",
  "title_mn": "Хөгжилтэй Чүйчүй",
  "hsk_level": 5,
  "description_mn": "..."
}

// kxcc-ep1.json
{
  "video_id": "bv-kxcc-ep1",
  "youtube_id": "9rqTQPdimnw",
  "series_id": "kxcc",
  "episode_no": 1,
  "title_mn": "...",
  "subtitles": [
    {
      "index": 1,
      "start": 0.0,
      "end": 1.0,
      "zh": "卖拖鞋啦",
      "pinyin": "Mài tuōxié la",
      "mn": "Шаахай зарж байна аа!",
      "words": [
        { "zh": "卖", "pinyin": "mài", "mn": "зарах" },
        { "zh": "拖鞋", "pinyin": "tuōxié", "mn": "шаахай", "key": true }
      ]
    }
  ]
}`}
        </pre>
        <p className="text-sm text-slate-600">
          Терминалаар оруулах: <code>npm run load:videos</code> (энэ хуудас нэмэлт
          зам).
        </p>
      </AdminCollapsibleSection>
    </div>
  );
}
