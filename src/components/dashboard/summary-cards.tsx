"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChartColumn,
  NotebookPen,
  Play,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ActivityItem } from "@/components/activities/activity-item";
import { HeatLegend, MonthCalendar } from "@/components/calendar/month-calendar";
import { ChartLegend, StackedBarChart } from "@/components/charts/charts";
import { buildSectionSeries } from "@/components/charts/series";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { SectionAvatar } from "@/components/sections/section-visuals";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Progress, Skeleton } from "@/components/ui/misc";
import {
  useActiveSections,
  useActivities,
  useDailyTotals,
  useGoals,
  useSections,
  useToday,
  useWeekStart,
} from "@/hooks/use-data";
import { useGoalProgress, useStreaks } from "@/hooks/use-metrics";
import { addDaysKey, capitalize, formatKey, relativeDayLabel, weekRange } from "@/lib/dates";
import { goalMinutesFor } from "@/lib/domain/goals";
import { dailySeries, sectionDistribution, sumInRange } from "@/lib/domain/stats";
import { formatDuration, formatMinutes, formatPercent } from "@/lib/format";
import { sectionColor } from "@/lib/sections";
import type { Section } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Resumen semanal
// ---------------------------------------------------------------------------
export function WeekCard({ className }: { className?: string }) {
  const totals = useDailyTotals();
  const { data: sections = [] } = useSections();
  const today = useToday();
  const weekStartsOn = useWeekStart();
  const weekly = useGoalProgress("weekly", null, "time");

  const range = weekRange(today, weekStartsOn);
  const prevRange = { from: addDaysKey(range.from, -7), to: addDaysKey(range.to, -7) };
  const data = totals.data ?? [];
  const rows = dailySeries(data, range);
  const weekTotals = data.filter((t) => t.date >= range.from && t.date <= range.to);
  const series = buildSectionSeries(sections, weekTotals);
  const current = sumInRange(data, range).seconds;
  // Comparar contra el mismo tramo de la semana pasada (hasta el mismo día).
  const elapsedDays = Math.min(7, Math.max(1, rows.findIndex((r) => r.key === today) + 1 || 7));
  const prevSameSpan = sumInRange(data, { from: prevRange.from, to: addDaysKey(prevRange.from, elapsedDays - 1) }).seconds;
  const delta = prevSameSpan > 0 ? (current - prevSameSpan) / prevSameSpan : null;

  return (
    <Card className={className}>
      <CardHeader>
        <div>
          <CardTitle>Esta semana</CardTitle>
          <CardDescription>
            {capitalize(formatKey(range.from, "d MMM"))} – {formatKey(range.to, "d MMM")}
          </CardDescription>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold tracking-tight">{formatDuration(current)}</p>
          {delta !== null && (
            <p
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                delta >= 0 ? "text-success" : "text-danger",
              )}
            >
              {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {formatPercent(Math.abs(delta))} vs. semana pasada
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {totals.isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : current === 0 ? (
          <EmptyState
            compact
            icon={ChartColumn}
            className="h-[200px] py-0"
            title="Sin actividad esta semana"
            description="Cuando registres tiempo vas a ver cada día desglosado por área."
          />
        ) : (
          <>
            <StackedBarChart
              rows={rows}
              series={series}
              height={200}
              highlightKey={today}
              xFormatter={(k) => capitalize(formatKey(k, "EEEEEE"))}
              tooltipLabel={(k) => capitalize(formatKey(k, "EEEE d 'de' MMMM"))}
            />
            <ChartLegend series={series} className="mt-3" />
          </>
        )}
        {weekly.target > 0 && (
          <div className="mt-4 rounded-xl bg-muted/60 p-3">
            <div className="mb-2 flex justify-between text-xs">
              <span className="font-medium">Objetivo semanal · {formatMinutes(weekly.target)}</span>
              <span className="tabular text-muted-foreground">{formatPercent(weekly.progress.ratio)}</span>
            </div>
            <Progress value={weekly.progress.ratio} tone={weekly.progress.completed ? "success" : "primary"} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Actividades recientes (con el reparto de hoy arriba)
// ---------------------------------------------------------------------------
/** Lo que ya registraste hoy (con un empujón amable si todavía no hay nada). */
export function TodayActivitiesCard({ className }: { className?: string }) {
  const today = useToday();
  const dialogs = useDialogs();
  const activities = useActivities({ from: today, to: today, limit: 8 });
  const items = activities.data?.items ?? [];
  const total = items.reduce((acc, a) => acc + a.durationSeconds, 0);

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <div>
          <CardTitle>Actividades de hoy</CardTitle>
          <CardDescription>{items.length ? `${items.length} ${items.length === 1 ? "actividad" : "actividades"} · ${formatDuration(total)}` : "Lo que hagas hoy aparece acá"}</CardDescription>
        </div>
        <Link href="/activities" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Historial <ArrowRight />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-2">
        {activities.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            compact
            title="No tenés actividades todavía"
            description={
              <>
                Empezá con una sesión de 10 minutos.
                <br />
                Tu primera racha empieza hoy.
              </>
            }
            action={
              <Button variant="gradient" size="lg" onClick={() => dialogs.openStartTimer()}>
                <Play className="fill-current" /> Empezar
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {items.map((a) => (
              <ActivityItem key={a.id} activity={a} className="py-1.5" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentActivitiesCard({ className }: { className?: string }) {
  const today = useToday();
  const dialogs = useDialogs();
  const totals = useDailyTotals();
  const { data: sections = [] } = useSections();
  const activities = useActivities({ limit: 6 });
  const distribution = sectionDistribution(totals.data ?? [], { from: today, to: today });
  const total = distribution.reduce((acc, d) => acc + d.seconds, 0);
  const byId = new Map(sections.map((s) => [s.id, s]));
  const items = activities.data?.items ?? [];

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <div>
          <CardTitle>Actividades recientes</CardTitle>
          <CardDescription>Hoy llevás {formatDuration(total)}</CardDescription>
        </div>
        <Link href="/activities" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Historial <ArrowRight />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-3">
        {activities.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            compact
            icon={NotebookPen}
            title="No tenés actividades todavía"
            description="Iniciá el temporizador o cargá algo que ya hiciste."
            action={
              <Button size="sm" variant="soft" onClick={() => dialogs.openActivityForm()}>
                <Plus /> Registrar actividad
              </Button>
            }
          />
        ) : (
          <>
            {total > 0 && (
              // Reparto de hoy por sección; cada segmento tiene su valor en el tooltip y en la leyenda.
              <div className="mb-2">
                <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
                  {distribution.map((d) => (
                    <div
                      key={d.sectionId ?? "none"}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{ width: `${(d.seconds / total) * 100}%`, background: sectionColor(byId.get(d.sectionId ?? "")?.color) }}
                      title={`${byId.get(d.sectionId ?? "")?.name ?? "Sin área"}: ${formatDuration(d.seconds)}`}
                    />
                  ))}
                </div>
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {distribution.map((d) => {
                    const s = d.sectionId ? byId.get(d.sectionId) : undefined;
                    return (
                      <li key={d.sectionId ?? "none"} className="flex items-center gap-1.5">
                        <span className="size-2 rounded-[3px]" style={{ background: sectionColor(s?.color) }} />
                        {s?.name ?? "Sin área"} <b className="font-medium text-foreground">{formatDuration(d.seconds)}</b>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div className="divide-y divide-border">
              {items.map((a) => (
                <div key={a.id}>
                  <p className="pt-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {relativeDayLabel(a.date, today)}
                  </p>
                  <ActivityItem activity={a} className="pt-1" />
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Calendario compacto
// ---------------------------------------------------------------------------
export function CalendarCard({ className }: { className?: string }) {
  const today = useToday();
  const weekStartsOn = useWeekStart();
  const goals = useGoals();
  const streaks = useStreaks();
  const [month, setMonth] = useState(today);

  return (
    <Card className={className}>
      <CardHeader>
        <div>
          <CardTitle>Calendario</CardTitle>
          <CardDescription>Días con actividad y objetivos cumplidos</CardDescription>
        </div>
        <Link href="/calendar" className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Abrir calendario">
          <CalendarDays />
        </Link>
      </CardHeader>
      <CardContent className="pt-3">
        <MonthCalendar
          compact
          month={month}
          onMonthChange={setMonth}
          byDate={streaks.byDate}
          completedDates={streaks.completedDates}
          goalSecondsFor={(d) => goalMinutesFor(goals.data ?? [], "daily", null, d) * 60}
          today={today}
          weekStartsOn={weekStartsOn}
        />
        <HeatLegend className="mt-3 justify-end" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Secciones con su progreso de hoy
// ---------------------------------------------------------------------------
function SectionRow({ section }: { section: Section }) {
  const dialogs = useDialogs();
  const daily = useGoalProgress("daily", section.id, "time");
  const weekly = useGoalProgress("weekly", section.id, "time");
  const hasDaily = daily.target > 0;
  const goal = hasDaily ? daily : weekly.target > 0 ? weekly : null;

  return (
    <div className="flex items-center gap-1 rounded-2xl transition hover:bg-muted/70">
      <Link href={`/sections/${section.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-2">
        <SectionAvatar section={section} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-[15px] font-semibold">{section.name}</p>
            <p className="shrink-0 text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{formatDuration(daily.progress.done)}</span> hoy
            </p>
          </div>
          {goal ? (
            <div className="mt-1.5 flex items-center gap-2">
              <Progress
                value={goal.progress.ratio}
                color={goal.progress.completed ? "var(--success)" : sectionColor(section.color)}
                className="h-2"
              />
              <span className="w-24 shrink-0 text-right text-[11px] font-medium text-muted-foreground">
                {goal.progress.completed ? "✓ Cumplido" : `${formatMinutes(goal.target)} ${hasDaily ? "/día" : "/sem"}`}
              </span>
            </div>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDuration(weekly.progress.done)} esta semana
            </p>
          )}
        </div>
      </Link>
      <Button
        variant="soft"
        size="icon"
        className="mr-1.5 shrink-0 rounded-full"
        aria-label={`Empezar una sesión de ${section.name}`}
        onClick={() => dialogs.openStartTimer(section.id)}
      >
        <Play className="fill-current" />
      </Button>
    </div>
  );
}

export function SectionsCard({ className }: { className?: string }) {
  const { active, isLoading } = useActiveSections();
  const dialogs = useDialogs();
  return (
    <Card className={className} data-tour="areas">
      <CardHeader>
        <div>
          <CardTitle>Tus áreas</CardTitle>
          <CardDescription>Tocá el botón de play para empezar una sesión</CardDescription>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Nueva área" onClick={() => dialogs.openSectionForm()}>
          <Plus />
        </Button>
      </CardHeader>
      <CardContent className="pt-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : active.length === 0 ? (
          <EmptyState
            compact
            title="Creá tu primera área"
            description="Programación, Gym, Inglés, Lectura… lo que quieras medir, con su ícono y color."
            action={
              <Button variant="soft" onClick={() => dialogs.openSectionForm()}>
                <Plus /> Nueva área
              </Button>
            }
          />
        ) : (
          <div className="-mx-2 space-y-0.5">
            {active.map((s) => (
              <SectionRow key={s.id} section={s} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
