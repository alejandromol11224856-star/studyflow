import { type DateKey, type DateRange, type WeekStart, monthRange, weekRange } from "../dates";
import type { Goal, GoalMetric, GoalPeriod } from "../types";
import { type Measures, PERIOD_SUFFIX, formatTarget, measureValue, targetBase } from "./metrics";

export const GOAL_PERIODS: GoalPeriod[] = ["daily", "weekly", "monthly"];

export const PERIOD_LABEL: Record<GoalPeriod, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
};

export const PERIOD_NOUN: Record<GoalPeriod, string> = {
  daily: "hoy",
  weekly: "esta semana",
  monthly: "este mes",
};

/**
 * Versión del objetivo vigente en una fecha. Devuelve null si no hay
 * objetivo o si la versión vigente lo desactivó (target = 0).
 */
export function goalFor(
  goals: Goal[],
  period: GoalPeriod,
  sectionId: string | null,
  date: DateKey,
  metric: GoalMetric = "time",
): Goal | null {
  let best: Goal | null = null;
  for (const goal of goals) {
    if (goal.period !== period || goal.metric !== metric || goal.sectionId !== sectionId || goal.effectiveFrom > date) continue;
    if (
      !best ||
      goal.effectiveFrom > best.effectiveFrom ||
      (goal.effectiveFrom === best.effectiveFrom && goal.createdAt > best.createdAt)
    ) {
      best = goal;
    }
  }
  return best && best.target > 0 ? best : null;
}

/** Meta vigente en la unidad de la métrica (tiempo: minutos). 0 si no hay. */
export function goalTargetFor(goals: Goal[], period: GoalPeriod, sectionId: string | null, date: DateKey, metric: GoalMetric = "time") {
  return goalFor(goals, period, sectionId, date, metric)?.target ?? 0;
}

/** Atajo para objetivos de tiempo (minutos). */
export function goalMinutesFor(goals: Goal[], period: GoalPeriod, sectionId: string | null, date: DateKey) {
  return goalTargetFor(goals, period, sectionId, date, "time");
}

/** Todos los objetivos activos de un período y alcance en una fecha (cualquier métrica). */
export function activeGoalsFor(goals: Goal[], period: GoalPeriod, sectionId: string | null, date: DateKey) {
  const metrics = new Set(goals.filter((g) => g.period === period && g.sectionId === sectionId).map((g) => g.metric));
  const result: Goal[] = [];
  for (const metric of metrics) {
    const goal = goalFor(goals, period, sectionId, date, metric);
    if (goal) result.push(goal);
  }
  return result;
}

export function periodRange(period: GoalPeriod, date: DateKey, weekStartsOn: WeekStart): DateRange {
  if (period === "daily") return { from: date, to: date };
  if (period === "weekly") return weekRange(date, weekStartsOn);
  return monthRange(date);
}

export interface GoalProgress {
  /** Valores en unidad base (tiempo en segundos). */
  target: number;
  done: number;
  remaining: number;
  /** 0..1 */
  ratio: number;
  completed: boolean;
}

/** Progreso genérico: `done` y `target` en la misma unidad. */
export function computeProgress(done: number, target: number): GoalProgress {
  const safeDone = Math.max(0, done);
  if (target <= 0) return { target: 0, done: safeDone, remaining: 0, ratio: 0, completed: false };
  return {
    target,
    done: safeDone,
    remaining: Math.max(0, target - safeDone),
    ratio: Math.min(1, safeDone / target),
    completed: safeDone >= target,
  };
}

/** ¿Las medidas alcanzan el objetivo? */
export function goalMet(goal: Pick<Goal, "metric" | "target">, measures: Measures) {
  return goal.target > 0 && measureValue(measures, goal.metric) >= targetBase(goal.metric, goal.target);
}

export function goalProgress(goal: Pick<Goal, "metric" | "target">, measures: Measures) {
  return computeProgress(measureValue(measures, goal.metric), targetBase(goal.metric, goal.target));
}

/** Última versión activa de cada objetivo (por sección, período y métrica). */
export function currentGoals(goals: Goal[], date: DateKey) {
  const keys = new Set(goals.map((g) => `${g.sectionId ?? "global"}|${g.period}|${g.metric}`));
  const result: Goal[] = [];
  for (const key of keys) {
    const [section, period, metric] = key.split("|");
    const goal = goalFor(goals, period as GoalPeriod, section === "global" ? null : section, date, metric as GoalMetric);
    if (goal) result.push(goal);
  }
  const order: Record<GoalPeriod, number> = { daily: 0, weekly: 1, monthly: 2 };
  return result.sort(
    (a, b) => order[a.period] - order[b.period] || Number(a.sectionId !== null) - Number(b.sectionId !== null),
  );
}

/** "3h por día", "4 veces por semana". */
export function goalSummary(goal: Pick<Goal, "metric" | "target" | "period">) {
  return `${formatTarget(goal.metric, goal.target)} ${PERIOD_SUFFIX[goal.period]}`;
}
