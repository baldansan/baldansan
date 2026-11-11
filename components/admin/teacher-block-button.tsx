"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function TeacherBlockButton({ userId, blocked }: { userId: string; blocked: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function toggle() {
    if (!supabase || busy) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.rpc("admin_set_teacher_blocked", {
      p_user: userId,
      p_blocked: !blocked,
    });
    setBusy(false);
    if (error) setErr(error.message);
    else router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          blocked ? "bg-red-100 text-red-800" : "bg-emerald-50 text-emerald-800"
        }`}
      >
        {blocked ? "Хаасан" : "Идэвхтэй"}
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={() => void toggle()}
        className="rounded-full px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
      >
        {busy ? "…" : blocked ? "Нээх" : "Хаах"}
      </button>
      {err ? <span className="text-xs text-red-600">{err}</span> : null}
    </span>
  );
}
