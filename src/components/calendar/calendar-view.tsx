"use client";

import { CalendarCheck, CalendarDays, Check, Flame, Plus, Star } from "lucide-react";
import { useState } from "react";
import { ActivityItem } from "@/components/activities/activity-item";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { formatActivityMeasures } from "@/components/ui/measures-input";
import { PageHeader } from "@/components/layout/page-header";
import { SectionIconGlyph } from "@/components/sections/section-visuals";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";
import { useActiveSections, useActivities, useGoals, useToday, useWeekStart } from "@/hooks/use-data";
import { useStreaks } from "@/hooks/use-metrics";
import { type DateKey, capitalize, eachDayKeys, formatKey, monthRange, relativeDayLabel } from "@/lib/dates";
import { goalMinutesFor } from "@/lib/domain/goals";
import { activeDaysInRange, bestDayInRange } from "@/lib/domain/stats";
import { formatDuration, formatMinutes } from "@/lib/format";
import { sectionColor } from "@/lib/sections";
import { cn, pluralize } from "@/lib/utils";
import { HeatLegend, MonthCalendar } from "./month-calendar";

export function CalendarView() {
  const today = useToday();
  const weekStartsOn = useWeekStart();
  const goals = useGoals();
  const { active } = useActiveSections();
  const [sectionId, setSectionId] = useState<string | undefined>(undefined);
  const [month, setMonth] = useState<DateKey>(today);
  const [selected, setSelected] = useState<DateKey>(today);
  const streaks = useStreaks(sectionId);

  const range = monthRange(month);
  const pastRange = { from: range.from, to: range.to < today ? range.to : today };
  let monthSeconds = 0;
  for (const d of eachDayKeys(range.from, range.to)) monthSeconds += streaks.byDate.get(d) ?? 0;
  const activeDays = activeDaysInRange(streaks.byDate, range);
  const completedDays = [...streaks.completedDates].filter((d) => d >= range.from && d <= range.to).length;
  const best = bestDayInRange(streaks.byDate, range);
  const elapsedDays = pastRange.from <= pastRange.to ? eachDayKeys(pastRange.from, pastRange.to).length : 0;

  const goalFor = (d: DateKey) => goalMinutesFor(goals.data ?? [], "daily", sectionId ?? null, d);

  return (
    <div>
      <PageHeader title="Calendario" description="Tu constancia mes a mes. Cada día cumplido suma a tu racha." />

      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
        <FilterChip active={sectionId === undefined} onClick={() => setSectionId(undefined)}>
          Todas
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
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
                  selected={selected}
                  onSelect={setSelected}
                />
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="flex size-4 items-center justify-center rounded-full bg-card text-success shadow-sm ring-1 ring-border">
                    <Check className="size-2.5" strokeWidth={3.5} />
                  </span>
                  Día cumplido (objetivo alcanzado, o con actividad si no había objetivo)
                </p>
                <HeatLegend />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <MiniStat icon={CalendarDays} label="Total del mes" value={formatDuration(monthSeconds)} />
            <MiniStat icon={Flame} label="Días activos" value={`${activeDays}/${elapsedDays || 0}`} />
            <MiniStat icon={CalendarCheck} label="Días cumplidos" value={`${completedDays}`} />
            <MiniStat
              icon={Star}
              label="Mejor día"
              value={best ? formatDuration(best.seconds) : "—"}
              hint={best ? capitalize(formatKey(best.date, "EEE d")) : undefined}
            />
          </div>
        </div>

        <DayPanel
          date={selected}
          sectionId={sectionId}
          goalMinutes={goalFor(selected)}
          completed={streaks.completedDates.has(selected)}
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
        "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-all",
        active ? "border-transparent bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function MiniStat({ icon: Icon, label, value, hint }: { icon: typeof Flame; label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <Icon className="size-4 text-muted-foreground" />
      <p className="mt-2 text-lg font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">
        {label}
        {hint && <span> · {hint}</span>}
      </p>
    </Card>
  );
}

function DayPanel({
  date,
  sectionId,
  goalMinutes,
  completed,
  className,
}: {
  date: DateKey;
  sectionId?: string;
  goalMinutes: number;
  /** Misma regla que las rachas: todos los objetivos diarios del día (de cualquier métrica). */
  completed: boolean;
  className?: string;
}) {
  const today = useToday();
  const dialogs = useDialogs();
  const activities = useActivities({ from: date, to: date, sectionId, limit: 100 });
  const items = activities.data?.items ?? [];
  const total = items.reduce((acc, a) => acc + a.durationSeconds, 0);
  const met = completed;
  const extra = formatActivityMeasures({
    pages: items.reduce((a, x) => a + (x.pages ?? 0), 0),
    distanceKm: Math.round(items.reduce((a, x) => a + (x.distanceKm ?? 0), 0) * 100) / 100,
    reps: items.reduce((a, x) => a + (x.reps ?? 0), 0),
  });

  return (
    <Card className={cn("h-fit lg:sticky lg:top-6", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border p-5">
        <div>
          <p className="text-xs text-muted-foreground">{capitalize(formatKey(date, "EEEE"))}</p>
          <h2 className="text-lg font-semibold tracking-tight">{relativeDayLabel(date, today)}</h2>
          <p className="mt-1 text-sm">
            <b className="font-semibold">{formatDuration(total)}</b>
            {goalMinutes > 0 && <span className="text-muted-foreground"> / {formatMinutes(goalMinutes)}</span>}
            <span className="text-muted-foreground"> · {items.length} {pluralize(items.length, "actividad", "actividades")}</span>
          </p>
          {extra && <p className="text-xs text-muted-foreground">{extra}</p>}
        </div>
        {met ? (
          <Badge tone="success">
            <Check /> Cumplido
          </Badge>
        ) : items.length > 0 ? (
          <Badge tone="warning">Parcial</Badge>
        ) : null}
      </div>
      <div className="px-5 py-2">
        {activities.isLoading ? (
          <Skeleton className="my-3 h-20" />
        ) : items.length === 0 ? (
          <EmptyState compact icon={CalendarDays} title="Sin actividades este día" />
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
