"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export function ReportResolveButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
      onClick={async () => {
        if (!supabase) return;
        setBusy(true);
        await supabase
          .from("dictionary_reports")
          .update({ status: "resolved", resolved_at: new Date().toISOString() })
          .eq("id", id);
        setBusy(false);
        router.refresh();
      }}
    >
      Шийдсэн ✓
    </button>
  );
}
