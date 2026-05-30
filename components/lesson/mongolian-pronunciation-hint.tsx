type Props = {
  pronunciation: string | null;
  className?: string;
};

/** Compact Mongolian pronunciation hint for Korean learners. */
export function MongolianPronunciationHint({
  pronunciation,
  className = "",
}: Props) {
  if (!pronunciation) return null;

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">
        Монгол дуудлага
      </span>
      <span className="inline-flex max-w-full rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-900 ring-1 ring-sky-200">
        {pronunciation}
      </span>
    </div>
  );
}

type MeaningProps = {
  meaning: string | null;
  className?: string;
};

export function MongolianMeaningHint({ meaning, className = "" }: MeaningProps) {
  if (!meaning) return null;

  return (
    <p className={`text-sm leading-relaxed text-slate-600 ${className}`}>
      <span className="font-semibold text-slate-700">Утга/тайлбар: </span>
      {meaning}
    </p>
  );
}
