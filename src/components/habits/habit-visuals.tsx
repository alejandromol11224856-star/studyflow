"use client";

import { Check } from "lucide-react";
import { SectionIconGlyph } from "@/components/sections/section-visuals";
import { useToday, useToggleHabitCheck, useWeekStart } from "@/hooks/use-data";
import { type DateKey, addDaysKey, capitalize, formatKey, weekRange } from "@/lib/dates";
import { isHabitDue } from "@/lib/domain/habits";
import { sectionColor } from "@/lib/sections";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Botón grande para marcar un hábito como hecho (área táctil de 44 px). */
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
  const color = sectionColor(habit.color);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={`${done ? "Desmarcar" : "Marcar"} ${habit.name}`}
      onClick={() => toggle.mutate({ habitId: habit.id, date, done: !done })}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-90",
        size === "md" ? "size-11 [&_svg]:size-5" : "size-8 [&_svg]:size-4",
        done ? "border-transparent text-white" : "border-border text-muted-foreground hover:border-foreground/30",
      )}
      style={done ? { background: color } : undefined}
    >
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
              "flex size-8 flex-col items-center justify-center rounded-lg text-[10px] font-medium transition-all active:scale-90 disabled:cursor-default",
              done ? "text-white" : due ? "bg-muted text-muted-foreground hover:bg-border" : "text-muted-foreground/40",
              day === today && !done && "ring-2 ring-foreground/50",
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
