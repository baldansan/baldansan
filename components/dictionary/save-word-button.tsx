"use client";

import Link from "next/link";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

export type SaveState = {
  /** null = шалгаж байна; false = нэвтрээгүй */
  loggedIn: boolean | null;
  saved: boolean;
  busy: boolean;
};

/**
 * Толь бичгийн «＋ Цээжлэх үгсэд» товч.
 * icon — үр дүнгийн мөр дээрх жижиг дугуй; full — дэлгэрэнгүй хэсгийн бүтэн товч.
 * Дүрэм: үг хэзээ ч автоматаар нэмэгдэхгүй, нэмснийг дахин дарж хасна.
 */
export function SaveWordButton({
  variant,
  state,
  onToggle,
}: {
  variant: "icon" | "full";
  state: SaveState;
  onToggle: () => void;
}) {
  const locale = useUiLocale();
  const { loggedIn, saved, busy } = state;

  if (variant === "icon") {
    if (loggedIn === false) {
      return (
        <Link href="/login" className="bs-dict-save" aria-label={tr(locale, "Нэвтэрч үгээ хадгалах")}>
          ＋
        </Link>
      );
    }
    return (
      <button
        type="button"
        className={`bs-dict-save${saved ? " bs-dict-save--on" : ""}`}
        disabled={busy || loggedIn == null}
        onClick={onToggle}
        aria-pressed={saved}
        aria-label={saved ? tr(locale, "Цээжлэх үгсээс хасах") : tr(locale, "Цээжлэх үгсэд нэмэх")}
      >
        {busy ? "…" : saved ? "✓" : "＋"}
      </button>
    );
  }

  if (loggedIn === false) {
    return (
      <Link href="/login" className="bs-dict-save-full">
        {tr(locale, "Нэвтэрч үгээ хадгалах")}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={`bs-dict-save-full${saved ? " bs-dict-save-full--on" : ""}`}
      disabled={busy || loggedIn == null}
      onClick={onToggle}
      aria-pressed={saved}
    >
      {busy
        ? tr(locale, "Түр хүлээнэ үү…")
        : saved
          ? tr(locale, "✓ Нэмсэн · хасах")
          : `＋ ${tr(locale, "Цээжлэх үгсэд")}`}
    </button>
  );
}
