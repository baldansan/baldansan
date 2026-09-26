"use client";

import { useEffect, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { joinClassroomByCode, peekClassroomByCode } from "@/lib/supabase/classrooms";

type Props = {
  initialCode?: string;
  /** Нэвтрээгүй үед: зөвхөн шалгаад кодыг буцаана (бүртгэлийн дэлгэц). */
  mode?: "join" | "peek";
  onCodeChange?: (code: string, className: string | null) => void;
  onJoined?: (classroomName: string) => void;
};

/** 6 оронтой ангийн код оруулах талбар: ангийн нэрийг шууд харуулна. */
export function JoinClassForm({ initialCode = "", mode = "join", onCodeChange, onJoined }: Props) {
  const locale = useUiLocale();
  const [code, setCode] = useState(initialCode.replace(/\D/g, "").slice(0, 6));
  const [className, setClassName] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setClassName(null);
    setOrgName(null);
    setError(null);
    if (code.length !== 6) {
      onCodeChange?.(code, null);
      return;
    }
    setChecking(true);
    peekClassroomByCode(code).then((res) => {
      if (!alive) return;
      setChecking(false);
      if (res) {
        setClassName(res.classroomName);
        setOrgName(res.organizationName);
        onCodeChange?.(code, res.classroomName);
      } else {
        setError(tr(locale, "Ийм кодтой анги олдсонгүй."));
        onCodeChange?.(code, null);
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function join() {
    if (code.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    const { data, error: err } = await joinClassroomByCode(code);
    setBusy(false);
    if (err || !data) {
      setError(err ?? tr(locale, "Нэгдэж чадсангүй."));
      return;
    }
    setDone(data.classroomName);
    onJoined?.(data.classroomName);
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
        ✓ {tr(locale, "Та ангид нэгдлээ:")} <strong translate="no">{done}</strong>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--app-text)]">
        {tr(locale, "Ангийн код")}{" "}
        <span className="text-xs font-normal text-[var(--app-muted)]">
          ({tr(locale, "багшаас авсан 6 оронтой тоо")})
        </span>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="482917"
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-lg tracking-[0.25em]"
        />
      </label>
      {checking ? <p className="text-xs text-[var(--app-muted)]">{tr(locale, "Шалгаж байна…")}</p> : null}
      {className ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900" translate="no">
          🏫 {className}
          {orgName ? ` · ${orgName}` : ""}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {mode === "join" ? (
        <button
          type="button"
          onClick={join}
          disabled={busy || code.length !== 6 || !className}
          className="app-btn-primary w-full disabled:opacity-50"
        >
          {busy ? tr(locale, "Нэгдэж байна…") : tr(locale, "Ангид орох")}
        </button>
      ) : null}
    </div>
  );
}
