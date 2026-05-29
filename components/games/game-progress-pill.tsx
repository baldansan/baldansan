type Props = {
  current: number;
  total: number;
};

export function GameProgressPill({ current, total }: Props) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="mb-4">
      <div className="mb-1 flex justify-between text-xs font-semibold text-[var(--app-muted)]">
        <span>
          {current}/{total}
        </span>
        <span className="text-[var(--app-purple-dark)]">{pct}%</span>
      </div>
      <div className="app-game-progress-track">
        <div
          className="app-game-progress-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
