"use client";

import { useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

type Props = {
  /** 4 оронтой PIN бүрэн болмогц дуудагдана. */
  onComplete: (pin: string) => void;
  busy?: boolean;
  error?: string | null;
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"] as const;

/** Хүүхдэд зориулсан том товчтой 4 оронтой PIN оруулагч. Цэвэрлэхдээ `key`-г солино. */
export function KidPinPad({ onComplete, busy = false, error }: Props) {
  const locale = useUiLocale();
  const [pin, setPin] = useState("");

  function press(key: string) {
    if (busy) return;
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!key || pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 4) onComplete(next);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3" aria-label={tr(locale, "PIN код")}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full ${
              i < pin.length ? "bg-emerald-500" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      {error ? <p className="text-center text-sm text-red-700">{error}</p> : null}
      {busy ? (
        <p className="text-sm text-[var(--app-muted)]">{tr(locale, "Нэвтэрч байна...")}</p>
      ) : null}
      <div className="grid w-full max-w-[280px] grid-cols-3 gap-3">
        {KEYS.map((key, i) =>
          key ? (
            <button
              key={`${key}-${i}`}
              type="button"
              onClick={() => press(key)}
              disabled={busy}
              aria-label={key === "⌫" ? tr(locale, "Устгах") : key}
              className="flex h-16 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-[var(--app-text)] shadow-sm ring-1 ring-slate-200 active:bg-emerald-50 disabled:opacity-50"
            >
              {key}
            </button>
          ) : (
            <span key={`empty-${i}`} />
          )
        )}
      </div>
    </div>
  );
}
