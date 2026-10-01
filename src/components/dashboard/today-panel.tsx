"use client";

import { Flame, ListChecks, Plus, Target } from "lucide-react";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { GoalRow } from "@/components/goals/goal-row";
import { HabitCheckButton } from "@/components/habits/habit-visuals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/misc";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useClock } from "@/hooks/use-clock";
import { useProfile, useTimeZone, useToday } from "@/hooks/use-data";
import { useGoalStatuses, useHabitStatuses, useStreaks } from "@/hooks/use-metrics";
import { timeInTimeZone } from "@/lib/dates";
import { frequencyLabel, streakLabel } from "@/lib/domain/habits";
import { motivationalMessage } from "@/lib/domain/motivation";
import { cn } from "@/lib/utils";

/**
 * "¿Qué tengo que hacer hoy?": objetivos del día (y el contexto de la semana
 * y el mes), hábitos para marcar y el progreso general, en un solo vistazo.
 */
export function TodayPanel({ className }: { className?: string }) {
  const dialogs = useDialogs();
  const today = useToday();
  const timeZone = useTimeZone();
  const now = useClock(60_000);
  const { data: profile } = useProfile();
  const { statuses, isLoading } = useGoalStatuses();
  const habits = useHabitStatuses();
  const streaks = useStreaks();

  const daily = statuses.filter((s) => s.goal.period === "daily");
  const longer = statuses.filter((s) => s.goal.period !== "daily");
  const items = daily.length + habits.due.length;
  const progressSum = daily.reduce((acc, s) => acc + s.progress.ratio, 0) + habits.doneToday;
  const overall = items ? progressSum / items : 0;
  const doneItems = daily.filter((s) => s.progress.completed).length + habits.doneToday;

  // Mensaje contextual basado en el objetivo diario general (o el primero del día).
  const main = daily.find((s) => s.goal.sectionId === null && s.goal.metric === "time") ?? daily[0];
  const hour = Number(timeInTimeZone(new Date(now).toISOString(), timeZone).slice(0, 2));
  const message = motivationalMessage({
    dateKey: today,
    hour,
    hasGoal: Boolean(main),
    ratio: main?.progress.ratio ?? 0,
    completed: daily.length > 0 && daily.every((s) => s.progress.completed),
    remainingSeconds: main && main.goal.metric === "time" ? main.progress.remaining : 0,
    hasActivityToday: (streaks.byDate.get(today) ?? 0) > 0 || statuses.some((s) => s.goal.period === "daily" && s.progress.done > 0),
    streak: streaks.current,
    todayCompleted: streaks.todayCompleted,
    habitsDue: habits.due.length,
    habitsDone: habits.doneToday,
  });

  if (isLoading || habits.isLoading) {
    return (
      <Card className={cn("p-5", className)}>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-24" />
      </Card>
    );
  }

  const empty = items === 0 && longer.length === 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-start gap-4 border-b border-border p-5">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            Hoy
            {streaks.current > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary-text">
                <Flame className="size-3.5" /> {streaks.current}
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          {profile?.mainGoal && (
            <p className="mt-2 inline-flex max-w-full items-start gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs">
              <Target className="mt-px size-3.5 shrink-0 text-primary-text" />
              <span className="line-clamp-2">
                <span className="text-muted-foreground">Tu objetivo:</span> <b className="font-medium">{profile.mainGoal}</b>
              </span>
            </p>
          )}
        </div>
        {items > 0 && (
          <ProgressRing value={overall} size={68} label={`Progreso del día: ${Math.round(overall * 100)}%`}>
            <span className="text-center leading-none">
              <span className="block text-sm font-semibold tabular">{Math.round(overall * 100)}%</span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">
                {doneItems}/{items}
              </span>
            </span>
          </ProgressRing>
        )}
      </div>

      {empty ? (
        <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">
            Definí objetivos y hábitos para ver acá lo que te toca hacer cada día.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => dialogs.openGoalDialog({ sectionId: null })}>
              <Target /> Crear objetivo
            </Button>
            <Button size="sm" variant="outline" onClick={() => dialogs.openHabitForm()}>
              <ListChecks /> Crear hábito
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr]">
          <section className="p-3 sm:p-4 lg:border-r lg:border-border" aria-label="Objetivos">
            <SectionTitle
              title="Objetivos de hoy"
              count={daily.length ? `${daily.filter((s) => s.progress.completed).length}/${daily.length}` : undefined}
              onAdd={() => dialogs.openGoalDialog({ sectionId: null, period: "daily" })}
            />
            {daily.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">Sin objetivos diarios.</p>
            ) : (
              <div className="space-y-0.5">
                {daily.map((s) => (
                  <GoalRow key={`${s.goal.sectionId}|${s.goal.metric}`} status={s} />
                ))}
              </div>
            )}
            {longer.length > 0 && (
              <>
                <p className="mt-3 px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Semana y mes</p>
                <div className="mt-1 space-y-0.5">
                  {longer.map((s) => (
                    <GoalRow key={`${s.goal.sectionId}|${s.goal.period}|${s.goal.metric}`} status={s} />
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="border-t border-border p-3 sm:p-4 lg:border-t-0" aria-label="Hábitos">
            <SectionTitle
              title="Hábitos"
              count={habits.due.length ? `${habits.doneToday}/${habits.due.length}` : undefined}
              onAdd={() => dialogs.openHabitForm()}
            />
            {habits.due.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                {habits.statuses.length ? "Nada pendiente por hoy." : "Todavía no creaste hábitos."}
              </p>
            ) : (
              <ul className="space-y-1">
                {habits.due.map((h) => (
                  <li key={h.habit.id} className="flex items-center gap-3 rounded-xl p-1.5">
                    <HabitCheckButton habit={h.habit} date={today} done={h.doneToday} />
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-medium", h.doneToday && "text-muted-foreground line-through")}>
                        {h.habit.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {h.weekly ? `${h.weekly.done}/${h.weekly.target} esta semana` : frequencyLabel(h.habit)}
                      </p>
                    </div>
                    {h.streak.current > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground" title={`Racha: ${streakLabel(h.streak.current, h.streak.unit)}`}>
                        <Flame className="size-3.5 text-primary-text" />
                        {h.streak.current}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Card>
  );
}

function SectionTitle({ title, count, onAdd }: { title: string; count?: string; onAdd: () => void }) {
  return (
    <div className="mb-1 flex items-center justify-between px-2">
      <p className="text-sm font-semibold">
        {title}
        {count && <span className="ml-1.5 text-xs font-normal text-muted-foreground tabular">{count}</span>}
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label={`Agregar a ${title.toLowerCase()}`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
