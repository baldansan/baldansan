import {
  LEARNER_GRADE_LABELS,
  LEARNER_GRADE_TONES,
  type LearnerGradeBucket,
} from "@/lib/learner-grade";

type Props = {
  grade: LearnerGradeBucket;
  /** "short" prints just the letter; "full" prints «A — Маш сайн». */
  variant?: "short" | "full";
};

/**
 * A grade badge that survives printing: on screen it is the app's coloured
 * chip, on paper the print stylesheet strips the tint and `print-chip` puts a
 * hairline box around it so it is still readable in black and white.
 */
export function GradeChip({ grade, variant = "full" }: Props) {
  const label =
    variant === "short"
      ? grade === "unrated"
        ? "—"
        : grade
      : LEARNER_GRADE_LABELS[grade];

  return (
    <span
      className={`print-chip inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${LEARNER_GRADE_TONES[grade]}`}
      title={LEARNER_GRADE_LABELS[grade]}
    >
      {label}
    </span>
  );
}
