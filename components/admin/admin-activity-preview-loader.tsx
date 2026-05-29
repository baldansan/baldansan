"use client";

import { useEffect, useState } from "react";
import { AdminActivityPreview } from "@/components/admin/admin-activity-preview";
import type {
  AdminActivityRow,
  AdminActivitySummary,
} from "@/lib/admin/admin-activity-shared";
import { summarizeActivityRows } from "@/lib/admin/admin-activity-summary";
import { fetchAdminActivityLogClient } from "@/lib/supabase/admin-activity-read";

const EMPTY_SUMMARY: AdminActivitySummary = summarizeActivityRows([]);

type Props = {
  recentLimit?: number;
};

export function AdminActivityPreviewLoader({ recentLimit = 5 }: Props) {
  const [rows, setRows] = useState<AdminActivityRow[]>([]);
  const [summary, setSummary] = useState<AdminActivitySummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await fetchAdminActivityLogClient({ limit: 200 });
      if (cancelled) return;
      setRows(result.rows);
      setSummary(result.summary);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="rounded-2xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-600 ring-1 ring-slate-200">
        Activity log ачааллаж байна…
      </p>
    );
  }

  return (
    <AdminActivityPreview
      summary={summary}
      recentRows={rows.slice(0, recentLimit)}
    />
  );
}

export function useAdminActivityClient(limit = 200): {
  rows: AdminActivityRow[];
  summary: AdminActivitySummary;
  warnings: string[];
  loading: boolean;
} {
  const [rows, setRows] = useState<AdminActivityRow[]>([]);
  const [summary, setSummary] = useState<AdminActivitySummary>(EMPTY_SUMMARY);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await fetchAdminActivityLogClient({ limit });
      if (cancelled) return;
      setRows(result.rows);
      setSummary(result.summary);
      setWarnings(result.warnings);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { rows, summary, warnings, loading };
}
