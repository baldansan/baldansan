"use client";

import { useRef, useState } from "react";

type Resp = {
  ok?: boolean;
  error?: string;
  total?: number;
  pending?: number;
  pendingBefore?: number;
  processed?: number;
  done?: number;
  failed?: Array<{ path: string; error?: string }>;
  nextCursor?: number;
  remaining?: number;
  ms?: number;
};

const BUCKETS = ["lesson-media", "hsk-mock-media", "hsk-audio"];

export function StorageRecacheClient() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [doneTotal, setDoneTotal] = useState(0);
  const stopRef = useRef(false);

  const push = (line: string) => setLog((l) => [...l.slice(-200), line]);

  async function call(body: Record<string, unknown>): Promise<Resp> {
    const r = await fetch("/api/admin/storage/recache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await r.json()) as Resp;
  }

  async function check() {
    setRunning(true);
    for (const bucket of BUCKETS) {
      const r = await call({ bucket, dryRun: true });
      push(r.error ? `${bucket}: АЛДАА — ${r.error}` : `${bucket}: нийт ${r.total}, кэш шинэчлэх шаардлагатай ${r.pending}`);
    }
    setRunning(false);
  }

  async function run() {
    setRunning(true);
    stopRef.current = false;
    let total = 0;
    for (const bucket of BUCKETS) {
      let cursor = 0;
      for (;;) {
        if (stopRef.current) break;
        const r = await call({ bucket, cursor, batch: 20 });
        if (r.error) {
          push(`${bucket}: АЛДАА — ${r.error}`);
          break;
        }
        total += r.done ?? 0;
        setDoneTotal(total);
        push(
          `${bucket}: +${r.done} (алдаа ${r.failed?.length ?? 0}), үлдсэн ${r.remaining}, ${Math.round((r.ms ?? 0) / 1000)}с`
        );
        for (const f of r.failed ?? []) push(`  ✗ ${f.path}: ${f.error ?? ""}`);
        cursor = r.nextCursor ?? cursor;
        if ((r.remaining ?? 0) <= 0 || (r.processed ?? 0) === 0) break;
      }
    }
    push(`Дууслаа — нийт ${total} файл 1 жилийн кэштэй боллоо.`);
    setRunning(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-xl font-semibold">Storage кэш шинэчлэх (аудио/зураг → 1 жил)</h1>
      <p className="text-sm text-slate-600">
        Supabase Storage-ийн файлуудыг <code>cache-control: max-age=31536000</code>-тэй дахин бичнэ. Үүний дараа
        CDN аудиог кэшилж, хичээлийн аудио эхлэх хугацаа 2–4с → 0.2с болно. 1 GB орчим — 10–20 минут үргэлжилнэ,
        таб хаахгүй хүлээнэ. Дахин ажиллуулахад аль хэдийн шинэчлэгдсэн файлыг алгасна.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={check}
          disabled={running}
          className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
        >
          Шалгах (dry run)
        </button>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {running ? `Ажиллаж байна… (${doneTotal})` : "Бүгдийг шинэчлэх"}
        </button>
        {running ? (
          <button type="button" onClick={() => (stopRef.current = true)} className="rounded-lg border px-4 py-2 text-sm">
            Зогсоох
          </button>
        ) : null}
      </div>
      <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
        {log.length ? log.join("\n") : "—"}
      </pre>
    </div>
  );
}
