"use client";

import { useState } from "react";

const RAW_BASE = "https://raw.githubusercontent.com/baldansan/baldansan/main/content/hsk4-workbooks/";

export function WorkbookImportClient() {
  const [lessonId, setLessonId] = useState("hsk4-l01");
  const [url, setUrl] = useState(`${RAW_BASE}hsk4-l01.workbook.json`);
  const [jsonText, setJsonText] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [bulkIds, setBulkIds] = useState("");

  const push = (m: string) => setLog((l) => [...l, m]);

  async function putWorkbook(id: string, workbook: unknown): Promise<string> {
    const r = await fetch(`/api/admin/lessons/${encodeURIComponent(id)}/workbook`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workbook }),
    });
    const body = (await r.json().catch(() => ({}))) as { error?: string; bytes?: number };
    if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
    return `${body.bytes ?? "?"} байт`;
  }

  /** Олноор: мөр бүрт lessonId; URL = холбоосын хавтас + <id>.workbook.json */
  async function runBulk() {
    if (busy) return;
    const ids = bulkIds.split(/[\s,]+/).map((v) => v.trim()).filter(Boolean);
    if (!ids.length) return;
    setBusy(true);
    setLog([]);
    const dir = url.replace(/[^/]*$/, "");
    let ok = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`${dir}${id}.workbook.json?t=${Date.now()}`);
        if (!res.ok) throw new Error(`файл татагдсангүй (${res.status})`);
        const wb = await res.json();
        const info = await putWorkbook(id, wb);
        ok += 1;
        push(`✅ ${id} (${info})`);
      } catch (e) {
        push(`❌ ${id}: ${e instanceof Error ? e.message : "Алдаа"}`);
      }
    }
    push(`Дууслаа: ${ok}/${ids.length} амжилттай.`);
    setBusy(false);
  }

  async function run() {
    if (busy) return;
    setBusy(true);
    setLog([]);
    try {
      let workbook: unknown;
      if (jsonText.trim()) {
        workbook = JSON.parse(jsonText);
        push("JSON текстээс уншлаа.");
      } else {
        const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`);
        if (!res.ok) throw new Error(`Файл татаж чадсангүй (${res.status})`);
        workbook = await res.json();
        push(`Татлаа: ${url}`);
      }
      const info = await putWorkbook(lessonId.trim(), workbook);
      push(`✅ ${lessonId}: workbook солигдлоо (${info}). Шалгах: /lessons/${lessonId}/watch → «Дасгал» үе.`);
    } catch (e) {
      push(`❌ ${e instanceof Error ? e.message : "Алдаа"}`);
    } finally {
      setBusy(false);
    }
  }

  function syncUrl(id: string) {
    setLessonId(id);
    setUrl(`${RAW_BASE}${id.trim()}.workbook.json`);
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-slate-700">Хичээлийн ID</span>
        <input value={lessonId} onChange={(e) => syncUrl(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2" placeholder="hsk4-l01" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-slate-700">workbook.json холбоос (GitHub raw)</span>
        <input value={url} onChange={(e) => setUrl(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-slate-700">эсвэл JSON-оо шууд буулга (холбоосыг орлоно)</span>
        <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={5} className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs" placeholder='{"listening":{...},"reading":{...},"writing":{...}}' />
      </label>
      <button type="button" onClick={() => void run()} disabled={busy || !lessonId.trim()} className="self-start rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
        {busy ? "Оруулж байна…" : "Дасгалын номыг оруулах"}
      </button>
      <div className="mt-2 flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-slate-700">Олноор оруулах — хичээлийн ID жагсаалт (мөр бүрт нэг; файл = дээрх холбоосын хавтас + ID.workbook.json)</span>
          <textarea value={bulkIds} onChange={(e) => setBulkIds(e.target.value)} rows={4} className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs" placeholder={"hsk4-l02\nhsk4-l03"} />
        </label>
        <button type="button" onClick={() => void runBulk()} disabled={busy || !bulkIds.trim()} className="self-start rounded-full bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60">
          {busy ? "Оруулж байна…" : "Жагсаалтыг бүгдийг оруулах"}
        </button>
      </div>
      {log.length ? (
        <ul className="rounded-xl bg-slate-50 p-3 text-sm text-slate-800">
          {log.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
