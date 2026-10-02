"use client";

import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { LevelChip, StreakChip } from "@/components/gamification/chips";
import { useAuth } from "@/components/providers/auth-provider";
import { Card } from "@/components/ui/card";
import { DayRing } from "@/components/ui/day-ring";
import { Skeleton } from "@/components/ui/misc";
import { useClock } from "@/hooks/use-clock";
import { useActivities, useDailyTotals, useProfile, useSetGoal, useTimeZone, useToday } from "@/hooks/use-data";
import { useGoalStatuses, useHabitStatuses, useLiveTimerSeconds, useProgression, useStreaks } from "@/hooks/use-metrics";
import { addDaysKey, capitalize, diffDays, formatKey, timeInTimeZone } from "@/lib/dates";
import { formatMeasure, formatTarget } from "@/lib/domain/metrics";
import { motivationalMessage } from "@/lib/domain/motivation";
import { bestDayBefore } from "@/lib/domain/records";
import { formatDuration, formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

function greetingFor(hour: number) {
  if (hour < 6) return "Buenas noches";
  if (hour < 13) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

/** Datos del día compartidos por el encabezado y el anillo. */
function useDayData() {
  const today = useToday();
  const streaks = useStreaks();
  const totals = useDailyTotals();
  const live = useLiveTimerSeconds();
  const { statuses, isLoading } = useGoalStatuses();
  const daily = statuses.filter((s) => s.goal.period === "daily");
  // Objetivo principal: el general de tiempo; si no, cualquier general; si no, el primero del día.
  const main =
    daily.find((s) => s.goal.sectionId === null && s.goal.metric === "time") ?? daily.find((s) => s.goal.sectionId === null) ?? daily[0];
  const todaySeconds = (streaks.byDate.get(today) ?? 0) + live.seconds;
  const yesterdaySeconds = streaks.byDate.get(addDaysKey(today, -1)) ?? 0;
  const previousBest = totals.data ? bestDayBefore(totals.data, today) : 0;

  // Días desde la última actividad anterior a hoy (null = nunca registró nada).
  let lastActive: string | null = null;
  for (const [date, seconds] of streaks.byDate) if (date < today && seconds > 0 && (!lastActive || date > lastActive)) lastActive = date;
  const hasAny = lastActive !== null || todaySeconds > 0 || (totals.data?.length ?? 0) > 0;
  const daysSinceLastActivity = lastActive ? diffDays(today, lastActive) : hasAny ? 0 : null;

  return { today, streaks, daily, main, todaySeconds, yesterdaySeconds, previousBest, daysSinceLastActivity, isLoading: isLoading || streaks.isLoading };
}

/** Saludo, fecha, constancia y un mensaje humano para el momento del día. */
export function DayHeader() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const timeZone = useTimeZone();
  const now = useClock(60_000);
  const { progression } = useProgression();
  const habits = useHabitStatuses();
  const day = useDayData();
  const todayActivities = useActivities({ from: day.today, to: day.today, limit: 50 });

  const hour = Number(timeInTimeZone(new Date(now).toISOString(), timeZone).slice(0, 2));
  const firstName = (profile?.displayName || user?.email.split("@")[0] || "").split(" ")[0];
  const { main, daily, streaks } = day;

  const message = motivationalMessage({
    dateKey: day.today,
    hour,
    hasGoal: Boolean(main),
    ratio: main?.progress.ratio ?? 0,
    completed: daily.length > 0 && daily.every((s) => s.progress.completed),
    exceeded: main ? main.progress.done > main.progress.target : false,
    remainingSeconds: main && main.goal.metric === "time" ? main.progress.remaining : 0,
    hasActivityToday: day.todaySeconds > 0 || daily.some((s) => s.progress.done > 0),
    streak: streaks.current,
    todayCompleted: streaks.todayCompleted,
    habitsDue: habits.due.length,
    habitsDone: habits.doneToday,
    todaySeconds: day.todaySeconds,
    yesterdaySeconds: day.yesterdaySeconds,
    todayCount: todayActivities.data?.items.length,
    daysSinceLastActivity: day.daysSinceLastActivity,
    isNewBestDay: day.previousBest >= 30 * 60 && day.todaySeconds > day.previousBest,
  });

  return (
    <header className="animate-page-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">{capitalize(formatKey(day.today, "EEEE d 'de' MMMM"))}</p>
        <div className="flex items-center gap-2">
          {streaks.isLoading ? <Skeleton className="h-8 w-20 rounded-full" /> : <StreakChip days={streaks.current} today={streaks.todayCompleted} />}
          {progression ? <LevelChip level={progression.level.level} ratio={progression.level.ratio} href="/progress" /> : <Skeleton className="h-8 w-28 rounded-full" />}
        </div>
      </div>
      <h1 className="mt-4 font-display text-[36px] font-semibold leading-[1.05] sm:text-[46px]">
        {greetingFor(hour)}
        {firstName ? `, ${firstName}` : ""}.
      </h1>
      <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-muted-foreground">{message}</p>
    </header>
  );
}

const QUICK_GOALS = [30, 60, 120, 180];

/** El progreso del día, grande y simple: cuánto llevás y cuánto falta. */
export function DayProgress({ className }: { className?: string }) {
  const dialogs = useDialogs();
  const setGoal = useSetGoal();
  const { main, todaySeconds, yesterdaySeconds, previousBest, today, isLoading } = useDayData();

  if (isLoading) return <Skeleton className={cn("h-56 rounded-3xl", className)} />;

  const done = main?.progress.completed;
  const editGoal = () =>
    main
      ? dialogs.openGoalDialog({ sectionId: main.goal.sectionId, period: "daily", metric: main.goal.metric, lock: true })
      : dialogs.openGoalDialog({ sectionId: null, period: "daily" });

  return (
    <Card data-tour="daily-goal" className={cn("@container overflow-clip p-5 sm:p-7", className)}>
      <div className="flex flex-col items-center gap-6 @lg:flex-row @lg:items-center @lg:gap-8">
        <DayRing
          value={main?.progress.ratio ?? 0}
          size={176}
          label={main ? `Objetivo de hoy: ${Math.round(main.progress.ratio * 100)}%` : "Todavía no hay objetivo para hoy"}
        >
          {main ? (
            <>
              <span className="font-display text-[34px] font-semibold leading-none">{formatMeasure(main.goal.metric, main.progress.done)}</span>
              <span className="mt-1.5 text-[13px] font-medium text-muted-foreground">de {formatTarget(main.goal.metric, main.goal.target)}</span>
            </>
          ) : (
            <>
              <span className="font-display text-[34px] font-semibold leading-none">{formatDuration(todaySeconds)}</span>
              <span className="mt-1.5 text-[13px] font-medium text-muted-foreground">hoy</span>
            </>
          )}
        </DayRing>

        <div className="w-full min-w-0 flex-1 text-center @lg:text-left">
          <p className="eyebrow">Objetivo de hoy</p>
          {main ? (
            <>
              <p className="mt-2 font-display text-[26px] font-semibold leading-tight">
                {done ? "Cumplido." : `Te faltan ${formatMeasure(main.goal.metric, main.progress.remaining)}.`}
              </p>
              <p className="mt-1.5 text-[15px] text-muted-foreground">
                {done
                  ? main.progress.done > main.progress.target
                    ? `Sumaste ${formatMeasure(main.goal.metric, main.progress.done - main.progress.target)} de más. Lo que venga es extra.`
                    : "Hoy cumpliste lo que te propusiste."
                  : `${Math.round(main.progress.ratio * 100)}% de tu meta${main.liveSeconds > 0 ? ", contando la sesión en curso" : ""}.`}
              </p>
              <button type="button" onClick={editGoal} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-text hover:underline">
                <Pencil className="size-3.5" /> Cambiar objetivo
              </button>
            </>
          ) : (
            <>
              <p className="mt-2 font-display text-[26px] font-semibold leading-tight">¿Cuánto querés dedicarle hoy?</p>
              <p className="mt-1.5 text-[15px] text-muted-foreground">Elegí una meta diaria. La podés cambiar cuando quieras.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 @lg:justify-start">
                {QUICK_GOALS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    disabled={setGoal.isPending}
                    onClick={() =>
                      setGoal.mutate(
                        { sectionId: null, period: "daily", metric: "time", target: m, effectiveFrom: today },
                        { onSuccess: () => toast.success(`Objetivo diario: ${formatMinutes(m)}`) },
                      )
                    }
                    className="h-11 rounded-xl border border-border bg-card px-4 text-[15px] font-semibold transition hover:border-primary/40 hover:bg-primary-soft hover:text-primary-text active:scale-95 disabled:opacity-50"
                  >
                    {formatMinutes(m)}
                  </button>
                ))}
                <button type="button" onClick={editGoal} className="h-11 rounded-xl px-3 text-[15px] font-semibold text-primary-text hover:underline">
                  Otro
                </button>
              </div>
            </>
          )}

          {(yesterdaySeconds > 0 || previousBest > 0) && (
            <dl className="mt-5 flex justify-center gap-6 border-t border-border pt-4 text-sm @lg:justify-start">
              {yesterdaySeconds > 0 && (
                <div>
                  <dt className="text-muted-foreground">Ayer</dt>
                  <dd className="font-semibold tabular">{formatDuration(yesterdaySeconds)}</dd>
                </div>
              )}
              {previousBest > 0 && (
                <div>
                  <dt className="text-muted-foreground">Tu mejor día</dt>
                  <dd className="font-semibold tabular">{formatDuration(Math.max(previousBest, todaySeconds))}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>
    </Card>
  );
}
