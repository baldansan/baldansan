type Props = {
  direction: "back" | "forward";
  className?: string;
};

export function BichlegSkipIcon({ direction, className = "" }: Props) {
  const isBack = direction === "back";
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      {isBack ? (
        <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
      ) : (
        <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
      )}
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="7"
        fontWeight="800"
        fill="currentColor"
      >
        3
      </text>
    </svg>
  );
}
