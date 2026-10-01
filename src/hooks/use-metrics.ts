"use client";

import { useMemo } from "react";
import { type DateKey, type DateRange, monthRange, weekRange } from "@/lib/dates";
import {
  type GoalProgress,
  computeProgress,
  currentGoals,
  goalTargetFor,
  goalProgress,
  periodRange,
} from "@/lib/domain/goals";
import {
  checksByHabit,
  habitCompletion,
  habitStreak,
  habitsForToday,
  isHabitVisible,
  weeklyHabitProgress,
} from "@/lib/domain/habits";
import { EMPTY_MEASURES, type Measures, measureValue, targetBase } from "@/lib/domain/metrics";
import { computeProgression } from "@/lib/domain/progression";
import { computeRecords } from "@/lib/domain/records";
import { sumInRange } from "@/lib/domain/stats";
import { computeStreaks, isDayCompleted, measuresByDate, totalsByDate } from "@/lib/domain/streaks";
import { timerDateKey } from "@/lib/domain/timer";
import type { Goal, GoalMetric, GoalPeriod, Habit } from "@/lib/types";
import {
  useAchievements,
  useActiveSections,
  useDailyTotals,
  useGoals,
  useHabitChecks,
  useHabits,
  useTimeZone,
  useToday,
  useWeekStart,
} from "./use-data";
import { useTimerState } from "./use-timer";

/**
 * Segundos del temporizador en curso que corresponden a hoy (y opcionalmente
 * a una sección). Se suman en vivo al progreso aunque todavía no se guardaron.
 */
export function useLiveTimerSeconds(sectionId?: string | null) {
  const { timer, elapsed } = useTimerState();
  const timeZone = useTimeZone();
  const today = useToday();
  if (!timer) return { seconds: 0, today, timerSectionId: null as string | null, timerDate: null as DateKey | null };
  const timerDate = timerDateKey(timer, timeZone);
  const base = { today, timerSectionId: timer.sectionId, timerDate };
  if (timerDate !== today) return { ...base, seconds: 0 };
  if (sectionId !== undefined && timer.sectionId !== sectionId) return { ...base, seconds: 0 };
  return { ...base, seconds: elapsed };
}

/** Progreso de un objetivo (global o por sección, cualquier métrica), en vivo. */
export function useGoalProgress(period: GoalPeriod, sectionId: string | null = null, metric: GoalMetric = "time") {
  const totals = useDailyTotals();
  const goals = useGoals();
  const weekStartsOn = useWeekStart();
  const live = useLiveTimerSeconds(sectionId ?? undefined);
  const today = live.today;

  const range = useMemo(() => periodRange(period, today, weekStartsOn), [period, today, weekStartsOn]);
  const logged = useMemo(() => sumInRange(totals.data ?? [], range, sectionId ?? undefined), [totals.data, range, sectionId]);
  const target = goalTargetFor(goals.data ?? [], period, sectionId, today, metric);
  const liveSeconds = metric === "time" ? live.seconds : 0;
  const progress = computeProgress(measureValue(logged, metric) + liveSeconds, targetBase(metric, target));

  return {
    today,
    range,
    metric,
    /** Meta en la unidad de la métrica (tiempo: minutos). */
    target,
    loggedSeconds: logged.seconds,
    liveSeconds,
    logged,
    progress,
    isLoading: totals.isLoading || goals.isLoading,
  };
}

export interface GoalStatus {
  goal: Goal;
  range: DateRange;
  measures: Measures;
  progress: GoalProgress;
  liveSeconds: number;
}

/**
 * Estado en vivo de todos los objetivos vigentes (de secciones activas y
 * globales): la base de "Hoy", del widget de objetivos y de las celebraciones.
 */
export function useGoalStatuses() {
  const totals = useDailyTotals();
  const goals = useGoals();
  const { data: sections } = useActiveSections();
  const weekStartsOn = useWeekStart();
  const live = useLiveTimerSeconds();
  const today = live.today;

  const base = useMemo(() => {
    const visible = new Set((sections ?? []).filter((s) => !s.archivedAt && s.isActive).map((s) => s.id));
    return currentGoals(goals.data ?? [], today)
      .filter((g) => g.sectionId === null || visible.has(g.sectionId))
      .map((goal) => {
        const range = periodRange(goal.period, today, weekStartsOn);
        return { goal, range, measures: sumInRange(totals.data ?? [], range, goal.sectionId ?? undefined) };
      });
  }, [goals.data, totals.data, sections, today, weekStartsOn]);

  const statuses: GoalStatus[] = base.map(({ goal, range, measures }) => {
    const applies =
      goal.metric === "time" &&
      live.timerDate !== null &&
      live.timerDate >= range.from &&
      live.timerDate <= range.to &&
      (goal.sectionId === null || goal.sectionId === live.timerSectionId);
    const liveSeconds = applies ? live.seconds || 0 : 0;
    const withLive = liveSeconds ? { ...measures, seconds: measures.seconds + liveSeconds } : measures;
    return { goal, range, measures: withLive, progress: goalProgress(goal, withLive), liveSeconds };
  });

  return { statuses, isLoading: totals.isLoading || goals.isLoading };
}

/** Racha actual y mejor racha (global o de una sección), incluyendo el temporizador en vivo. */
export function useStreaks(sectionId?: string) {
  const totals = useDailyTotals();
  const goals = useGoals();
  const live = useLiveTimerSeconds(sectionId);
  const today = live.today;

  const byDate = useMemo(() => totalsByDate(totals.data ?? [], sectionId), [totals.data, sectionId]);
  const measures = useMemo(() => measuresByDate(totals.data ?? [], sectionId), [totals.data, sectionId]);
  const base = useMemo(
    () => computeStreaks({ byDate: measures, goals: goals.data ?? [], today, sectionId: sectionId ?? null }),
    [measures, goals.data, today, sectionId],
  );

  // Si el temporizador en curso completa el día de hoy, la racha sube en vivo.
  if (!base.todayCompleted && live.seconds > 0) {
    const todayMeasures = measures.get(today) ?? EMPTY_MEASURES;
    const withLive = { ...todayMeasures, seconds: todayMeasures.seconds + live.seconds, count: Math.max(1, todayMeasures.count) };
    if (isDayCompleted(today, withLive, goals.data ?? [], sectionId ?? null)) {
      const current = base.current + 1;
      return { ...base, current, best: Math.max(base.best, current), todayCompleted: true, byDate, measures, isLoading: totals.isLoading };
    }
  }
  return { ...base, byDate, measures, isLoading: totals.isLoading || goals.isLoading };
}

export interface HabitStatus {
  habit: Habit;
  doneToday: boolean;
  dueToday: boolean;
  streak: ReturnType<typeof habitStreak>;
  week: ReturnType<typeof habitCompletion>;
  month: ReturnType<typeof habitCompletion>;
  weekly: { done: number; target: number } | null;
  checks: Set<DateKey>;
}

/** Estado de cada hábito visible: hecho hoy, racha y cumplimiento semanal/mensual. */
export function useHabitStatuses() {
  const habits = useHabits();
  const checks = useHabitChecks();
  const today = useToday();
  const weekStartsOn = useWeekStart();

  return useMemo(() => {
    const byHabit = checksByHabit(checks.data ?? []);
    const visible = (habits.data ?? []).filter(isHabitVisible);
    const forToday = new Set(habitsForToday(visible, byHabit, today, weekStartsOn).map((h) => h.id));
    const week = weekRange(today, weekStartsOn);
    const month = monthRange(today);
    const statuses: HabitStatus[] = visible.map((habit) => {
      const done = byHabit.get(habit.id) ?? new Set<DateKey>();
      return {
        habit,
        checks: done,
        doneToday: done.has(today),
        dueToday: forToday.has(habit.id),
        streak: habitStreak(habit, done, today, weekStartsOn),
        week: habitCompletion(habit, done, week, today, weekStartsOn),
        month: habitCompletion(habit, done, month, today, weekStartsOn),
        weekly: habit.frequency === "weekly" ? weeklyHabitProgress(habit, done, today, weekStartsOn) : null,
      };
    });
    const due = statuses.filter((s) => s.dueToday);
    return {
      statuses,
      due,
      doneToday: due.filter((s) => s.doneToday).length,
      isLoading: habits.isLoading || checks.isLoading,
    };
  }, [habits.data, checks.data, habits.isLoading, checks.isLoading, today, weekStartsOn]);
}

/** XP, nivel y logros (derivados de todos los datos). */
export function useProgression() {
  const totals = useDailyTotals();
  const goals = useGoals();
  const habits = useHabits();
  const checks = useHabitChecks();
  const achievements = useAchievements();
  const today = useToday();
  const weekStartsOn = useWeekStart();
  const ready = Boolean(totals.data && goals.data && habits.data && checks.data && achievements.data);

  const progression = useMemo(
    () =>
      ready
        ? computeProgression({
            totals: totals.data!,
            goals: goals.data!,
            habits: habits.data!,
            checks: checks.data!,
            achievements: achievements.data!,
            today,
            weekStartsOn,
          })
        : null,
    [ready, totals.data, goals.data, habits.data, checks.data, achievements.data, today, weekStartsOn],
  );
  return { progression, isLoading: !ready };
}

export function useRecords() {
  const totals = useDailyTotals();
  const goals = useGoals();
  const habits = useHabits();
  const checks = useHabitChecks();
  const today = useToday();
  const weekStartsOn = useWeekStart();
  const ready = Boolean(totals.data && goals.data && habits.data && checks.data);
  const records = useMemo(
    () =>
      ready
        ? computeRecords({ totals: totals.data!, goals: goals.data!, habits: habits.data!, checks: checks.data!, today, weekStartsOn })
        : null,
    [ready, totals.data, goals.data, habits.data, checks.data, today, weekStartsOn],
  );
  return { records, isLoading: !ready };
}

