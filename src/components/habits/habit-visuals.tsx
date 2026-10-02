"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { SectionIconGlyph } from "@/components/sections/section-visuals";
import { useToday, useToggleHabitCheck, useWeekStart } from "@/hooks/use-data";
import { type DateKey, addDaysKey, capitalize, formatKey, weekRange } from "@/lib/dates";
import { isHabitDue } from "@/lib/domain/habits";
import { sectionColor } from "@/lib/sections";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Botón para marcar un hábito (área táctil de 44 px). Al completarlo, el
 * círculo se llena con el color del área y se expande un anillo: la
 * satisfacción de "un eslabón más", sin confeti.
 */
export function HabitCheckButton({
  habit,
  date,
  done,
  size = "md",
}: {
  habit: Habit;
  date: DateKey;
  done: boolean;
  size?: "sm" | "md";
}) {
  const toggle = useToggleHabitCheck();
  const [burst, setBurst] = useState(0);
  const color = sectionColor(habit.color);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={`${done ? "Desmarcar" : "Marcar"} ${habit.name}`}
      onClick={() => {
        if (!done) setBurst((b) => b + 1);
        toggle.mutate({ habitId: habit.id, date, done: !done });
      }}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full border-2 transition-[background-color,border-color,transform] duration-200 active:scale-90",
        size === "md" ? "size-11 [&_svg]:size-5" : "size-8 [&_svg]:size-4",
        done ? "border-transparent text-white" : "border-border text-muted-foreground hover:border-foreground/30",
      )}
      style={done ? { background: color } : undefined}
    >
      {burst > 0 && done && (
        <span key={burst} aria-hidden className="pointer-events-none absolute inset-0 rounded-full animate-ring-burst" style={{ boxShadow: `0 0 0 3px ${color}` }} />
      )}
      {done ? <Check strokeWidth={3} className="animate-pop" /> : <SectionIconGlyph icon={habit.icon} className="opacity-70" />}
    </button>
  );
}

/** Los 7 días de la semana actual, marcables (los no programados se ven tenues). */
export function HabitWeekStrip({ habit, checks }: { habit: Habit; checks: Set<DateKey> }) {
  const today = useToday();
  const weekStartsOn = useWeekStart();
  const toggle = useToggleHabitCheck();
  const start = weekRange(today, weekStartsOn).from;
  const days = Array.from({ length: 7 }, (_, i) => addDaysKey(start, i));
  const color = sectionColor(habit.color);

  return (
    <div className="flex gap-1" role="group" aria-label={`Semana de ${habit.name}`}>
      {days.map((day) => {
        const done = checks.has(day);
        const future = day > today;
        const due = isHabitDue(habit, day);
        const label = `${capitalize(formatKey(day, "EEEE d"))}${done ? ": hecho" : due ? ": pendiente" : ": no programado"}`;
        return (
          <button
            key={day}
            type="button"
            disabled={future || day < habit.startDate}
            aria-label={label}
            title={label}
            aria-pressed={done}
            onClick={() => toggle.mutate({ habitId: habit.id, date: day, done: !done })}
            className={cn(
              "flex size-8 flex-col items-center justify-center rounded-[10px] text-[10px] font-semibold transition-all active:scale-90 disabled:cursor-default",
              done ? "text-white" : due ? "bg-muted text-muted-foreground hover:bg-border" : "text-muted-foreground/40",
              day === today && !done && "ring-2 ring-foreground/40",
              future && "opacity-40",
            )}
            style={done ? { background: color } : undefined}
          >
            {capitalize(formatKey(day, "EEEEE"))}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Historial de un hábito: las últimas semanas como una grilla (cada columna,
 * una semana). La cadena de días hechos se ve de un vistazo.
 */
export function HabitHistory({ habit, checks, weeks = 12 }: { habit: Habit; checks: Set<DateKey>; weeks?: number }) {
  const today = useToday();
  const weekStartsOn = useWeekStart();
  const color = sectionColor(habit.color);
  const firstWeek = addDaysKey(weekRange(today, weekStartsOn).from, -(weeks - 1) * 7);
  const columns = Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => addDaysKey(firstWeek, w * 7 + d)));

  return (
    <div className="overflow-x-auto scrollbar-none" role="img" aria-label={`Historial de ${habit.name} en las últimas ${weeks} semanas`}>
      <div className="flex gap-[3px]">
        {columns.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {col.map((day) => {
              const done = checks.has(day);
              const outside = day > today || day < habit.startDate;
              const due = isHabitDue(habit, day);
              return (
                <span
                  key={day}
                  title={`${capitalize(formatKey(day, "EEE d MMM"))}${done ? ": hecho" : ""}`}
                  className={cn("size-3 rounded-[3px]", outside ? "bg-transparent" : done ? "" : due ? "bg-muted" : "bg-muted/40")}
                  style={done && !outside ? { background: color } : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
