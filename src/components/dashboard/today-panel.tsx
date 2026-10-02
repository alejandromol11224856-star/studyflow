"use client";

import { ListChecks, Plus, Target } from "lucide-react";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { GoalRow } from "@/components/goals/goal-row";
import { HabitCheckButton } from "@/components/habits/habit-visuals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useToday } from "@/hooks/use-data";
import { useGoalStatuses, useHabitStatuses } from "@/hooks/use-metrics";
import { frequencyLabel, streakLabel } from "@/lib/domain/habits";
import { cn } from "@/lib/utils";

/**
 * Lo que te toca hoy, para marcar en un toque: objetivos del día (con el
 * contexto de la semana y el mes) y hábitos.
 */
export function TodayPanel({ className }: { className?: string }) {
  const dialogs = useDialogs();
  const today = useToday();
  const { statuses, isLoading } = useGoalStatuses();
  const habits = useHabitStatuses();

  const daily = statuses.filter((s) => s.goal.period === "daily");
  const longer = statuses.filter((s) => s.goal.period !== "daily");

  if (isLoading || habits.isLoading) {
    return (
      <Card className={cn("p-5", className)}>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-24" />
      </Card>
    );
  }

  if (daily.length + longer.length === 0 && habits.statuses.length === 0) {
    return (
      <Card className={className} data-tour="habits">
        <EmptyState
          emoji="🗓️"
          title="Armá tu día"
          description={
            <>
              Sumá un objetivo (por ejemplo, <b className="text-foreground">2 horas de programación</b>) o un hábito (
              <b className="text-foreground">leer 10 páginas</b>) y lo vas a ver acá cada día.
            </>
          }
          action={
            <>
              <Button onClick={() => dialogs.openGoalDialog({ sectionId: null })}>
                <Target /> Crear objetivo
              </Button>
              <Button variant="outline" onClick={() => dialogs.openHabitForm()}>
                <ListChecks /> Crear hábito
              </Button>
            </>
          }
        />
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-clip", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr]">
        <section className="p-3 sm:p-4 lg:border-r lg:border-border" aria-label="Objetivos de hoy">
          <SectionTitle
            emoji="🎯"
            title="Objetivos de hoy"
            count={daily.length ? `${daily.filter((s) => s.progress.completed).length}/${daily.length}` : undefined}
            onAdd={() => dialogs.openGoalDialog({ sectionId: null, period: "daily" })}
          />
          {daily.length === 0 ? (
            <button
              type="button"
              onClick={() => dialogs.openGoalDialog({ sectionId: null, period: "daily" })}
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border px-3 py-3 text-left text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary-soft hover:text-primary-text"
            >
              <Plus className="size-4" /> Sumá un objetivo diario (tiempo, páginas, km…)
            </button>
          ) : (
            <div className="space-y-0.5">
              {daily.map((s) => (
                <GoalRow key={`${s.goal.sectionId}|${s.goal.metric}`} status={s} />
              ))}
            </div>
          )}
          {longer.length > 0 && (
            <>
              <p className="mt-3 px-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Semana y mes</p>
              <div className="mt-1 space-y-0.5">
                {longer.map((s) => (
                  <GoalRow key={`${s.goal.sectionId}|${s.goal.period}|${s.goal.metric}`} status={s} />
                ))}
              </div>
            </>
          )}
        </section>

        <section data-tour="habits" className="border-t border-border p-3 sm:p-4 lg:border-t-0" aria-label="Hábitos de hoy">
          <SectionTitle
            emoji="🔥"
            title="Hábitos"
            count={habits.due.length ? `${habits.doneToday}/${habits.due.length}` : undefined}
            onAdd={() => dialogs.openHabitForm()}
          />
          {habits.due.length === 0 ? (
            habits.statuses.length ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">Nada pendiente por hoy. ✨</p>
            ) : (
              <button
                type="button"
                onClick={() => dialogs.openHabitForm()}
                className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border px-3 py-3 text-left text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary-soft hover:text-primary-text"
              >
                <Plus className="size-4" /> Creá tu primer hábito (meditar, leer, entrenar…)
              </button>
            )
          ) : (
            <ul className="space-y-1">
              {habits.due.map((h) => (
                <li key={h.habit.id} className="flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-muted/60">
                  <HabitCheckButton habit={h.habit} date={today} done={h.doneToday} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-[15px] font-semibold", h.doneToday && "text-muted-foreground line-through")}>
                      {h.habit.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {h.weekly ? `${h.weekly.done}/${h.weekly.target} esta semana` : frequencyLabel(h.habit)}
                    </p>
                  </div>
                  {h.streak.current > 0 && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-streak-soft px-2 py-0.5 text-xs font-bold text-streak-text"
                      title={`Racha: ${streakLabel(h.streak.current, h.streak.unit)}`}
                    >
                      🔥 {h.streak.current}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Card>
  );
}

function SectionTitle({ emoji, title, count, onAdd }: { emoji: string; title: string; count?: string; onAdd: () => void }) {
  return (
    <div className="mb-1.5 flex items-center justify-between px-2">
      <p className="text-[15px] font-bold">
        <span aria-hidden className="mr-1.5">
          {emoji}
        </span>
        {title}
        {count && <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground tabular">{count}</span>}
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
        aria-label={`Agregar a ${title.toLowerCase()}`}
      >
        <Plus className="size-[18px]" />
      </button>
    </div>
  );
}
