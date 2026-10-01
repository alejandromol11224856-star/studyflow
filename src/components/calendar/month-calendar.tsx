"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type DateKey,
  type WeekStart,
  WEEKDAY_SHORT,
  addMonthsKey,
  capitalize,
  eachDayKeys,
  formatKey,
  monthRange,
  weekRange,
} from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

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

const HEAT_CLASS = [
  "bg-muted/50 text-foreground",
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

interface MonthCalendarProps {
  month: DateKey;
  onMonthChange: (month: DateKey) => void;
  byDate: Map<DateKey, number>;
  completedDates: Set<DateKey>;
  goalSecondsFor: (date: DateKey) => number;
  today: DateKey;
  weekStartsOn: WeekStart;
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

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className={cn("font-semibold tracking-tight", compact ? "text-sm" : "text-base")}>
          {capitalize(formatKey(range.from, "MMMM yyyy"))}
        </p>
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

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5" role="grid" aria-label="Calendario mensual">
        {WEEKDAY_SHORT[weekStartsOn].map((d, i) => (
          <div key={i} className="pb-1 text-center text-[11px] font-medium text-muted-foreground" role="columnheader">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const inMonth = day >= range.from && day <= range.to;
          const seconds = byDate.get(day) ?? 0;
          const future = day > today;
          const level = inMonth && !future ? heatLevel(seconds, goalSecondsFor(day), max) : 0;
          const completed = inMonth && completedDates.has(day);
          const isToday = day === today;
          const isSelected = selected === day;
          const label = `${formatKey(day, "EEEE d 'de' MMMM")}: ${seconds ? formatDuration(seconds) : "sin actividad"}${completed ? ", día cumplido" : ""}`;

          if (!inMonth) return <div key={day} aria-hidden className={compact ? "aspect-square" : "aspect-square sm:aspect-[1/0.9]"} />;

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
              className={cn(
                "group relative flex aspect-square flex-col rounded-lg text-left transition-all",
                compact ? "items-center justify-center text-xs" : "p-1.5 text-xs sm:aspect-[1/0.9] sm:rounded-xl sm:p-2",
                HEAT_CLASS[level],
                future && "text-muted-foreground/50",
                onSelect && !future && "cursor-pointer hover:ring-2 hover:ring-ring/40",
                isToday && "ring-2 ring-foreground/70",
                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-card",
              )}
            >
              <span className={cn("font-medium tabular", compact ? "" : "leading-none")}>{Number(day.slice(8))}</span>
              {!compact && seconds > 0 && (
                <span className="mt-auto hidden truncate text-[10.5px] font-medium opacity-90 sm:block">{formatDuration(seconds)}</span>
              )}
              {completed && (
                <span
                  className={cn(
                    "absolute flex items-center justify-center rounded-full bg-card text-success shadow-sm",
                    compact ? "-right-0.5 -top-0.5 size-3 [&_svg]:size-2" : "right-1 top-1 size-4 [&_svg]:size-2.5 sm:right-1.5 sm:top-1.5",
                  )}
                >
                  <Check strokeWidth={3.5} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
