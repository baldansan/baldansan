"use client";

type Props = {
  label: string;
  sublabel?: string;
  selected?: boolean;
  state?: "default" | "correct" | "wrong" | "disabled" | "selected";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

const stateClass = {
  default:
    "border-[var(--app-border)] bg-white text-[var(--app-text)] active:bg-slate-50",
  correct: "border-emerald-400 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-300",
  wrong: "border-red-400 bg-red-50 text-red-800 ring-2 ring-red-300",
  disabled: "border-slate-200 bg-slate-100 text-slate-400",
  selected: "border-purple-400 bg-purple-50 text-purple-800 ring-2 ring-purple-200",
};

export function GameOptionButton({
  label,
  sublabel,
  selected,
  state = "default",
  onClick,
  disabled,
  className = "",
}: Props) {
  const resolved =
    disabled && state === "default"
      ? "disabled"
      : state !== "default"
        ? state
        : selected
          ? "selected"
          : "default";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || (state !== "default" && state !== "selected")}
      className={`min-h-[52px] w-full rounded-2xl border px-4 py-3 text-left transition-colors ${stateClass[resolved]} ${className}`}
    >
      <span className="block text-base font-semibold">{label}</span>
      {sublabel ? (
        <span className="mt-0.5 block text-xs text-[var(--app-muted)]">
          {sublabel}
        </span>
      ) : null}
    </button>
  );
}
