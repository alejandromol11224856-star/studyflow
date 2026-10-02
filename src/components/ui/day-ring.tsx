import { cn } from "@/lib/utils";

/**
 * Anillo del día: el avance hacia la meta como un reloj que se llena.
 * Marcas cada 1/12 (como horas), arco del acento y un punto en el extremo
 * que "avanza". Verde al cumplirse. El centro lo define quien lo usa.
 */
export function DayRing({
  value,
  size = 168,
  stroke = 12,
  label,
  children,
  className,
}: {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value));
  const done = pct >= 1;
  const c = size / 2;
  const r = c - stroke / 2 - 6;
  const circ = 2 * Math.PI * r;
  const angle = pct * 2 * Math.PI - Math.PI / 2;
  const tipX = c + r * Math.cos(angle);
  const tipY = c + r * Math.sin(angle);
  const color = done ? "var(--success)" : "var(--primary)";

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {/* Marcas tipo reloj */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
          const outer = c - 1;
          const inner = c - 5;
          return (
            <line
              key={i}
              x1={c + inner * Math.cos(a)}
              y1={c + inner * Math.sin(a)}
              x2={c + outer * Math.cos(a)}
              y2={c + outer * Math.sin(a)}
              stroke="var(--border)"
              strokeWidth={i % 3 === 0 ? 2 : 1.25}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          transform={`rotate(-90 ${c} ${c})`}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1), stroke 0.3s" }}
        />
        {pct > 0.015 && pct < 1 && (
          <circle cx={tipX} cy={tipY} r={stroke / 2 + 2.5} fill="var(--card)" stroke={color} strokeWidth={3} style={{ transition: "cx 0.9s, cy 0.9s" }} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
