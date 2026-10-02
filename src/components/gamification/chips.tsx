import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { StreakMark, XpMark } from "@/components/brand/marks";
import { cn, pluralize } from "@/lib/utils";

/** Constancia: días seguidos. Los eslabones se encienden si hoy ya está cumplido. */
export function StreakChip({ days, today, className }: { days: number; today: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold",
        days > 0 ? "bg-streak-soft text-streak-text" : "bg-muted text-muted-foreground",
        className,
      )}
      title={days > 0 ? `Constancia: ${days} ${pluralize(days, "día")} seguidos${today ? " (hoy cumplido)" : ""}` : "Todavía sin días seguidos"}
    >
      <StreakMark className={cn("size-4", days > 0 && !today && "opacity-70")} />
      <span className="tabular">
        {days} {pluralize(days, "día")}
      </span>
    </span>
  );
}

/** Nivel con una mini barra de XP. */
export function LevelChip({ level, ratio, href, className }: { level: number; ratio: number; href?: string; className?: string }) {
  const content = (
    <>
      <XpMark className="size-3.5" />
      <span>Nivel {level}</span>
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--xp)_24%,transparent)]" aria-hidden>
        <span className="block h-full rounded-full bg-xp transition-[width] duration-700" style={{ width: `${Math.round(Math.min(1, ratio) * 100)}%` }} />
      </span>
    </>
  );
  const classes = cn(
    "inline-flex h-8 items-center gap-1.5 rounded-full bg-xp-soft px-3 text-[13px] font-semibold text-xp-text",
    href && "transition hover:brightness-95 active:scale-95 dark:hover:brightness-125",
    className,
  );
  return href ? (
    <Link href={href} className={classes} aria-label={`Nivel ${level}: ${Math.round(ratio * 100)}% hacia el siguiente. Ver progreso`}>
      {content}
    </Link>
  ) : (
    <span className={classes}>{content}</span>
  );
}

/**
 * Variación contra el período anterior. Hacia abajo se muestra en gris (sin
 * rojo): la idea es informar, no culpar.
 */
export function TrendBadge({
  trend,
  unit = "percent",
  className,
}: {
  trend: number | null | undefined;
  /** percent: variación relativa (0.12 = 12%). points: diferencia entre dos porcentajes (0.05 = 5 pts). */
  unit?: "percent" | "points";
  className?: string;
}) {
  if (trend === undefined || trend === null || !Number.isFinite(trend)) return null;
  // El signo lo da la flecha (sin "+" ni "−"); lo que redondea a 0 no se muestra.
  const n = Math.round(Math.abs(trend) * 100);
  if (n === 0) return null;
  const amount = n > 999 ? "999+" : String(n);
  const label = unit === "points" ? `${amount} ${n === 1 ? "pt" : "pts"}` : `${amount}%`;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold tabular",
        trend > 0 ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
        className,
      )}
      title={`${trend > 0 ? "Más" : "Menos"} que en el período anterior`}
    >
      {trend > 0 ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
      <span className="sr-only">{trend > 0 ? "Subió " : "Bajó "}</span>
      {label}
    </span>
  );
}

/** Dato con su ícono, sin caja: para filas de métricas con mucho aire. */
export function StatTile({
  icon,
  label,
  value,
  hint,
  trend,
  trendUnit,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** Variación vs el período anterior (0.12 = +12%). */
  trend?: number | null;
  trendUnit?: "percent" | "points";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="shrink-0 [&_svg]:size-4">{icon}</span>
        <span className="truncate text-[13px] font-semibold">{label}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="max-w-full truncate font-display text-[26px] font-semibold leading-none sm:text-[30px]" title={typeof value === "string" ? value : undefined}>
          {value}
        </p>
        <TrendBadge trend={trend} unit={trendUnit} />
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
