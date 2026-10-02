"use client";

import { ListChecks, Plus, Target } from "lucide-react";
import { ChainIllustration } from "@/components/brand/illustrations";
import { StreakMark } from "@/components/brand/marks";
import { ActivityItem } from "@/components/activities/activity-item";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { GoalRow } from "@/components/goals/goal-row";
import { HabitCheckButton } from "@/components/habits/habit-visuals";
import { SectionTitle } from "@/components/layout/page-header";
import { SectionDot } from "@/components/sections/section-visuals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useActivities, useSectionMap, useToday } from "@/hooks/use-data";
import { useGoalStatuses, useHabitStatuses } from "@/hooks/use-metrics";
import { frequencyLabel, streakLabel } from "@/lib/domain/habits";
import { cn } from "@/lib/utils";

/**
 * "Hoy": lo que te toca, para marcar en un toque. Hábitos del día, los
 * objetivos que no están en el anillo principal y lo que ya registraste.
 */
export function TodayPanel({ className }: { className?: string }) {
  const dialogs = useDialogs();
  const today = useToday();
  const sectionMap = useSectionMap();
  const { statuses, isLoading } = useGoalStatuses();
  const habits = useHabitStatuses();
  const activities = useActivities({ from: today, to: today, limit: 20 });

  const daily = statuses.filter((s) => s.goal.period === "daily");
  // El objetivo general principal ya está en el anillo de arriba.
  const main =
    daily.find((s) => s.goal.sectionId === null && s.goal.metric === "time") ?? daily.find((s) => s.goal.sectionId === null) ?? daily[0];
  const otherDaily = daily.filter((s) => s !== main);
  const longer = statuses.filter((s) => s.goal.period !== "daily");
  const logged = activities.data?.items ?? [];

  const total = habits.due.length + otherDaily.length;
  const done = habits.doneToday + otherDaily.filter((s) => s.progress.completed).length;

  if (isLoading || habits.isLoading) {
    return <Skeleton className={cn("h-64 rounded-3xl", className)} />;
  }

  const empty = total === 0 && longer.length === 0 && logged.length === 0;

  return (
    <section data-tour="habits" className={className} aria-label="Hoy">
      <SectionTitle
        title="Hoy"
        hint={total ? `${done} de ${total} listos` : undefined}
        action={
          <Button variant="ghost" size="sm" onClick={dialogs.openQuickAdd}>
            <Plus /> Agregar
          </Button>
        }
      />

      {empty ? (
        <Card>
          <EmptyState
            illustration={<ChainIllustration />}
            title="Armá tu día"
            description="Sumá un hábito (leer 10 páginas, entrenar) o un objetivo (2 horas de programación) y lo vas a ver acá cada día."
            action={
              <>
                <Button onClick={() => dialogs.openHabitForm()}>
                  <ListChecks /> Crear hábito
                </Button>
                <Button variant="outline" onClick={() => dialogs.openGoalDialog({ sectionId: null })}>
                  <Target /> Crear objetivo
                </Button>
              </>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-clip">
          {habits.due.length > 0 && (
            <ul className="divide-y divide-border">
              {habits.due.map((h) => {
                const section = h.habit.sectionId ? sectionMap.get(h.habit.sectionId) : undefined;
                return (
                  <li key={h.habit.id} className="flex items-center gap-3.5 px-4 py-3 sm:px-5">
                    <HabitCheckButton habit={h.habit} date={today} done={h.doneToday} />
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-[15px] font-semibold transition-colors", h.doneToday && "text-muted-foreground line-through decoration-2")}>
                        {h.habit.name}
                      </p>
                      <p className="flex items-center gap-1.5 truncate text-[13px] text-muted-foreground">
                        {section && <SectionDot color={section.color} />}
                        {section && <span className="truncate">{section.name} ·</span>}
                        {h.weekly ? `${h.weekly.done}/${h.weekly.target} esta semana` : frequencyLabel(h.habit)}
                      </p>
                    </div>
                    {h.streak.current > 0 && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-streak-soft px-2.5 py-1 text-xs font-semibold text-streak-text"
                        title={`Constancia: ${streakLabel(h.streak.current, h.streak.unit)}`}
                      >
                        <StreakMark className="size-3.5" /> {h.streak.current}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {otherDaily.length > 0 && (
            <div className={cn("px-2 py-2 sm:px-3", habits.due.length > 0 && "border-t border-border")}>
              {otherDaily.map((s) => (
                <GoalRow key={`${s.goal.sectionId}|${s.goal.metric}`} status={s} />
              ))}
            </div>
          )}

          {longer.length > 0 && (
            <div className="border-t border-border px-2 py-2 sm:px-3">
              <p className="eyebrow px-2 pt-1.5">Esta semana y este mes</p>
              {longer.map((s) => (
                <GoalRow key={`${s.goal.sectionId}|${s.goal.period}|${s.goal.metric}`} status={s} />
              ))}
            </div>
          )}

          {logged.length > 0 && (
            <div className="border-t border-border bg-subtle/60 px-4 pb-1 pt-3 sm:px-5">
              <p className="eyebrow">Registrado hoy</p>
              <div className="divide-y divide-border">
                {logged.slice(0, 5).map((a) => (
                  <ActivityItem key={a.id} activity={a} className="py-1" />
                ))}
              </div>
            </div>
          )}

          {habits.due.length === 0 && otherDaily.length === 0 && (
            <button
              type="button"
              onClick={() => dialogs.openHabitForm()}
              className="flex w-full items-center gap-3 border-t border-border px-5 py-3.5 text-left text-sm font-semibold text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
            >
              <Plus className="size-4" /> Sumá un hábito para hacer todos los días
            </button>
          )}
        </Card>
      )}
    </section>
  );
}
