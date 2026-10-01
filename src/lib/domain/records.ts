import { type DateKey, type WeekStart, eachDayKeys, monthRange, weekRange } from "../dates";
import type { DailyTotal, Goal, Habit, HabitCheck } from "../types";
import { checksByHabit, habitStreak } from "./habits";
import { completedDatesFor, measuresByDate, streaksFromCompleted } from "./streaks";
import { dailyGoalCompletion } from "./stats";

export interface PersonalRecords {
  longestStreak: { days: number; from: DateKey; to: DateKey } | null;
  bestDay: { seconds: number; date: DateKey } | null;
  bestWeek: { seconds: number; from: DateKey } | null;
  bestMonth: { seconds: number; month: DateKey } | null;
  mostActivities: { count: number; date: DateKey } | null;
  /** Mejor mes en cumplimiento del objetivo diario (mínimo 7 días con objetivo). */
  bestCompliance: { ratio: number; met: number; withGoal: number; month: DateKey } | null;
  longestHabitStreak: { habitId: string; days: number; unit: "días" | "semanas" } | null;
}

export function computeRecords(input: {
  totals: DailyTotal[];
  goals: Goal[];
  habits: Habit[];
  checks: HabitCheck[];
  today: DateKey;
  weekStartsOn: WeekStart;
}): PersonalRecords {
  const { totals, goals, habits, checks, today, weekStartsOn } = input;
  const byDate = measuresByDate(totals);

  let bestDay: PersonalRecords["bestDay"] = null;
  let mostActivities: PersonalRecords["mostActivities"] = null;
  const perWeek = new Map<DateKey, number>();
  const perMonth = new Map<DateKey, number>();
  for (const [date, m] of byDate) {
    if (date > today) continue;
    if (m.seconds > 0 && (!bestDay || m.seconds > bestDay.seconds)) bestDay = { seconds: m.seconds, date };
    if (!mostActivities || m.count > mostActivities.count) mostActivities = { count: m.count, date };
    const w = weekRange(date, weekStartsOn).from;
    const mo = monthRange(date).from;
    perWeek.set(w, (perWeek.get(w) ?? 0) + m.seconds);
    perMonth.set(mo, (perMonth.get(mo) ?? 0) + m.seconds);
  }
  const top = (map: Map<DateKey, number>) => {
    let best: [DateKey, number] | null = null;
    for (const e of map) if (e[1] > 0 && (!best || e[1] > best[1])) best = e;
    return best;
  };
  const w = top(perWeek);
  const mo = top(perMonth);

  const streak = streaksFromCompleted(completedDatesFor(byDate, goals, today), today);

  let bestCompliance: PersonalRecords["bestCompliance"] = null;
  for (const month of perMonth.keys()) {
    const c = dailyGoalCompletion(byDate, goals, monthRange(month), today);
    if (c.withGoal < 7) continue;
    if (!bestCompliance || c.ratio > bestCompliance.ratio) bestCompliance = { ...c, month };
  }

  let longestHabitStreak: PersonalRecords["longestHabitStreak"] = null;
  const byHabit = checksByHabit(checks);
  for (const h of habits) {
    const s = habitStreak(h, byHabit.get(h.id) ?? new Set(), today, weekStartsOn);
    if (s.best > 0 && (!longestHabitStreak || s.best > longestHabitStreak.days)) {
      longestHabitStreak = { habitId: h.id, days: s.best, unit: s.unit };
    }
  }

  return {
    longestStreak: streak.bestRange && streak.best > 0 ? { days: streak.best, ...streak.bestRange } : null,
    bestDay,
    bestWeek: w ? { from: w[0], seconds: w[1] } : null,
    bestMonth: mo ? { month: mo[0], seconds: mo[1] } : null,
    mostActivities: mostActivities && mostActivities.count > 0 ? mostActivities : null,
    bestCompliance,
    longestHabitStreak,
  };
}

/** Mejor día anterior a `date` (para detectar cuándo se rompe el récord). */
export function bestDayBefore(totals: DailyTotal[], date: DateKey) {
  let best = 0;
  const byDay = new Map<DateKey, number>();
  for (const t of totals) if (t.date < date) byDay.set(t.date, (byDay.get(t.date) ?? 0) + t.seconds);
  for (const s of byDay.values()) best = Math.max(best, s);
  return best;
}

export function daysInRange(from: DateKey, to: DateKey) {
  return eachDayKeys(from, to).length;
}
