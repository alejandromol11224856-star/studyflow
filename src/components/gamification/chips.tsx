import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn, pluralize } from "@/lib/utils";

/** 🔥 racha actual. La llama se mueve suavemente si hoy ya se cumplió. */
export function StreakChip({ days, today, className }: { days: number; today: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold",
        days > 0 ? "bg-streak-soft text-streak-text" : "bg-muted text-muted-foreground",
        className,
      )}
      title={days > 0 ? `Racha de ${days} ${pluralize(days, "día")}${today ? " (hoy cumplido)" : ""}` : "Sin racha todavía"}
    >
      <span aria-hidden className={cn("inline-block text-base leading-none", days > 0 && today && "animate-flame")}>
        🔥
      </span>
      <span className="tabular">
        {days} {pluralize(days, "día")}
      </span>
    </span>
  );
}

/** ⭐ nivel con una mini barra de XP. */
export function LevelChip({ level, ratio, href, className }: { level: number; ratio: number; href?: string; className?: string }) {
  const content = (
    <>
      <span aria-hidden className="text-base leading-none">
        ⭐
      </span>
      <span>Nivel {level}</span>
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--xp)_22%,transparent)]" aria-hidden>
        <span className="block h-full rounded-full bg-[image:var(--gradient-xp)] transition-[width] duration-700" style={{ width: `${Math.round(Math.min(1, ratio) * 100)}%` }} />
      </span>
    </>
  );
  const classes = cn(
    "inline-flex items-center gap-1.5 rounded-full bg-xp-soft px-3 py-1.5 text-[13px] font-bold text-xp-text",
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
 * Dato simple con emoji grande. La tendencia hacia abajo se muestra en gris
 * (sin rojo): la idea es informar, no culpar.
 */
export function StatTile({
  emoji,
  label,
  value,
  hint,
  trend,
  className,
}: {
  emoji: string;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** Variación vs el período anterior (0.12 = +12%). */
  trend?: number | null;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5", className)}>
      <div className="flex items-start justify-between gap-2">
        <span aria-hidden className="flex size-11 items-center justify-center rounded-2xl bg-muted text-[22px]">
          {emoji}
        </span>
        {trend !== undefined && trend !== null && Number.isFinite(trend) && Math.abs(trend) >= 0.01 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold tabular",
              trend > 0 ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
            )}
            title="Comparado con el período anterior"
          >
            {trend > 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.round(Math.abs(trend) * 100)}%
          </span>
        )}
      </div>
      <p className="mt-3 truncate text-2xl font-extrabold tracking-tight tabular sm:text-[26px]">{value}</p>
      <p className="text-[13px] font-semibold text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
