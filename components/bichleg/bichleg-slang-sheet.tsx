"use client";

import type { SubtitleSlangNote } from "@/lib/bichleg/types";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

type Props = {
  note: SubtitleSlangNote;
  onClose: () => void;
};

function registerClass(register: string): string {
  if (register === "наргиа") return "bs-bl-slang-register--slang";
  return "bs-bl-slang-register--colloquial";
}

export function BichlegSlangSheet({ note, onClose }: Props) {
  const locale = useUiLocale();
  return (
    <div className="bs-bichleg-sheet-backdrop" onClick={onClose}>
      <div
        className="bs-bichleg-sheet bs-bichleg-sheet--slang"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="bs-bichleg-sheet-title">{tr(locale, "Залуусын хэллэг")}</p>
        <div className="bs-bl-slang-head">
          {note.term ? (
            <p className="bs-bl-slang-term hanzi">{note.term}</p>
          ) : null}
          {note.register ? (
            <span className={`bs-bl-slang-register ${registerClass(note.register)}`}>
              {note.register}
            </span>
          ) : null}
        </div>
        {note.meaning ? (
          <p className="bs-bl-slang-meaning">{note.meaning}</p>
        ) : null}
        {note.usage ? <p className="bs-bl-slang-usage">{note.usage}</p> : null}
        <button
          type="button"
          className="bs-bichleg-sheet-btn bs-bichleg-sheet-btn--full"
          onClick={onClose}
        >
          {tr(locale, "▶ Үргэлжлүүлэх")}
        </button>
      </div>
    </div>
  );
}
