import { C, toneColor, type Tone } from "./tokens";
import { Sparkline } from "./Sparkline";

type Props = {
  label: string;
  value: string;
  /** Change vs previous period. Null hides it and shows `hint` instead. */
  delta?: number | null;
  /** Unit appended to the delta, e.g. "%" or " оноо". */
  deltaUnit?: string;
  /** Lower-is-better metrics flip the colour of the arrow. */
  invertDelta?: boolean;
  hint?: string;
  spark?: (number | null)[];
};

/** Headline number: value, ▲▼ delta (good=green, bad=red), optional sparkline. */
export function StatTile({ label, value, delta, deltaUnit = "", invertDelta, hint, spark }: Props) {
  let tone: Tone = "neutral";
  if (delta != null && delta !== 0) tone = delta > 0 !== Boolean(invertDelta) ? "good" : "bad";
  const arrow = delta == null ? "" : delta > 0 ? "▲" : delta < 0 ? "▼" : "■";
  const abs = delta == null ? 0 : Math.abs(Math.round(delta * 10) / 10);
  return (
    <div className="print-box rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-3xl font-bold tracking-tight tabular-nums" style={{ color: C.ink }}>
          {value}
        </p>
        {spark ? (
          <div className="w-20 shrink-0 pb-1">
            <Sparkline values={spark} />
          </div>
        ) : null}
      </div>
      <p className="mt-1 min-h-4 text-xs" style={{ color: delta == null ? C.muted : toneColor(tone) }}>
        {delta == null ? (
          (hint ?? "")
        ) : (
          <>
            <span aria-hidden="true">{arrow} </span>
            <span className="font-semibold">
              {delta > 0 ? "+" : delta < 0 ? "−" : ""}
              {abs}
              {deltaUnit}
            </span>
            <span className="text-slate-500"> {hint ?? "өмнөх 7 хоногоос"}</span>
          </>
        )}
      </p>
    </div>
  );
}
