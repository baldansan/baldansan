"use client";

type Props = {
  label: string;
  sublabel?: string;
  selected?: boolean;
  state?: "default" | "correct" | "wrong" | "disabled" | "selected";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  /** PC гарын товч (1-4) — bs-desk-only, утсан дээр нуугдана. */
  hotkey?: string;
};

const stateClass = {
  default: "app-game-option",
  correct: "app-game-option app-game-option-correct",
  wrong: "app-game-option app-game-option-wrong",
  disabled: "app-game-option opacity-50",
  selected: "app-game-option app-game-option-selected",
};

export function GameOptionButton({
  label,
  sublabel,
  selected,
  state = "default",
  onClick,
  disabled,
  className = "",
  hotkey,
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
      className={`${stateClass[resolved]} ${className}${hotkey ? " app-game-option--hotkey" : ""}`}
      translate="no"
    >
      {hotkey ? <kbd className="app-game-hotkey" aria-hidden>{hotkey}</kbd> : null}
      <span className="block text-base font-semibold">{label}</span>
      {sublabel ? (
        <span className="mt-0.5 block text-xs text-[var(--app-muted)]">
          {sublabel}
        </span>
      ) : null}
    </button>
  );
}
