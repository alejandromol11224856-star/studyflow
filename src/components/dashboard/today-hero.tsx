"use client";

import { Check, Pause, Pencil, Play, Plus, Target } from "lucide-react";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { LevelChip, StreakChip } from "@/components/gamification/chips";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useClock } from "@/hooks/use-clock";
import { useProfile, useSectionMap, useTimeZone, useToday } from "@/hooks/use-data";
import { useGoalStatuses, useHabitStatuses, useProgression, useStreaks } from "@/hooks/use-metrics";
import { useTimerActions, useTimerState } from "@/hooks/use-timer";
import { capitalize, formatKey, timeInTimeZone } from "@/lib/dates";
import { formatMeasure } from "@/lib/domain/metrics";
import { motivationalMessage } from "@/lib/domain/motivation";
import { formatClock, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

function greetingFor(hour: number) {
  if (hour < 6) return "Buenas noches";
  if (hour < 13) return "Buen día";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

/** Sesión en curso: tiempo grande y acciones a mano. */
function RunningSession() {
  const { timer, running, elapsed } = useTimerState();
  const actions = useTimerActions();
  const dialogs = useDialogs();
  const sectionMap = useSectionMap();
  if (!timer) return null;
  const section = timer.sectionId ? sectionMap.get(timer.sectionId) : undefined;
  return (
    <div className="w-full rounded-3xl bg-primary-soft p-4 sm:w-72">
      <p className="flex items-center gap-1.5 truncate text-xs font-bold text-primary-text">
        <span className={cn("size-2 rounded-full", running ? "bg-success animate-pulse-soft" : "bg-muted-foreground")} />
        {running ? "En curso" : "En pausa"}
        {(timer.title || section) && <span className="truncate font-semibold opacity-80">· {timer.title || section?.name}</span>}
      </p>
      <p className="mt-1 font-mono text-4xl font-bold tracking-tight tabular" aria-live="off">
        {formatClock(elapsed)}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {running ? (
          <Button variant="outline" size="lg" onClick={actions.pause}>
            <Pause /> Pausar
          </Button>
        ) : (
          <Button variant="outline" size="lg" onClick={actions.resume}>
            <Play /> Seguir
          </Button>
        )}
        <Button variant="gradient" size="lg" onClick={dialogs.openFinishTimer}>
          <Check /> Terminar
        </Button>
      </div>
    </div>
  );
}

/**
 * Lo primero que se ve en "Hoy": saludo, racha, nivel, un mensaje y el
 * objetivo del día con un botón grande para empezar.
 */
export function TodayHero() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const timeZone = useTimeZone();
  const today = useToday();
  const now = useClock(60_000);
  const dialogs = useDialogs();
  const streaks = useStreaks();
  const { progression } = useProgression();
  const { statuses, isLoading } = useGoalStatuses();
  const habits = useHabitStatuses();
  const { timer } = useTimerState();

  const hour = Number(timeInTimeZone(new Date(now).toISOString(), timeZone).slice(0, 2));
  const firstName = (profile?.displayName || user?.email.split("@")[0] || "").split(" ")[0];
  const daily = statuses.filter((s) => s.goal.period === "daily");
  // Objetivo principal: el general de tiempo; si no, cualquier general; si no, el primero del día.
  const main =
    daily.find((s) => s.goal.sectionId === null && s.goal.metric === "time") ?? daily.find((s) => s.goal.sectionId === null) ?? daily[0];
  const todaySeconds = streaks.byDate.get(today) ?? 0;

  const message = motivationalMessage({
    dateKey: today,
    hour,
    hasGoal: Boolean(main),
    ratio: main?.progress.ratio ?? 0,
    completed: daily.length > 0 && daily.every((s) => s.progress.completed),
    exceeded: main ? main.progress.done > main.progress.target : false,
    remainingSeconds: main && main.goal.metric === "time" ? main.progress.remaining : 0,
    hasActivityToday: todaySeconds > 0 || daily.some((s) => s.progress.done > 0),
    streak: streaks.current,
    todayCompleted: streaks.todayCompleted,
    habitsDue: habits.due.length,
    habitsDone: habits.doneToday,
  });

  const editGoal = () =>
    main
      ? dialogs.openGoalDialog({ sectionId: main.goal.sectionId, period: "daily", metric: main.goal.metric, lock: true })
      : dialogs.openGoalDialog({ sectionId: null, period: "daily" });

  return (
    <section
      aria-label="Resumen de hoy"
      className="relative overflow-clip rounded-[28px] border border-border bg-card p-5 shadow-card animate-slide-up sm:p-7"
    >
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-primary-soft opacity-90 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-xp-soft opacity-70 blur-3xl" />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          {streaks.isLoading ? <Skeleton className="h-8 w-24 rounded-full" /> : <StreakChip days={streaks.current} today={streaks.todayCompleted} />}
          {progression ? (
            <LevelChip level={progression.level.level} ratio={progression.level.ratio} href="/progress" />
          ) : (
            <Skeleton className="h-8 w-28 rounded-full" />
          )}
        </div>

        <h1 className="mt-4 text-[26px] font-extrabold leading-tight tracking-tight sm:text-[32px]">
          {greetingFor(hour)}
          {firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="mt-0.5 text-sm font-medium text-muted-foreground">{capitalize(formatKey(today, "EEEE d 'de' MMMM"))}</p>
        <p className="mt-3 max-w-xl text-[15px] font-semibold leading-snug">{message}</p>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Objetivo del día */}
          <div data-tour="daily-goal" className="flex min-w-0 items-center gap-4 rounded-3xl">
            {isLoading ? (
              <Skeleton className="size-[112px] rounded-full" />
            ) : (
              <ProgressRing value={main?.progress.ratio ?? 0} size={112} stroke={11} label={main ? `Objetivo de hoy: ${Math.round(main.progress.ratio * 100)}%` : "Sin objetivo para hoy"}>
                <span className="text-center leading-none">
                  {main ? (
                    main.progress.completed ? (
                      <span className="text-[34px]" aria-hidden>
                        🏆
                      </span>
                    ) : (
                      <span className="block text-2xl font-extrabold tabular">{Math.round(main.progress.ratio * 100)}%</span>
                    )
                  ) : (
                    <span className="text-[30px]" aria-hidden>
                      🎯
                    </span>
                  )}
                </span>
              </ProgressRing>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">🎯 Objetivo de hoy</p>
              {main ? (
                <>
                  <p className="mt-0.5 text-xl font-extrabold tracking-tight tabular">
                    {formatMeasure(main.goal.metric, main.progress.done)}
                    <span className="text-base font-semibold text-muted-foreground"> / {formatMeasure(main.goal.metric, main.progress.target)}</span>
                  </p>
                  <p className={cn("text-sm font-semibold", main.progress.completed ? "text-success" : "text-muted-foreground")}>
                    {main.progress.completed ? "🚀 ¡Cumplido!" : `Faltan ${formatMeasure(main.goal.metric, main.progress.remaining)}`}
                  </p>
                  <button
                    type="button"
                    onClick={editGoal}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary-text hover:underline"
                  >
                    <Pencil className="size-3" /> Cambiar
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-0.5 text-xl font-extrabold tracking-tight">{todaySeconds > 0 ? formatDuration(todaySeconds) : "Todavía nada"}</p>
                  <p className="text-sm text-muted-foreground">{todaySeconds > 0 ? "registrados hoy" : "Definí una meta y mirá cómo avanzás"}</p>
                  <Button variant="soft" size="sm" className="mt-2" onClick={editGoal}>
                    <Target /> Definir objetivo
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Empezar */}
          <div data-tour="timer" className="flex flex-col gap-2 sm:items-end">
            {timer ? (
              <RunningSession />
            ) : (
              <>
                <Button variant="gradient" size="xl" className="w-full sm:w-auto sm:min-w-56" onClick={() => dialogs.openStartTimer()}>
                  <Play className="fill-current" /> Comenzar sesión
                </Button>
                <Button variant="ghost" className="w-full sm:w-auto" onClick={() => dialogs.openActivityForm()}>
                  <Plus /> Registrar algo que ya hice
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
