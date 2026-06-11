"use client";

import type { WordPracticeMode } from "@/lib/review/word-practice-types";

const TITLES: Record<WordPracticeMode, string> = {
  radical: "Задлах дасгал дууслаа",
  stroke: "Зурлагын дасгал дууслаа",
  "meaning-match": "Утга тааруулах дууслаа",
  "srs-retry": "Давталт дууслаа",
};

type Props = {
  mode: WordPracticeMode;
  detail?: string;
  onPlayAgain: () => void;
  onBackToSummary: () => void;
};

export function WordPracticeDonePanel({
  mode,
  detail,
  onPlayAgain,
  onBackToSummary,
}: Props) {
  return (
    <div className="bs-srs-done">
      <h2 className="text-xl font-bold text-[var(--app-text)]">
        ✅ {TITLES[mode]}
      </h2>
      {detail ? (
        <p className="mt-2 text-sm text-[var(--app-muted)]">{detail}</p>
      ) : null}
      <button
        type="button"
        onClick={onPlayAgain}
        className="mt-5 min-h-[48px] w-full rounded-[14px] bg-[var(--app-primary)] text-sm font-extrabold text-white"
      >
        Дахин тоглох
      </button>
      <button
        type="button"
        onClick={onBackToSummary}
        className="mt-3 min-h-[48px] w-full rounded-[14px] bg-[#eaf0ed] text-sm font-extrabold text-[#3b473f]"
      >
        Дүгнэлт рүү буцах
      </button>
    </div>
  );
}
