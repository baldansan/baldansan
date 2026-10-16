"use client";

import { useEffect, useState } from "react";
import {
  getCurrentTeacherProfile,
  setWeeklyReportEnabled,
} from "@/lib/supabase/classrooms";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

/** Долоо хоногийн имэйл тайлан илгээх эсэхийг багш өөрөө идэвхжүүлэх/унтраах товч. */
export function WeeklyReportToggle() {
  const locale = useUiLocale();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await getCurrentTeacherProfile();
      if (!cancelled) setEnabled(data?.weeklyReportEnabled ?? true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggle() {
    if (enabled == null || saving) return;
    const next = !enabled;
    setSaving(true);
    setEnabled(next);
    const { error } = await setWeeklyReportEnabled(next);
    setSaving(false);
    if (error) {
      setEnabled(!next);
    }
  }

  if (enabled == null) return null;

  return (
    <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--app-border)] bg-white px-4 py-3">
      <div className="min-w-0 pr-3">
        <p className="text-sm font-semibold text-[var(--app-text)]">
          📧 {tr(locale, "Долоо хоногийн имэйл тайлан")}
        </p>
        <p className="mt-0.5 text-xs text-[var(--app-muted)]">
          {tr(
            locale,
            "Даваа бүр ангийн дундаж оноо, идэвхгүй сурагчдын мэдээллийг имэйлээр авна."
          )}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={saving}
        onClick={handleToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-emerald-500" : "bg-gray-300"
        } disabled:opacity-60`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
