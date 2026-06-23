type Props = {
  current: number;
  target: number;
  label: string;
  size?: number;
};

export function StudyPlanCircularProgress({
  current,
  target,
  label,
  size = 56,
}: Props) {
  const safeTarget = Math.max(target, 1);
  const pct = Math.min(1, current / safeTarget);
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const center = size / 2;

  return (
    <div className="bs-study-plan-ring">
      <div className="bs-study-plan-ring-chart" style={{ width: size, height: size }}>
        <svg width={size} height={size} aria-hidden>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e7f0ea"
            strokeWidth={stroke}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1FB85A"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </svg>
        <span className="bs-study-plan-ring-value">
          {current}/{target}
        </span>
      </div>
      <span className="bs-study-plan-ring-label">{label}</span>
    </div>
  );
}
