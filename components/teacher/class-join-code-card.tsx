"use client";

import { useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { regenerateClassroomJoinCode } from "@/lib/supabase/classrooms";

function pretty(code: string) {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

/** Ангийн 6 оронтой код — сурагчид бүртгүүлэхдээ/нэгдэхдээ оруулна. */
export function ClassJoinCodeCard({
  classroomId,
  code,
  compact = false,
}: {
  classroomId: string;
  code: string | null;
  compact?: boolean;
}) {
  const locale = useUiLocale();
  const [current, setCurrent] = useState<string | null>(code);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copy() {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function regenerate() {
    if (busy) return;
    if (!window.confirm(tr(locale, "Шинэ код үүсгэвэл хуучин код ажиллахаа болино. Үргэлжлүүлэх үү?"))) return;
    setBusy(true);
    setError(null);
    const { data, error: err } = await regenerateClassroomJoinCode(classroomId);
    setBusy(false);
    if (err || !data) {
      setError(err ?? tr(locale, "Код үүсгэж чадсангүй."));
      return;
    }
    setCurrent(data);
  }

  if (!current) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        {tr(locale, "Ангийн код хараахан байхгүй — Supabase дээр 064 migration-ийг ажиллуулна уу.")}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-emerald-200 bg-emerald-50 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            {tr(locale, "Ангийн код")}
          </p>
          <p className="font-mono text-3xl font-black tracking-[0.2em] text-emerald-900" translate="no">
            {pretty(current)}
          </p>
          {!compact ? (
            <p className="mt-1 text-xs text-emerald-800">
              {tr(locale, "Сурагчид бүртгүүлэхдээ эсвэл «Ангид орох» хэсэгт энэ кодыг оруулаад шууд ангид нэгдэнэ.")}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={copy} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-300">
            {copied ? tr(locale, "Хуулагдлаа ✓") : tr(locale, "Хуулах")}
          </button>
          <button
            type="button"
            onClick={regenerate}
            disabled={busy}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-300 disabled:opacity-50"
          >
            {busy ? "…" : tr(locale, "Шинэ код")}
          </button>
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
