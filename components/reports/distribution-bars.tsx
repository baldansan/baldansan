import {
  LEARNER_GRADE_LABELS,
  LEARNER_GRADE_RANGES,
  type LearnerGradeBucket,
} from "@/lib/learner-grade";

type Props = {
  distribution: { bucket: LearnerGradeBucket; count: number }[];
  /** Printed under the chart when the counts need a caveat. */
  note?: string;
};

/**
 * Grade spread as inline SVG bars.
 *
 * Inline SVG rather than a chart library: the repo takes no new dependency for
 * this, and `fill="currentColor"` with a per-bucket opacity is the one fill
 * style that still reads as distinct shades once the print stylesheet has
 * flattened every colour to black.
 */

const BAR_OPACITY: Record<LearnerGradeBucket, number> = {
  A: 0.95,
  B: 0.78,
  C: 0.6,
  D: 0.42,
  F: 0.26,
  unrated: 0.12,
};

export function DistributionBars({ distribution, note }: Props) {
  const total = distribution.reduce((sum, entry) => sum + entry.count, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-slate-600">
        Үнэлгээ тооцогдсон сурагч алга тул тархалт харуулах зүйл алга.
      </p>
    );
  }

  return (
    <div className="print-keep">
      <ul className="flex flex-col gap-1.5">
        {distribution.map((entry) => {
          const share = Math.round((entry.count / total) * 100);
          return (
            <li key={entry.bucket} className="flex items-center gap-3 text-xs">
              <span className="w-32 shrink-0 font-medium text-slate-700">
                {LEARNER_GRADE_LABELS[entry.bucket]}
              </span>
              <svg
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                role="img"
                aria-label={`${LEARNER_GRADE_LABELS[entry.bucket]}: ${entry.count} сурагч, ${share}%`}
                className="h-2.5 flex-1 text-emerald-700"
              >
                <rect
                  x="0"
                  y="0"
                  width="100"
                  height="10"
                  fill="currentColor"
                  fillOpacity={0.06}
                />
                {entry.count > 0 ? (
                  <rect
                    x="0"
                    y="0"
                    width={Math.max(share, 1)}
                    height="10"
                    fill="currentColor"
                    fillOpacity={BAR_OPACITY[entry.bucket]}
                  />
                ) : null}
              </svg>
              <span className="w-20 shrink-0 text-right tabular-nums text-slate-700">
                {entry.count} · {share}%
              </span>
              <span className="hidden w-28 shrink-0 text-right text-slate-500 sm:inline">
                {LEARNER_GRADE_RANGES[entry.bucket]}
              </span>
            </li>
          );
        })}
      </ul>
      {note ? <p className="mt-2 text-xs text-slate-600">{note}</p> : null}
    </div>
  );
}
