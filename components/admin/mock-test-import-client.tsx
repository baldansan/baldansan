"use client";

import { useRef, useState } from "react";
import JSZip from "jszip";
import { supabase } from "@/lib/supabase/client";
import {
  resolvePackageAssets,
  storagePathForAsset,
  validateMockPackage,
  type MockPackage,
  type MockPackageValidation,
} from "@/lib/mock-test/import-package";

const BUCKET = "test-assets";

type Parsed = {
  fileName: string;
  pkg: MockPackage;
  report: MockPackageValidation;
  zip: JSZip;
  assetEntries: { rel: string; entry: JSZip.JSZipObject; size: number }[];
  missing: string[];
};

function contentTypeFor(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "m4a") return "audio/mp4";
  if (ext === "ogg") return "audio/ogg";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "image/png";
}

function fmtMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MockTestImportClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [patchText, setPatchText] = useState("");
  const push = (m: string) => setLog((l) => [...l, m]);

  async function onFile(file: File | null) {
    setParsed(null);
    setLog([]);
    if (!file) return;
    setBusy(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const jsonEntry = Object.values(zip.files).find(
        (e) => !e.dir && /(^|\/)[A-Z]\d{5}[A-Z]?\.json$/i.test(e.name)
      );
      if (!jsonEntry) throw new Error("Zip дотор <TID>.json (жишээ H41329.json) олдсонгүй.");
      const raw = JSON.parse(await jsonEntry.async("string"));
      const { pkg, report } = validateMockPackage(raw);
      if (!pkg) {
        setLog(["❌ Багцын алдаа:", ...report.errors]);
        return;
      }
      const root = jsonEntry.name.includes("/") ? jsonEntry.name.replace(/[^/]*$/, "") : "";
      const assetEntries: Parsed["assetEntries"] = [];
      const missing: string[] = [];
      for (const rel of report.assetRefs) {
        const entry = zip.file(root + rel) ?? zip.file(rel);
        if (!entry) {
          missing.push(rel);
          continue;
        }
        const size = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
        assetEntries.push({ rel, entry, size });
      }
      setParsed({ fileName: file.name, pkg, report, zip, assetEntries, missing });
      push(`Багц уншлаа: ${pkg.test_id} · ${pkg.questions.length} асуулт · asset ${assetEntries.length}${missing.length ? ` · ДУТУУ ${missing.length}` : ""}`);
    } catch (e) {
      push(`❌ ${e instanceof Error ? e.message : "Zip уншихад алдаа."}`);
    } finally {
      setBusy(false);
    }
  }

  async function runImport() {
    if (!parsed || busy) return;
    if (parsed.missing.length) {
      push(`❌ Zip-д байхгүй asset: ${parsed.missing.join(", ")}`);
      return;
    }
    if (!supabase) {
      push("❌ Supabase client тохируулагдаагүй.");
      return;
    }
    setBusy(true);
    try {
      const urlMap: Record<string, string> = {};
      let done = 0;
      for (const a of parsed.assetEntries) {
        const path = storagePathForAsset(parsed.pkg.test_id, a.rel);
        if (!path) continue;
        const blob = await a.entry.async("blob");
        let lastErr: string | null = null;
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
            upsert: true,
            contentType: contentTypeFor(path),
            cacheControl: "31536000",
          });
          if (!error) {
            lastErr = null;
            break;
          }
          lastErr = error.message;
          await new Promise((r) => setTimeout(r, 1500 * attempt));
        }
        if (lastErr) throw new Error(`Upload ${path}: ${lastErr}`);
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        urlMap[a.rel] = data.publicUrl;
        done += 1;
        if (done % 10 === 0 || blob.size > 1024 * 1024) push(`↑ ${done}/${parsed.assetEntries.length} ${a.rel} (${fmtMb(blob.size)})`);
      }
      push(`Storage: ${done} файл орлоо.`);

      const resolved = resolvePackageAssets(parsed.pkg, urlMap);
      const r = await fetch("/api/admin/mock-tests/import", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: resolved, mode: "upsert" }),
      });
      const body = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        errors?: string[];
        warnings?: string[];
        questions?: number;
      };
      if (!r.ok || !body.ok) throw new Error((body.errors ?? [`HTTP ${r.status}`]).join("; "));
      push(`✅ ${parsed.pkg.test_id}: ${body.questions} асуулт DB-д орлоо. Шалгах: /review/practice/${parsed.pkg.test_id}`);
      if (body.warnings?.length) push(`⚠️ ${body.warnings.length} анхааруулга (дээр жагсаасан).`);
    } catch (e) {
      push(`❌ ${e instanceof Error ? e.message : "Импорт амжилтгүй."}`);
    } finally {
      setBusy(false);
    }
  }

  async function runPatch() {
    if (busy || !patchText.trim()) return;
    setBusy(true);
    setLog([]);
    try {
      const pkg = JSON.parse(patchText);
      const r = await fetch("/api/admin/mock-tests/import", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: pkg, mode: "patch" }),
      });
      const body = (await r.json().catch(() => ({}))) as { ok?: boolean; updated?: number; errors?: string[] };
      if (!r.ok) throw new Error((body.errors ?? [`HTTP ${r.status}`]).join("; "));
      push(`${body.ok ? "✅" : "⚠️"} ${pkg.test_id}: ${body.updated ?? 0} асуулт шинэчлэгдлээ.`);
      (body.errors ?? []).forEach((e) => push(`  · ${e}`));
    } catch (e) {
      push(`❌ ${e instanceof Error ? e.message : "Patch амжилтгүй."}`);
    } finally {
      setBusy(false);
    }
  }

  const st = parsed?.report.stats;

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-base font-semibold text-slate-800">1. Zip багц (H41329.json + audio/ + images/)</h2>
        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          disabled={busy}
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        {parsed && st ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 sm:grid-cols-3">
            <div><span className="text-slate-500">Тест</span> <b>{parsed.pkg.test_id}</b> · HSK{parsed.pkg.hsk_level}</div>
            <div><span className="text-slate-500">Асуулт</span> {st.questions}</div>
            <div><span className="text-slate-500">Сонсгол</span> {st.listening} (цаг {st.withAudioSlice}, текст {st.withTranscript})</div>
            <div><span className="text-slate-500">Тайлбар</span> {st.withExplanation}</div>
            <div><span className="text-slate-500">Багшийн тэмдэглэл</span> {st.withTutorNote}</div>
            <div><span className="text-slate-500">Asset</span> {parsed.assetEntries.length} ({fmtMb(parsed.assetEntries.reduce((s, a) => s + a.size, 0))})</div>
            <div className="col-span-full text-slate-600">{parsed.pkg.title}</div>
            {parsed.missing.length ? (
              <div className="col-span-full text-rose-700">Zip-д алга: {parsed.missing.join(", ")}</div>
            ) : null}
            {parsed.report.warnings.length ? (
              <details className="col-span-full">
                <summary className="cursor-pointer text-amber-700">Анхааруулга {parsed.report.warnings.length}</summary>
                <ul className="mt-1 max-h-48 overflow-auto text-xs text-slate-600">
                  {parsed.report.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => void runImport()}
          disabled={busy || !parsed || parsed.missing.length > 0}
          className="self-start rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? "Оруулж байна…" : "Storage + DB-д оруулах"}
        </button>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-base font-semibold text-slate-800">2. Засвар (patch) — зөвхөн өгсөн талбаруудыг солино</h2>
        <textarea
          value={patchText}
          onChange={(e) => setPatchText(e.target.value)}
          rows={5}
          className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
          placeholder='{"test_id":"H41327","questions":[{"q_no":42,"explanation_mn":"…","tutor_note":{"why":"…"}}]}'
        />
        <button
          type="button"
          onClick={() => void runPatch()}
          disabled={busy || !patchText.trim()}
          className="self-start rounded-full bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
        >
          {busy ? "Шинэчилж байна…" : "Patch хийх"}
        </button>
      </section>

      {log.length ? (
        <ul className="rounded-xl bg-slate-50 p-3 text-sm text-slate-800">
          {log.map((m, i) => (
            <li key={i} className="whitespace-pre-wrap">{m}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
