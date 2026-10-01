import { type DateKey, type WeekStart, addDaysKey, addMonthsKey, eachDayKeys, monthRange, weekRange } from "../dates";
import type { DailyTotal, Goal, GoalMetric, GoalPeriod, Habit, HabitCheck, UnlockedAchievement } from "../types";
import { goalFor, goalMet } from "./goals";
import { checksByHabit, habitStreak } from "./habits";
import { EMPTY_MEASURES, type Measures, addMeasures } from "./metrics";
import { completedDatesFor, measuresByDate, streaksFromCompleted } from "./streaks";

/**
 * XP derivado de los datos (no un contador acumulativo): siempre se puede
 * recalcular, es igual en todos los dispositivos y borrar actividades falsas
 * quita el XP que daban. Reglas anti-abuso:
 *  - El tiempo se cuenta por DÍA (no por actividad): partir 1 hora en 60
 *    actividades de 1 minuto no da más XP. Tope de 12 h por día.
 *  - El bonus por registrar actividades tiene tope diario y exige que el día
 *    tenga al menos 10 minutos (u otra medida real).
 *  - Objetivos, hábitos y rachas tienen topes por período.
 */
export const XP_RULES = {
  minutesPerXp: 6,
  maxMinutesPerDay: 12 * 60,
  activityXp: 3,
  maxActivitiesPerDay: 5,
  minMinutesForActivityXp: 10,
  goalXp: {
    daily: { global: 25, section: 10 },
    weekly: { global: 60, section: 20 },
    monthly: { global: 150, section: 50 },
  } satisfies Record<GoalPeriod, { global: number; section: number }>,
  maxGoalCompletionsPerPeriod: { global: 2, section: 4 },
  streakXpPerDay: 2,
  streakMaxRun: 7,
  habitXp: 5,
  maxHabitChecksPerDay: 8,
};

export interface ProgressionInput {
  totals: DailyTotal[];
  goals: Goal[];
  habits: Habit[];
  checks: HabitCheck[];
  achievements: UnlockedAchievement[];
  today: DateKey;
  weekStartsOn: WeekStart;
}

// ---------------------------------------------------------------------------
// Cumplimientos de objetivos (derivados de los datos y del versionado)
// ---------------------------------------------------------------------------
export interface GoalCompletion {
  sectionId: string | null;
  period: GoalPeriod;
  metric: GoalMetric;
  /** Día (diario) o inicio de la semana/mes. */
  periodStart: DateKey;
}

function sumDays(byDate: Map<DateKey, Measures>, from: DateKey, to: DateKey) {
  let sum = EMPTY_MEASURES;
  for (const d of eachDayKeys(from, to)) {
    const m = byDate.get(d);
    if (m) sum = addMeasures(sum, { ...m });
  }
  return sum;
}

export function goalCompletions(totals: DailyTotal[], goals: Goal[], today: DateKey, weekStartsOn: WeekStart): GoalCompletion[] {
  const scopes = new Map<string, { sectionId: string | null; period: GoalPeriod; metric: GoalMetric; start: DateKey }>();
  for (const g of goals) {
    const key = `${g.sectionId ?? ""}|${g.period}|${g.metric}`;
    const prev = scopes.get(key);
    if (!prev || g.effectiveFrom < prev.start) scopes.set(key, { sectionId: g.sectionId, period: g.period, metric: g.metric, start: g.effectiveFrom });
  }
  const byScope = new Map<string, Map<DateKey, Measures>>();
  const measuresFor = (sectionId: string | null) => {
    const k = sectionId ?? "";
    let m = byScope.get(k);
    if (!m) {
      m = measuresByDate(totals, sectionId ?? undefined);
      byScope.set(k, m);
    }
    return m;
  };

  const result: GoalCompletion[] = [];
  for (const scope of scopes.values()) {
    if (scope.start > today) continue;
    const byDate = measuresFor(scope.sectionId);
    if (scope.period === "daily") {
      for (const day of eachDayKeys(scope.start, today)) {
        const m = byDate.get(day);
        if (!m) continue;
        const goal = goalFor(goals, "daily", scope.sectionId, day, scope.metric);
        if (goal && goalMet(goal, m)) result.push({ ...scope, periodStart: day });
      }
      continue;
    }
    const startOf = (d: DateKey) => (scope.period === "weekly" ? weekRange(d, weekStartsOn).from : monthRange(d).from);
    const next = (d: DateKey) => (scope.period === "weekly" ? addDaysKey(d, 7) : addMonthsKey(d, 1));
    for (let start = startOf(scope.start); start <= today; start = next(start)) {
      const end = scope.period === "weekly" ? addDaysKey(start, 6) : monthRange(start).to;
      const evalDate = end < today ? end : today;
      const goal = goalFor(goals, scope.period, scope.sectionId, evalDate, scope.metric);
      if (goal && goalMet(goal, sumDays(byDate, start, evalDate))) result.push({ ...scope, periodStart: start });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// XP
// ---------------------------------------------------------------------------
export interface XpBreakdown {
  time: number;
  activities: number;
  goals: number;
  habits: number;
  streaks: number;
  achievements: number;
  total: number;
}

export function computeXp(input: ProgressionInput, completions = goalCompletions(input.totals, input.goals, input.today, input.weekStartsOn)): XpBreakdown {
  const { totals, goals, habits, checks, achievements, today } = input;
  const R = XP_RULES;
  const byDate = measuresByDate(totals);

  let time = 0;
  let activities = 0;
  for (const [date, m] of byDate) {
    if (date > today) continue;
    const minutes = m.seconds / 60;
    time += Math.floor(Math.min(minutes, R.maxMinutesPerDay) / R.minutesPerXp);
    const realDay = minutes >= R.minMinutesForActivityXp || m.pages > 0 || m.distance > 0 || m.reps > 0;
    if (realDay) activities += R.activityXp * Math.min(m.count, R.maxActivitiesPerDay);
  }

  // Objetivos: tope de cumplimientos por período y alcance.
  const perPeriod = new Map<string, number>();
  let goalXp = 0;
  for (const c of completions) {
    const scope = c.sectionId ? "section" : "global";
    const key = `${c.period}|${c.periodStart}|${scope}`;
    const n = perPeriod.get(key) ?? 0;
    if (n >= R.maxGoalCompletionsPerPeriod[scope]) continue;
    perPeriod.set(key, n + 1);
    goalXp += R.goalXp[c.period][scope];
  }

  // Rachas: cada día cumplido suma según el largo de la racha (tope 7).
  let streaks = 0;
  const completed = [...completedDatesFor(byDate, goals, today)].sort();
  let run = 0;
  let prev: DateKey | null = null;
  for (const d of completed) {
    run = prev && addDaysKey(prev, 1) === d ? run + 1 : 1;
    streaks += Math.min(run, R.streakMaxRun) * R.streakXpPerDay;
    prev = d;
  }

  // Hábitos: solo checks válidos (no antes de crear el hábito ni en el futuro).
  const habitStart = new Map(habits.map((h) => [h.id, h.startDate]));
  const checksPerDay = new Map<DateKey, number>();
  for (const c of checks) {
    const start = habitStart.get(c.habitId);
    if (!start || c.date < start || c.date > today) continue;
    checksPerDay.set(c.date, (checksPerDay.get(c.date) ?? 0) + 1);
  }
  let habitXp = 0;
  for (const n of checksPerDay.values()) habitXp += Math.min(n, R.maxHabitChecksPerDay) * R.habitXp;

  const achievementXp = achievements.reduce((acc, a) => acc + (ACHIEVEMENTS.find((d) => d.code === a.code)?.xp ?? 0), 0);

  const total = time + activities + goalXp + habitXp + streaks + achievementXp;
  return { time, activities, goals: goalXp, habits: habitXp, streaks, achievements: achievementXp, total };
}

// ---------------------------------------------------------------------------
// Niveles
// ---------------------------------------------------------------------------
/** XP necesario para pasar del nivel `level` al siguiente (crece de a poco). */
export function xpToNext(level: number) {
  return 100 + (level - 1) * 40;
}

export interface LevelInfo {
  level: number;
  /** XP dentro del nivel actual. */
  current: number;
  needed: number;
  ratio: number;
  totalXp: number;
}

export function levelFromXp(totalXp: number): LevelInfo {
  let level = 1;
  let floor = 0;
  while (totalXp >= floor + xpToNext(level)) {
    floor += xpToNext(level);
    level += 1;
  }
  const needed = xpToNext(level);
  const current = totalXp - floor;
  return { level, current, needed, ratio: current / needed, totalXp };
}

export function levelTitle(level: number) {
  if (level >= 50) return "Élite";
  if (level >= 35) return "Maestría";
  if (level >= 20) return "Disciplina";
  if (level >= 10) return "Constancia";
  if (level >= 5) return "Ritmo";
  return "Comienzo";
}

// ---------------------------------------------------------------------------
// Logros
// ---------------------------------------------------------------------------
export interface AchievementStats {
  activeDays: number;
  totalSeconds: number;
  totalActivities: number;
  bestStreak: number;
  goalsCompleted: number;
  weeklyGoalsCompleted: number;
  monthlyGoalsCompleted: number;
  perfectWeeks: number;
  perfectMonths: number;
  maxDaySeconds: number;
  habitChecks: number;
  bestHabitStreak: number;
  level: number;
}

export type AchievementCategory = "Constancia" | "Tiempo" | "Actividades" | "Objetivos" | "Hábitos" | "Nivel";

export interface AchievementDefinition {
  code: string;
  title: string;
  description: string;
  category: AchievementCategory;
  /** Clave de ícono (se resuelve en la UI). */
  icon: "flag" | "flame" | "clock" | "zap" | "check" | "target" | "calendar" | "repeat" | "star" | "crown" | "trophy" | "mountain";
  xp: number;
  /** Progreso actual y meta (logrado cuando current >= target). */
  progress: (s: AchievementStats) => [number, number];
}

const H = 3600;

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Constancia
  { code: "first-day", title: "Primer día", description: "Registraste tu primera actividad.", category: "Constancia", icon: "flag", xp: 20, progress: (s) => [s.activeDays, 1] },
  { code: "streak-3", title: "En marcha", description: "3 días cumplidos seguidos.", category: "Constancia", icon: "flame", xp: 30, progress: (s) => [s.bestStreak, 3] },
  { code: "streak-7", title: "Una semana entera", description: "Racha de 7 días.", category: "Constancia", icon: "flame", xp: 70, progress: (s) => [s.bestStreak, 7] },
  { code: "streak-14", title: "Dos semanas", description: "Racha de 14 días.", category: "Constancia", icon: "flame", xp: 140, progress: (s) => [s.bestStreak, 14] },
  { code: "streak-30", title: "Un mes de constancia", description: "Racha de 30 días.", category: "Constancia", icon: "flame", xp: 300, progress: (s) => [s.bestStreak, 30] },
  { code: "streak-100", title: "Cien días", description: "Racha de 100 días.", category: "Constancia", icon: "mountain", xp: 1000, progress: (s) => [s.bestStreak, 100] },
  { code: "perfect-week", title: "Primera semana completa", description: "Cumpliste todos los días de una semana.", category: "Constancia", icon: "calendar", xp: 100, progress: (s) => [s.perfectWeeks, 1] },
  { code: "perfect-month", title: "Primer mes completo", description: "Cumpliste todos los días de un mes.", category: "Constancia", icon: "calendar", xp: 400, progress: (s) => [s.perfectMonths, 1] },
  // Tiempo
  { code: "hours-10", title: "10 horas", description: "Acumulaste 10 horas registradas.", category: "Tiempo", icon: "clock", xp: 50, progress: (s) => [Math.floor(s.totalSeconds / H), 10] },
  { code: "hours-100", title: "100 horas", description: "Acumulaste 100 horas registradas.", category: "Tiempo", icon: "clock", xp: 300, progress: (s) => [Math.floor(s.totalSeconds / H), 100] },
  { code: "hours-500", title: "500 horas", description: "Acumulaste 500 horas registradas.", category: "Tiempo", icon: "clock", xp: 800, progress: (s) => [Math.floor(s.totalSeconds / H), 500] },
  { code: "hours-1000", title: "1000 horas", description: "Acumulaste 1000 horas. Nivel experto.", category: "Tiempo", icon: "crown", xp: 1500, progress: (s) => [Math.floor(s.totalSeconds / H), 1000] },
  { code: "deep-day", title: "Día intenso", description: "6 horas en un mismo día.", category: "Tiempo", icon: "zap", xp: 60, progress: (s) => [Math.floor(s.maxDaySeconds / 60), 360] },
  // Actividades
  { code: "activities-10", title: "10 actividades", description: "Registraste 10 actividades.", category: "Actividades", icon: "check", xp: 30, progress: (s) => [s.totalActivities, 10] },
  { code: "activities-100", title: "100 actividades", description: "Registraste 100 actividades.", category: "Actividades", icon: "check", xp: 150, progress: (s) => [s.totalActivities, 100] },
  { code: "activities-500", title: "500 actividades", description: "Registraste 500 actividades.", category: "Actividades", icon: "star", xp: 500, progress: (s) => [s.totalActivities, 500] },
  // Objetivos
  { code: "first-goal", title: "Primer objetivo cumplido", description: "Alcanzaste un objetivo por primera vez.", category: "Objetivos", icon: "target", xp: 30, progress: (s) => [s.goalsCompleted, 1] },
  { code: "goals-10", title: "10 objetivos cumplidos", description: "Alcanzaste 10 objetivos.", category: "Objetivos", icon: "target", xp: 100, progress: (s) => [s.goalsCompleted, 10] },
  { code: "goals-50", title: "50 objetivos cumplidos", description: "Alcanzaste 50 objetivos.", category: "Objetivos", icon: "trophy", xp: 300, progress: (s) => [s.goalsCompleted, 50] },
  { code: "weekly-goal", title: "Semana cumplida", description: "Cumpliste un objetivo semanal.", category: "Objetivos", icon: "target", xp: 60, progress: (s) => [s.weeklyGoalsCompleted, 1] },
  { code: "monthly-goal", title: "Mes cumplido", description: "Cumpliste un objetivo mensual.", category: "Objetivos", icon: "trophy", xp: 150, progress: (s) => [s.monthlyGoalsCompleted, 1] },
  // Hábitos
  { code: "first-habit", title: "Primer hábito", description: "Completaste un hábito por primera vez.", category: "Hábitos", icon: "repeat", xp: 20, progress: (s) => [s.habitChecks, 1] },
  { code: "habit-streak-7", title: "Hábito en marcha", description: "Racha de 7 en un hábito.", category: "Hábitos", icon: "repeat", xp: 70, progress: (s) => [s.bestHabitStreak, 7] },
  { code: "habit-streak-30", title: "Hábito consolidado", description: "Racha de 30 en un hábito.", category: "Hábitos", icon: "mountain", xp: 300, progress: (s) => [s.bestHabitStreak, 30] },
  { code: "habit-checks-100", title: "100 hábitos", description: "Completaste hábitos 100 veces.", category: "Hábitos", icon: "check", xp: 150, progress: (s) => [s.habitChecks, 100] },
  // Nivel (no dan XP: evita bucles nivel -> logro -> nivel)
  { code: "level-5", title: "Nivel 5", description: "Llegaste al nivel 5.", category: "Nivel", icon: "star", xp: 0, progress: (s) => [s.level, 5] },
  { code: "level-10", title: "Nivel 10", description: "Llegaste al nivel 10.", category: "Nivel", icon: "star", xp: 0, progress: (s) => [s.level, 10] },
  { code: "level-25", title: "Nivel 25", description: "Llegaste al nivel 25.", category: "Nivel", icon: "crown", xp: 0, progress: (s) => [s.level, 25] },
];

export function achievementStats(input: ProgressionInput, completions: GoalCompletion[], level: number): AchievementStats {
  const { totals, goals, habits, checks, today, weekStartsOn } = input;
  const byDate = measuresByDate(totals);
  let activeDays = 0;
  let totalSeconds = 0;
  let totalActivities = 0;
  let maxDaySeconds = 0;
  for (const [date, m] of byDate) {
    if (date > today) continue;
    activeDays += 1;
    totalSeconds += m.seconds;
    totalActivities += m.count;
    maxDaySeconds = Math.max(maxDaySeconds, m.seconds);
  }

  const completed = completedDatesFor(byDate, goals, today);
  const streak = streaksFromCompleted(completed, today);

  // Semanas y meses completos (todos sus días cumplidos).
  const perWeek = new Map<DateKey, number>();
  const perMonth = new Map<DateKey, number>();
  for (const d of completed) {
    const w = weekRange(d, weekStartsOn).from;
    const m = monthRange(d).from;
    perWeek.set(w, (perWeek.get(w) ?? 0) + 1);
    perMonth.set(m, (perMonth.get(m) ?? 0) + 1);
  }
  const perfectWeeks = [...perWeek.values()].filter((n) => n === 7).length;
  const perfectMonths = [...perMonth.entries()].filter(([m, n]) => n === eachDayKeys(m, monthRange(m).to).length).length;

  const byHabit = checksByHabit(checks);
  let bestHabitStreak = 0;
  let habitChecks = 0;
  for (const h of habits) {
    const done = byHabit.get(h.id) ?? new Set<DateKey>();
    habitChecks += [...done].filter((d) => d >= h.startDate && d <= today).length;
    bestHabitStreak = Math.max(bestHabitStreak, habitStreak(h, done, today, weekStartsOn).best);
  }

  return {
    activeDays,
    totalSeconds,
    totalActivities,
    bestStreak: streak.best,
    goalsCompleted: completions.length,
    weeklyGoalsCompleted: completions.filter((c) => c.period === "weekly").length,
    monthlyGoalsCompleted: completions.filter((c) => c.period === "monthly").length,
    perfectWeeks,
    perfectMonths,
    maxDaySeconds,
    habitChecks,
    bestHabitStreak,
    level,
  };
}

export interface AchievementStatus {
  definition: AchievementDefinition;
  earned: boolean;
  unlockedAt: string | null;
  current: number;
  target: number;
}

export interface Progression {
  xp: XpBreakdown;
  level: LevelInfo;
  stats: AchievementStats;
  achievements: AchievementStatus[];
  /** Logros cumplidos que todavía no están guardados como desbloqueados. */
  newlyEarned: string[];
  completions: GoalCompletion[];
}

export function computeProgression(input: ProgressionInput): Progression {
  const completions = goalCompletions(input.totals, input.goals, input.today, input.weekStartsOn);
  const xp = computeXp(input, completions);
  const level = levelFromXp(xp.total);
  const stats = achievementStats(input, completions, level.level);
  const unlocked = new Map(input.achievements.map((a) => [a.code, a.unlockedAt]));
  const achievements = ACHIEVEMENTS.map((definition) => {
    const [current, target] = definition.progress(stats);
    const unlockedAt = unlocked.get(definition.code) ?? null;
    // Una vez desbloqueado, queda desbloqueado aunque los datos cambien.
    return { definition, earned: Boolean(unlockedAt) || current >= target, unlockedAt, current: Math.min(current, target), target };
  });
  const newlyEarned = achievements.filter((a) => a.earned && !a.unlockedAt).map((a) => a.definition.code);
  return { xp, level, stats, achievements, newlyEarned, completions };
}
