"use client";

import { CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, Plus, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { ActivityItem } from "@/components/activities/activity-item";
import { StreakMark } from "@/components/brand/marks";
import { CalendarIllustration } from "@/components/brand/illustrations";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { StatTile } from "@/components/gamification/chips";
import { HabitCheckButton } from "@/components/habits/habit-visuals";
import { PageHeader, SectionTitle } from "@/components/layout/page-header";
import { SectionIconGlyph } from "@/components/sections/section-visuals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatActivityMeasures } from "@/components/ui/measures-input";
import { EmptyState, Progress, Skeleton } from "@/components/ui/misc";
import { useActiveSections, useActivities, useGoals, useHabitChecks, useHabits, useToday, useWeekStart } from "@/hooks/use-data";
import { useStreaks } from "@/hooks/use-metrics";
import { type DateKey, addDaysKey, capitalize, eachDayKeys, formatKey, monthRange, relativeDayLabel } from "@/lib/dates";
import { goalMinutesFor } from "@/lib/domain/goals";
import { isHabitDue } from "@/lib/domain/habits";
import { activeDaysInRange, bestDayInRange } from "@/lib/domain/stats";
import { longestRunInRange } from "@/lib/domain/streaks";
import { formatDuration, formatMinutes } from "@/lib/format";
import { sectionColor } from "@/lib/sections";
import type { Habit } from "@/lib/types";
import { cn, pluralize } from "@/lib/utils";
import { CalendarMarksLegend, ConsistencyHeatmap, HeatLegend, MonthCalendar } from "./month-calendar";

export function CalendarView() {
  const today = useToday();
  const weekStartsOn = useWeekStart();
  const goals = useGoals();
  const habits = useHabits();
  const checks = useHabitChecks();
  const { active } = useActiveSections();
  const [sectionId, setSectionId] = useState<string | undefined>(undefined);
  const [month, setMonth] = useState<DateKey>(today);
  const [selected, setSelected] = useState<DateKey>(today);
  const streaks = useStreaks(sectionId);

  // Hábitos marcados por día (del área filtrada, si hay filtro).
  const habitsByDate = useMemo(() => {
    const inScope = new Set((habits.data ?? []).filter((h) => !sectionId || h.sectionId === sectionId).map((h) => h.id));
    const map = new Map<DateKey, number>();
    for (const c of checks.data ?? []) if (inScope.has(c.habitId)) map.set(c.date, (map.get(c.date) ?? 0) + 1);
    return map;
  }, [habits.data, checks.data, sectionId]);

  const range = monthRange(month);
  const pastTo = range.to < today ? range.to : today;
  let monthSeconds = 0;
  for (const d of eachDayKeys(range.from, range.to)) monthSeconds += streaks.byDate.get(d) ?? 0;
  const activeDays = activeDaysInRange(streaks.byDate, range);
  const completedDays = [...streaks.completedDates].filter((d) => d >= range.from && d <= range.to).length;
  const best = bestDayInRange(streaks.byDate, range);
  const elapsedDays = range.from <= pastTo ? eachDayKeys(range.from, pastTo).length : 0;
  const monthRun = longestRunInRange(streaks.completedDates, range.from, pastTo);
  const isCurrentMonth = range.from <= today && today <= range.to;
  const monthName = formatKey(range.from, "MMMM");

  const goalFor = (d: DateKey) => goalMinutesFor(goals.data ?? [], "daily", sectionId ?? null, d);

  const summary =
    activeDays === 0
      ? isCurrentMonth
        ? `Todavía no hay actividad en ${monthName}. El primer día cuenta.`
        : `En ${monthName} no hubo actividad registrada.`
      : isCurrentMonth
        ? `En ${monthName} llevás ${activeDays} ${pluralize(activeDays, "día")} con actividad y ${completedDays} ${pluralize(completedDays, "cumplido", "cumplidos")}.`
        : `En ${monthName} trabajaste ${activeDays} ${pluralize(activeDays, "día", "días")} y cumpliste ${completedDays}.`;

  function selectDay(d: DateKey) {
    setSelected(d);
    if (d < range.from || d > range.to) setMonth(d);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Calendario" title="Tu constancia" description={summary} />

      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
        <FilterChip active={sectionId === undefined} onClick={() => setSectionId(undefined)}>
          Todas las áreas
        </FilterChip>
        {active.map((s) => (
          <FilterChip key={s.id} active={sectionId === s.id} onClick={() => setSectionId(s.id)}>
            <span style={{ color: sectionId === s.id ? undefined : sectionColor(s.color) }} className="[&_svg]:size-4">
              <SectionIconGlyph icon={s.icon} />
            </span>
            {s.name}
          </FilterChip>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
        <div className="space-y-8 lg:col-span-8">
          <Card className="p-4 sm:p-6">
            {streaks.isLoading ? (
              <Skeleton className="h-96" />
            ) : (
              <MonthCalendar
                month={month}
                onMonthChange={setMonth}
                byDate={streaks.byDate}
                completedDates={streaks.completedDates}
                goalSecondsFor={(d) => goalFor(d) * 60}
                today={today}
                weekStartsOn={weekStartsOn}
                habitsByDate={habitsByDate}
                selected={selected}
                onSelect={setSelected}
              />
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <CalendarMarksLegend />
              <HeatLegend />
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-x-6 gap-y-7 px-1 sm:grid-cols-4">
            <StatTile icon={<CalendarDays />} label="Total del mes" value={formatDuration(monthSeconds)} />
            <StatTile icon={<CalendarCheck />} label="Días cumplidos" value={completedDays} hint={`${activeDays} de ${elapsedDays || 0} con actividad`} />
            <StatTile
              icon={<StreakMark />}
              label="Racha del mes"
              value={`${monthRun} ${pluralize(monthRun, "día")}`}
              hint={streaks.current > 0 ? `Hoy vas ${streaks.current} seguidos` : undefined}
            />
            <StatTile
              icon={<Star />}
              label="Mejor día"
              value={best ? formatDuration(best.seconds) : "—"}
              hint={best ? capitalize(formatKey(best.date, "EEEE d")) : undefined}
            />
          </div>

          <section>
            <SectionTitle title="Últimos seis meses" hint="Cada cuadrito es un día. Tocá uno para verlo." />
            {streaks.isLoading ? (
              <Skeleton className="h-28" />
            ) : (
              <ConsistencyHeatmap
                byDate={streaks.byDate}
                completedDates={streaks.completedDates}
                goalSecondsFor={(d) => goalFor(d) * 60}
                today={today}
                weekStartsOn={weekStartsOn}
                selected={selected}
                onSelect={selectDay}
              />
            )}
          </section>
        </div>

        <DayPanel
          date={selected}
          sectionId={sectionId}
          goalMinutes={goalFor(selected)}
          completed={streaks.completedDates.has(selected)}
          habits={(habits.data ?? []).filter((h) => !sectionId || h.sectionId === sectionId)}
          checkedHabitIds={new Set((checks.data ?? []).filter((c) => c.date === selected).map((c) => c.habitId))}
          onNavigate={(delta) => selectDay(addDaysKey(selected, delta))}
          className="lg:col-span-4"
        />
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all active:scale-95",
        active ? "border-transparent bg-ink text-background" : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function DayPanel({
  date,
  sectionId,
  goalMinutes,
  completed,
  habits,
  checkedHabitIds,
  onNavigate,
  className,
}: {
  date: DateKey;
  sectionId?: string;
  goalMinutes: number;
  /** Misma regla que las rachas: todos los objetivos diarios del día (de cualquier métrica). */
  completed: boolean;
  habits: Habit[];
  checkedHabitIds: Set<string>;
  onNavigate: (delta: number) => void;
  className?: string;
}) {
  const today = useToday();
  const dialogs = useDialogs();
  const activities = useActivities({ from: date, to: date, sectionId, limit: 100 });
  const items = activities.data?.items ?? [];
  const total = items.reduce((acc, a) => acc + a.durationSeconds, 0);
  const extra = formatActivityMeasures({
    pages: items.reduce((a, x) => a + (x.pages ?? 0), 0),
    distanceKm: Math.round(items.reduce((a, x) => a + (x.distanceKm ?? 0), 0) * 100) / 100,
    reps: items.reduce((a, x) => a + (x.reps ?? 0), 0),
  });
  // Hábitos del día: los que correspondían (activos) y los que se marcaron igual.
  const dayHabits = habits.filter(
    (h) => checkedHabitIds.has(h.id) || (h.isActive && !h.archivedAt && h.frequency === "daily" && isHabitDue(h, date)),
  );
  const habitsDone = dayHabits.filter((h) => checkedHabitIds.has(h.id)).length;
  const relative = relativeDayLabel(date, today);
  const isRelative = relative === "Hoy" || relative === "Ayer";
  const status = completed ? "Cumplido" : items.length > 0 ? "Parcial" : date === today ? "Por empezar" : "Día libre";

  return (
    <Card className={cn("h-fit overflow-clip lg:sticky lg:top-6", className)} aria-live="polite">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">{isRelative ? capitalize(formatKey(date, "EEEE d 'de' MMMM")) : "Día"}</p>
            <h2 className="mt-1 font-display text-[26px] font-semibold leading-tight">{relative}</h2>
          </div>
          <div className="-mr-1.5 flex shrink-0 gap-0.5">
            <Button variant="ghost" size="icon-sm" aria-label="Día anterior" onClick={() => onNavigate(-1)}>
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Día siguiente" disabled={date >= today} onClick={() => onNavigate(1)}>
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div className="mt-5 flex items-baseline gap-2">
          <p className="font-display text-[40px] font-semibold leading-none tabular">{formatDuration(total)}</p>
          {goalMinutes > 0 && <p className="text-sm text-muted-foreground">de {formatMinutes(goalMinutes)}</p>}
        </div>
        {goalMinutes > 0 && (
          <Progress className="mt-3" value={total / (goalMinutes * 60)} tone={completed ? "success" : "primary"} label="Progreso del día" />
        )}
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span
            className={cn(
              "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold",
              completed ? "bg-streak-soft text-streak-text" : items.length > 0 ? "bg-xp-soft text-xp-text" : "bg-muted text-muted-foreground",
            )}
          >
            {completed && <StreakMark className="size-3.5" />}
            {status}
          </span>
          <span>
            {items.length} {pluralize(items.length, "actividad", "actividades")}
            {extra && ` · ${extra}`}
          </span>
        </p>
      </div>

      {dayHabits.length > 0 && (
        <div className="border-t border-border px-5 py-4 sm:px-6">
          <p className="mb-2 flex items-center justify-between text-[13px] font-semibold">
            Hábitos
            <span className="font-medium text-muted-foreground tabular">
              {habitsDone} de {dayHabits.length}
            </span>
          </p>
          <ul className="space-y-1">
            {dayHabits.map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-1">
                {date <= today && date >= h.startDate ? (
                  <HabitCheckButton habit={h} date={date} done={checkedHabitIds.has(h.id)} size="sm" />
                ) : (
                  <span className="size-8" />
                )}
                <span className={cn("min-w-0 truncate text-sm", checkedHabitIds.has(h.id) ? "font-semibold" : "text-muted-foreground")}>{h.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-border px-5 py-2 sm:px-6">
        {activities.isLoading ? (
          <Skeleton className="my-3 h-20" />
        ) : items.length === 0 ? (
          <EmptyState
            compact
            illustration={<CalendarIllustration />}
            title={date === today ? "Hoy todavía está en blanco" : "Día libre"}
            description={date === today ? "Una sesión corta alcanza para empezar." : "Descansar también es parte del proceso."}
          />
        ) : (
          <div className="divide-y divide-border">
            {items.map((a) => (
              <ActivityItem key={a.id} activity={a} />
            ))}
          </div>
        )}
      </div>

      {date <= today && (
        <div className="border-t border-border p-4">
          <Button variant="soft" className="w-full" onClick={() => dialogs.openActivityForm({ date, sectionId: sectionId ?? undefined })}>
            <Plus /> Agregar actividad a este día
          </Button>
        </div>
      )}
    </Card>
  );
}
