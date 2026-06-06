"use client";

import { orderHintFromStructure } from "@/lib/games/radical-game-data";

type HanziEntry = {
  char: string;
  pinyin: string;
  meaning_mn: string;
  answer: string[];
  structure: string;
};

type Props = {
  entry: HanziEntry;
  hideHanzi: boolean;
  revealed: boolean;
  onToggleHide: () => void;
  badge?: string;
  extraHint?: string;
};

export function structureGuideText(structure: string, partCount: number): string {
  return `${partCount} хэсэг · ${orderHintFromStructure(structure)}`;
}

export function RadicalHanziToggle({
  hideHanzi,
  onToggle,
  disabled = false,
}: {
  hideHanzi: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-extrabold text-[var(--app-text)] shadow-sm disabled:opacity-50"
    >
      {hideHanzi ? "👁 Ханз харах" : "🙈 Ханз нуух"}
    </button>
  );
}

export function RadicalHanziPanel({
  entry,
  hideHanzi,
  revealed,
  onToggleHide,
  badge = "Шинэ",
  extraHint,
}: Props) {
  const showChar = !hideHanzi || revealed;
  const guide = structureGuideText(entry.structure, entry.answer.length);

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <p
            className={`shrink-0 font-[family-name:var(--font-noto-sc,'Noto Sans SC',sans-serif)] font-black leading-none tracking-[3px] ${
              showChar ? "text-[66px]" : "text-[66px] text-[#9fb0a7]"
            }`}
          >
            {showChar ? entry.char : "❓"}
          </p>
          <div className="min-w-0">
            <p className="text-lg font-bold text-[var(--app-text)]">{entry.pinyin}</p>
            <p
              className={`mt-1 leading-snug text-[var(--app-muted)] ${
                hideHanzi && !revealed ? "text-base font-bold text-[#33433b]" : "text-[13px]"
              }`}
            >
              {entry.meaning_mn}
            </p>
            {hideHanzi && !revealed ? (
              <p className="mt-2 rounded-xl bg-[var(--app-primary-light)] px-2.5 py-1.5 text-[11px] font-extrabold text-[var(--app-primary-dark)]">
                {guide}
              </p>
            ) : null}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--app-primary-light)] px-2.5 py-1 text-[11px] font-extrabold text-[var(--app-primary-dark)]">
          {badge}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <RadicalHanziToggle hideHanzi={hideHanzi} onToggle={onToggleHide} />
        {showChar && hideHanzi ? (
          <span className="text-[10px] font-bold text-[var(--app-primary-dark)]">
            Ханз нээгдлээ
          </span>
        ) : null}
      </div>

      {!hideHanzi || revealed ? (
        <p className="mt-2 text-[11px] text-[var(--app-muted)]">
          Дараалал: {orderHintFromStructure(entry.structure)}
          {extraHint ?? ""}
        </p>
      ) : null}
    </>
  );
}
