"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type DateKey,
  type WeekStart,
  WEEKDAY_SHORT,
  addDaysKey,
  addMonthsKey,
  capitalize,
  eachDayKeys,
  formatKey,
  monthRange,
  weekRange,
} from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import { cn, pluralize } from "@/lib/utils";

/**
 * Nivel de intensidad 0..4 (escala secuencial de un solo tono).
 * Con objetivo: relativo a la meta del día. Sin objetivo: relativo al máximo.
 */
export function heatLevel(seconds: number, goalSeconds: number, maxSeconds: number) {
  if (seconds <= 0) return 0;
  const reference = goalSeconds > 0 ? goalSeconds : Math.max(maxSeconds, 1);
  const ratio = seconds / reference;
  if (goalSeconds > 0) {
    if (ratio >= 1.5) return 4;
    if (ratio >= 1) return 3;
    if (ratio >= 0.5) return 2;
    return 1;
  }
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

export const HEAT_CLASS = [
  "bg-muted/60 text-foreground",
  "bg-[var(--heat-1)] text-[var(--heat-fg-1)]",
  "bg-[var(--heat-2)] text-[var(--heat-fg-2)]",
  "bg-[var(--heat-3)] text-[var(--heat-fg-3)]",
  "bg-[var(--heat-4)] text-[var(--heat-fg-4)]",
];

export function HeatLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 text-[11px] text-muted-foreground", className)}>
      Menos
      {HEAT_CLASS.map((c, i) => (
        <span key={i} className={cn("size-3 rounded-[4px]", c)} />
      ))}
      Más
    </div>
  );
}

/** Leyenda de las marcas: línea = día cumplido (unidas = racha), punto = hábitos. */
export function CalendarMarksLegend({ habits = true, className }: { habits?: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground", className)}>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-[3px] w-5 rounded-full bg-streak" aria-hidden />
        Día cumplido · unidas, tu racha
      </span>
      {habits && (
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-foreground/70" aria-hidden />
          Hábitos hechos
        </span>
      )}
    </div>
  );
}

interface MonthCalendarProps {
  month: DateKey;
  onMonthChange: (month: DateKey) => void;
  byDate: Map<DateKey, number>;
  completedDates: Set<DateKey>;
  goalSecondsFor: (date: DateKey) => number;
  today: DateKey;
  weekStartsOn: WeekStart;
  /** Cantidad de hábitos marcados por día (opcional). */
  habitsByDate?: Map<DateKey, number>;
  selected?: DateKey | null;
  onSelect?: (date: DateKey) => void;
  compact?: boolean;
}

export function MonthCalendar({
  month,
  onMonthChange,
  byDate,
  completedDates,
  goalSecondsFor,
  today,
  weekStartsOn,
  habitsByDate,
  selected,
  onSelect,
  compact,
}: MonthCalendarProps) {
  const range = monthRange(month);
  // Grilla completa de semanas (incluye días del mes anterior/siguiente).
  const days = eachDayKeys(weekRange(range.from, weekStartsOn).from, weekRange(range.to, weekStartsOn).to);
  let max = 0;
  for (const d of eachDayKeys(range.from, range.to)) max = Math.max(max, byDate.get(d) ?? 0);
  const canGoForward = range.to < monthRange(today).to;
  const isDone = (d: DateKey) => d >= range.from && d <= range.to && d <= today && completedDates.has(d);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className={cn("font-display font-semibold", compact ? "text-base" : "text-xl")}>{capitalize(formatKey(range.from, "MMMM yyyy"))}</p>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Mes anterior" onClick={() => onMonthChange(addMonthsKey(range.from, -1))}>
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Mes siguiente"
            disabled={!canGoForward}
            onClick={() => onMonthChange(addMonthsKey(range.from, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div
        className={cn("grid grid-cols-7 gap-y-1", compact ? "gap-x-1 [--gap:4px]" : "gap-x-1 [--gap:4px] sm:gap-x-1.5 sm:[--gap:6px]")}
        role="grid"
        aria-label="Calendario mensual"
      >
        {WEEKDAY_SHORT[weekStartsOn].map((d, i) => (
          <div key={i} className="pb-1 text-center text-[11px] font-semibold text-muted-foreground" role="columnheader">
            {d}
          </div>
        ))}
        {days.map((day, index) => {
          const inMonth = day >= range.from && day <= range.to;
          if (!inMonth) return <div key={day} aria-hidden />;

          const seconds = byDate.get(day) ?? 0;
          const future = day > today;
          const level = !future ? heatLevel(seconds, goalSecondsFor(day), max) : 0;
          const completed = isDone(day);
          const habits = habitsByDate?.get(day) ?? 0;
          const isToday = day === today;
          const isSelected = selected === day;
          const column = index % 7;
          // La línea de "cumplido" se une con la del día de al lado (misma semana): así se ve la racha.
          const joinPrev = completed && column > 0 && isDone(addDaysKey(day, -1));
          const joinNext = completed && column < 6 && isDone(addDaysKey(day, 1));
          const label = [
            capitalize(formatKey(day, "EEEE d 'de' MMMM")),
            seconds ? formatDuration(seconds) : "sin actividad",
            completed ? "día cumplido" : null,
            habits ? `${habits} ${pluralize(habits, "hábito")}` : null,
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <button
              key={day}
              type="button"
              role="gridcell"
              aria-label={label}
              aria-selected={isSelected}
              title={label}
              disabled={future || !onSelect}
              onClick={() => onSelect?.(day)}
              className="group relative flex flex-col pb-[7px] text-left disabled:cursor-default"
            >
              <span
                className={cn(
                  "relative flex w-full flex-col rounded-lg transition-all",
                  compact ? "aspect-square items-center justify-center text-xs" : "aspect-square p-1.5 text-xs sm:aspect-[1/0.86] sm:rounded-xl sm:p-2",
                  HEAT_CLASS[level],
                  future && "bg-transparent text-muted-foreground/50",
                  onSelect && !future && "group-hover:ring-2 group-hover:ring-ring/40",
                  isToday && "ring-2 ring-foreground/70",
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                )}
              >
                <span className={cn("font-semibold tabular", !compact && "leading-none")}>{Number(day.slice(8))}</span>
                {!compact && seconds > 0 && (
                  <span className="mt-auto hidden truncate text-[10.5px] font-medium opacity-90 sm:block">{formatDuration(seconds)}</span>
                )}
                {habits > 0 && (
                  <span
                    aria-hidden
                    className={cn("absolute rounded-full bg-current opacity-75", compact ? "right-1 top-1 size-1" : "right-1.5 top-1.5 size-1.5 sm:right-2 sm:top-2")}
                  />
                )}
              </span>
              {completed && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute bottom-0 h-[3px] bg-streak",
                    joinPrev ? "left-[calc(var(--gap)/-2)]" : "left-1 rounded-l-full",
                    joinNext ? "right-[calc(var(--gap)/-2)]" : "right-1 rounded-r-full",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Las últimas semanas como un mapa de calor compacto (cada columna, una
 * semana): la constancia de varios meses de un vistazo.
 */
export function ConsistencyHeatmap({
  weeks = 26,
  byDate,
  completedDates,
  goalSecondsFor,
  today,
  weekStartsOn,
  selected,
  onSelect,
}: {
  weeks?: number;
  byDate: Map<DateKey, number>;
  completedDates: Set<DateKey>;
  goalSecondsFor: (date: DateKey) => number;
  today: DateKey;
  weekStartsOn: WeekStart;
  selected?: DateKey | null;
  onSelect?: (date: DateKey) => void;
}) {
  const first = addDaysKey(weekRange(today, weekStartsOn).from, -(weeks - 1) * 7);
  const days = eachDayKeys(first, addDaysKey(first, weeks * 7 - 1));
  let max = 0;
  for (const d of days) if (d <= today) max = Math.max(max, byDate.get(d) ?? 0);
  // Etiqueta de mes en la primera semana que contiene un día 1.
  const monthLabels = Array.from({ length: weeks }, (_, w) => {
    const week = days.slice(w * 7, w * 7 + 7);
    const firstOfMonth = week.find((d) => d.endsWith("-01"));
    return firstOfMonth ? capitalize(formatKey(firstOfMonth, "MMM")).replace(".", "") : "";
  });

  return (
    <div>
      <div className="mb-1.5 grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }} aria-hidden>
        {monthLabels.map((m, i) => (
          <span key={i} className="overflow-visible whitespace-nowrap text-[10px] font-semibold text-muted-foreground">
            {m}
          </span>
        ))}
      </div>
      <div
        className="grid grid-flow-col gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`, gridTemplateRows: "repeat(7, auto)" }}
        role="group"
        aria-label={`Constancia de las últimas ${weeks} semanas`}
      >
        {days.map((day) => {
          const future = day > today;
          const seconds = byDate.get(day) ?? 0;
          const level = future ? 0 : heatLevel(seconds, goalSecondsFor(day), max);
          const completed = !future && completedDates.has(day);
          const label = `${capitalize(formatKey(day, "EEE d 'de' MMMM"))}: ${seconds ? formatDuration(seconds) : "sin actividad"}${completed ? ", cumplido" : ""}`;
          return (
            <button
              key={day}
              type="button"
              disabled={future || !onSelect}
              onClick={() => onSelect?.(day)}
              title={label}
              aria-label={label}
              className={cn(
                "aspect-square rounded-[3px] transition-transform disabled:cursor-default",
                future ? "bg-transparent" : HEAT_CLASS[level],
                !future && onSelect && "hover:scale-125",
                completed && "shadow-[inset_0_-2px_0_var(--streak)]",
                selected === day && "ring-2 ring-primary ring-offset-1 ring-offset-card",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
