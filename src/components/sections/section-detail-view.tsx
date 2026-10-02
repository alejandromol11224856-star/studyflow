"use client";

import { ArrowLeft, ArrowRight, Clock, NotebookPen, Pencil, Play, Plus, SearchX, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ActivityItem } from "@/components/activities/activity-item";
import { HeatLegend, MonthCalendar } from "@/components/calendar/month-calendar";
import { StackedBarChart } from "@/components/charts/charts";
import { StreakMark } from "@/components/brand/marks";
import { StatTile } from "@/components/gamification/chips";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { GoalStatusCard, NewGoalCard } from "@/components/goals/goal-progress-card";
import { HabitCheckButton } from "@/components/habits/habit-visuals";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";
import { useActivities, useDailyTotals, useGoals, useSections, useToday, useWeekStart } from "@/hooks/use-data";
import { useGoalStatuses, useHabitStatuses, useStreaks } from "@/hooks/use-metrics";
import { frequencyLabel, streakLabel } from "@/lib/domain/habits";
import { addDaysKey, capitalize, formatKey, monthRange } from "@/lib/dates";
import { goalMinutesFor } from "@/lib/domain/goals";
import { dailySeries, sumAll, sumInRange } from "@/lib/domain/stats";
import { formatDuration } from "@/lib/format";
import { sectionColor } from "@/lib/sections";
import type { Section } from "@/lib/types";
import { pluralize } from "@/lib/utils";
import { SectionAvatar } from "./section-visuals";

export function SectionDetailView({ id }: { id: string }) {
  const { data: sections, isLoading } = useSections();
  const section = sections?.find((s) => s.id === id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-72" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <Card>
        <EmptyState
          icon={SearchX}
          title="No encontramos esta área"
          description="Puede que la hayas eliminado."
          action={
            <Link href="/sections" className={buttonVariants({ variant: "outline" })}>
              Ver mis áreas
            </Link>
          }
        />
      </Card>
    );
  }

  return <SectionDetail section={section} />;
}

function SectionDetail({ section }: { section: Section }) {
  const dialogs = useDialogs();
  const totals = useDailyTotals();
  const goals = useGoals();
  const today = useToday();
  const weekStartsOn = useWeekStart();
  const streaks = useStreaks(section.id);
  const [month, setMonth] = useState(today);
  const recent = useActivities({ sectionId: section.id, limit: 8 });
  const { statuses } = useGoalStatuses();
  const goalsHere = statuses.filter((s) => s.goal.sectionId === section.id);
  const habits = useHabitStatuses().statuses.filter((h) => h.habit.sectionId === section.id);

  const sectionTotals = (totals.data ?? []).filter((t) => t.sectionId === section.id);
  const all = sumAll(sectionTotals);
  const monthTotal = sumInRange(sectionTotals, monthRange(today));
  const last30 = { from: addDaysKey(today, -29), to: today };
  const rows = dailySeries(sectionTotals, last30);
  const color = sectionColor(section.color);
  const items = recent.data?.items ?? [];

  return (
    <div className="space-y-6">
      <Link href="/sections" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Áreas
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <SectionAvatar section={section} size="lg" />
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 font-display text-[30px] font-semibold leading-tight sm:text-[34px]">
              <span className="truncate">{section.name}</span>
              {section.archivedAt && <Badge>Archivada</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground">{section.description || "Tu progreso en esta área"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="icon" aria-label="Editar área" onClick={() => dialogs.openSectionForm(section)}>
            <Pencil />
          </Button>
          <Button variant="outline" onClick={() => dialogs.openActivityForm({ sectionId: section.id })}>
            <Plus /> Registrar
          </Button>
          <Button onClick={() => dialogs.openStartTimer(section.id)}>
            <Play className="fill-current" /> Iniciar temporizador
          </Button>
        </div>
      </div>

      {!section.isActive && (
        <p className="rounded-xl bg-warning-soft px-4 py-2.5 text-sm text-warning">
          Área pausada: no aparece en Hoy ni en el temporizador. Activala desde “Editar”.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {goalsHere.map((s) => (
          <GoalStatusCard key={`${s.goal.period}|${s.goal.metric}`} status={s} showSection={false} />
        ))}
        <NewGoalCard sectionId={section.id} label={goalsHere.length ? "Agregar objetivo" : `Crear un objetivo para ${section.name}`} />
      </div>

      {habits.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Hábitos de {section.name}</CardTitle>
              <CardDescription>Marcalos acá o desde Hoy</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 pt-3 sm:grid-cols-2">
            {habits.map((h) => (
              <div key={h.habit.id} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
                <HabitCheckButton habit={h.habit} date={today} done={h.doneToday} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{h.habit.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {frequencyLabel(h.habit)} · racha {streakLabel(h.streak.current, h.streak.unit)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="grid grid-cols-2 gap-x-6 gap-y-7 p-5 sm:p-6 lg:grid-cols-4">
        <StatTile
          icon={<StreakMark />}
          label="Racha actual"
          value={`${streaks.current} ${pluralize(streaks.current, "día")}`}
          hint={streaks.todayCompleted ? "Hoy ya cumpliste" : "Días seguidos cumplidos"}
        />
        <StatTile icon={<Trophy />} label="Mejor racha" value={`${streaks.best} ${pluralize(streaks.best, "día")}`} hint="Récord en esta área" />
        <StatTile icon={<Clock />} label="Tiempo total" value={formatDuration(all.seconds)} hint={`Este mes: ${formatDuration(monthTotal.seconds)}`} />
        <StatTile icon={<NotebookPen />} label="Actividades" value={all.count.toLocaleString("es-AR")} hint={`Este mes: ${monthTotal.count}`} />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader>
            <div>
              <CardTitle>Últimos 30 días</CardTitle>
              <CardDescription>Tiempo dedicado por día</CardDescription>
            </div>
            <p className="text-xl font-semibold tracking-tight">{formatDuration(sumInRange(sectionTotals, last30).seconds)}</p>
          </CardHeader>
          <CardContent className="pt-4">
            {totals.isLoading ? (
              <Skeleton className="h-[220px]" />
            ) : (
              <StackedBarChart
                rows={rows}
                series={[{ key: section.id, name: section.name, color }]}
                height={220}
                highlightKey={today}
                xFormatter={(k) => formatKey(k, "d")}
                tooltipLabel={(k) => capitalize(formatKey(k, "EEEE d 'de' MMMM"))}
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardContent>
            <MonthCalendar
              compact
              month={month}
              onMonthChange={setMonth}
              byDate={streaks.byDate}
              completedDates={streaks.completedDates}
              goalSecondsFor={(d) => goalMinutesFor(goals.data ?? [], "daily", section.id, d) * 60}
              today={today}
              weekStartsOn={weekStartsOn}
            />
            <HeatLegend className="mt-3 justify-end" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Lo último que registraste en {section.name}</CardDescription>
          </div>
          {items.length > 0 && (
            <Link href={`/activities?section=${section.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Ver todo <ArrowRight />
            </Link>
          )}
        </CardHeader>
        <CardContent className="pt-2">
          {recent.isLoading ? (
            <Skeleton className="h-24" />
          ) : items.length === 0 ? (
            <EmptyState
              compact
              icon={NotebookPen}
              title="Todavía no hay actividades"
              description="Tocá Comenzar sesión o registrá algo que ya hiciste en esta área."
            />
          ) : (
            <div className="divide-y divide-border">
              {items.map((a) => (
                <div key={a.id}>
                  <p className="pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {capitalize(formatKey(a.date, "EEE d MMM"))}
                  </p>
                  <ActivityItem activity={a} className="pt-1" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
