"use client";

import { useState } from "react";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

type Props = {
  /** id > 0 = hsk_words, id < 0 = dictionary_lexicon (−id) */
  wordId: number;
  simplified: string;
  currentMn: string | null;
};

/** «Буруу орчуулга» мэдэгдэх — нэвтэрсэн хэрэглэгч зөв утгыг санал болгоно. */
export function ReportWrongButton({ wordId, simplified, currentMn }: Props) {
  const locale = useUiLocale();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    if (!supabase) return;
    setBusy(true);
    setMsg(null);
    const { userId } = await getAuthenticatedUserId();
    if (!userId) {
      setMsg(tr(locale, "Мэдэгдэхийн тулд эхлээд нэвтэрнэ үү."));
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("dictionary_reports").insert({
      word_id: wordId > 0 ? wordId : null,
      lexicon_id: wordId < 0 ? -wordId : null,
      simplified,
      current_mn: currentMn,
      suggestion: text.trim() || null,
      user_id: userId,
    });
    setBusy(false);
    if (error) {
      setMsg(tr(locale, "Илгээж чадсангүй. Дахин оролдоно уу."));
      return;
    }
    setMsg(tr(locale, "Баярлалаа! Багш шалгана ✓"));
    setOpen(false);
    setText("");
  }

  return (
    <div className="mt-3">
      {!open ? (
        <button
          type="button"
          className="text-xs font-semibold text-[var(--app-muted)] underline decoration-dotted underline-offset-2 hover:text-[var(--app-text)]"
          onClick={() => {
            setOpen(true);
            setMsg(null);
          }}
        >
          ⚑ {tr(locale, "Буруу орчуулга мэдэгдэх")}
        </button>
      ) : (
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-3">
          <p className="text-xs font-semibold text-[var(--app-text)]">
            {tr(locale, "Зөв орчуулга юу байх ёстой вэ?")}
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={tr(locale, "Жишээ: зөв утга, тайлбар (заавал биш)")}
            className="mt-2 w-full rounded-xl border border-[var(--app-border)] bg-transparent p-2 text-sm"
          />
          <div className="mt-2 flex gap-2">
            <button type="button" className="app-btn-primary !min-h-[36px] !py-0 px-3 text-xs" disabled={busy} onClick={() => void submit()}>
              {busy ? "…" : tr(locale, "Илгээх")}
            </button>
            <button type="button" className="app-btn-secondary !min-h-[36px] !py-0 px-3 text-xs" onClick={() => setOpen(false)}>
              {tr(locale, "Болих")}
            </button>
          </div>
        </div>
      )}
      {msg ? <p className="mt-1 text-xs text-[var(--app-muted)]">{msg}</p> : null}
    </div>
  );
}
