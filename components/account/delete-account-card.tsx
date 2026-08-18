"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MobileCard } from "@/components/mobile/mobile-card";

const CONFIRM_WORD = "УСТГАХ";

/**
 * Permanent account deletion card (Settings → Account).
 * Required for Google Play / App Store compliance.
 */
export function DeleteAccountCard() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirmText.trim() !== CONFIRM_WORD || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string }
        | null;
      if (!response.ok || !payload?.ok) {
        setError(payload?.message ?? "Алдаа гарлаа. Дахин оролдоно уу.");
        setBusy(false);
        return;
      }
      // Account is gone — clear local progress copies too, then go home.
      try {
        window.localStorage.clear();
      } catch {
        // Storage may be unavailable — ignore.
      }
      router.replace("/home");
      router.refresh();
    } catch {
      setError("Сүлжээний алдаа гарлаа. Дахин оролдоно уу.");
      setBusy(false);
    }
  }

  return (
    <MobileCard padding="lg" className="mb-4 border-red-200">
      <h2 className="text-sm font-bold text-red-700">Бүртгэл устгах</h2>
      <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
        Бүртгэл устгавал таны имэйл, сурах явц, оноо бүгд бүрмөсөн устана —
        сэргээх боломжгүй.
      </p>

      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          Бүртгэл устгах…
        </button>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <label className="text-xs text-[var(--app-muted)]">
            Баталгаажуулахын тулд{" "}
            <span className="font-bold text-red-600">{CONFIRM_WORD}</span> гэж
            бичнэ үү:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={CONFIRM_WORD}
            className="rounded-[14px] border border-[var(--app-border)] bg-white px-3 py-2.5 text-sm"
            autoComplete="off"
          />
          {error ? (
            <p className="text-xs font-semibold text-red-600">{error}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={confirmText.trim() !== CONFIRM_WORD || busy}
              className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-200"
            >
              {busy ? "Устгаж байна…" : "Бүрмөсөн устгах"}
            </button>
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setConfirmText("");
                setError(null);
              }}
              disabled={busy}
              className="rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--app-muted)]"
            >
              Болих
            </button>
          </div>
        </div>
      )}
    </MobileCard>
  );
}
