"use client";

/**
 * «Давталтад нэмэх үү?» — тогтоогүй ханзыг Давтах → Бичих хуваарьт САНАЛ БОЛГОНО.
 * ДҮРЭМ: автоматаар нэмэхгүй. Зөвхөн сурагч «нэмэх» товч дарахад сонгосон нь нэмэгдэнэ.
 */
import { useState } from "react";
import { MobileCard } from "@/components/mobile/mobile-card";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { setHanziInReview } from "@/lib/writing/hanzi-history";

type Meta = { pinyin?: string | null; meaning?: string | null };

type Props = {
  /** Санал болгох ханзууд (аль хэдийн давталтад байгааг дуудагч шүүсэн байна). */
  chars: string[];
  metaByCh?: Record<string, Meta>;
};

export function ReviewOfferCard({ chars, metaByCh }: Props) {
  const locale = useUiLocale();
  const [offered] = useState(chars);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(chars));
  const [state, setState] = useState<"ask" | "added" | "declined">("ask");
  const [added, setAdded] = useState(0);

  if (state === "added") {
    return (
      <MobileCard className="mb-4">
        <p className="text-sm font-bold text-[var(--app-text)]">
          ✓ {added} {tr(locale, "үг, ханз давталтад нэмэгдлээ")}
        </p>
        <p className="mt-0.5 text-xs text-[var(--app-muted)]">
          {tr(locale, "Давтах → Бичих хэсэгт хуваариараа гарч ирнэ. Ханзны дэвтрээс хэзээ ч хасаж болно.")}
        </p>
      </MobileCard>
    );
  }
  if (state === "declined" || offered.length === 0) return null;

  const count = offered.filter((c) => picked.has(c)).length;
  return (
    <MobileCard className="mb-4 ring-1 ring-amber-200">
      <p className="text-sm font-bold text-[var(--app-text)]">
        {tr(locale, "Тогтоогүйгээ давталтад нэмэх үү?")}
      </p>
      <p className="mt-0.5 text-xs text-[var(--app-muted)]">
        {tr(locale, "Нэмбэл Давтах → Бичих хэсэгт хэд хоногийн завсартай дахин гарч ирнэ. Нэмэхгүй бол юу ч өөрчлөгдөхгүй.")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {offered.map((c) => {
          const on = picked.has(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => {
                const next = new Set(picked);
                if (on) next.delete(c);
                else next.add(c);
                setPicked(next);
              }}
              className={`wn-offer-chip ${on ? "is-on" : ""}`}
              translate="no"
            >
              <span className="wn-offer-check" aria-hidden>
                ✓
              </span>
              {c}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={count === 0}
          onClick={() => {
            const chosen = offered.filter((c) => picked.has(c));
            setHanziInReview(chosen, true, metaByCh);
            setAdded(chosen.length);
            setState("added");
          }}
          className="app-btn-primary flex-1 disabled:opacity-50"
        >
          ＋ {count}-{tr(locale, "ийг нэмэх")}
        </button>
        <button
          type="button"
          onClick={() => setState("declined")}
          className="wn-btn-ghost"
        >
          {tr(locale, "Үгүй")}
        </button>
      </div>
    </MobileCard>
  );
}
