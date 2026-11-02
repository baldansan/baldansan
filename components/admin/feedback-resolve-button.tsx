"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FeedbackResolveButton({ id, resolved }: { id: string; resolved: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/feedback/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], resolved: !resolved }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Алдаа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
          resolved
            ? "bg-emerald-600 text-white ring-emerald-600 hover:bg-emerald-700"
            : "bg-white text-emerald-700 ring-emerald-300 hover:bg-emerald-50"
        } disabled:opacity-60`}
      >
        {busy ? "…" : resolved ? "✓ Засагдсан" : "Засагдсан гэж тэмдэглэх"}
      </button>
      {err ? <span className="text-xs text-rose-600">{err}</span> : null}
    </span>
  );
}
