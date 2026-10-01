import {
  type DateKey,
  type DateRange,
  type WeekStart,
  addDaysKey,
  addMonthsKey,
  eachDayKeys,
  monthRange,
  weekRange,
} from "../dates";
import type { DailyTotal, Goal } from "../types";
import { activeGoalsFor, goalMet } from "./goals";
import { EMPTY_MEASURES, type Measures, addMeasures } from "./metrics";

export const NO_SECTION_KEY = "none";

export function sectionKey(sectionId: string | null) {
  return sectionId ?? NO_SECTION_KEY;
}

function inRange(date: DateKey, range: DateRange) {
  return date >= range.from && date <= range.to;
}

/** Suma todas las medidas en un rango (opcionalmente de una sección; null = sin sección). */
export function sumInRange(totals: DailyTotal[], range: DateRange, sectionId?: string | null): Measures {
  let sum = EMPTY_MEASURES;
  for (const t of totals) {
    if (!inRange(t.date, range)) continue;
    if (sectionId !== undefined && t.sectionId !== sectionId) continue;
    sum = addMeasures(sum, t);
  }
  return sum;
}

export function sumAll(totals: DailyTotal[]): Measures {
  let sum = EMPTY_MEASURES;
  for (const t of totals) sum = addMeasures(sum, t);
  return sum;
}

export type SeriesRow = { key: DateKey; total: number } & Record<string, number | string>;

/** Una fila por día con el total y el desglose por sección (para barras apiladas). */
export function dailySeries(totals: DailyTotal[], range: DateRange): SeriesRow[] {
  const rows = new Map<DateKey, SeriesRow>();
  for (const key of eachDayKeys(range.from, range.to)) rows.set(key, { key, total: 0 });
  for (const t of totals) {
    const row = rows.get(t.date);
    if (!row) continue;
    const sk = sectionKey(t.sectionId);
    row[sk] = ((row[sk] as number | undefined) ?? 0) + t.seconds;
    row.total += t.seconds;
  }
  return [...rows.values()];
}

/** Una fila por mes (key = primer día del mes), terminando en el mes de `endKey`. */
export function monthlySeries(totals: DailyTotal[], endKey: DateKey, months: number): SeriesRow[] {
  const rows: SeriesRow[] = [];
  const index = new Map<string, SeriesRow>();
  const lastMonthStart = monthRange(endKey).from;
  for (let i = months - 1; i >= 0; i--) {
    const key = addMonthsKey(lastMonthStart, -i);
    const row: SeriesRow = { key, total: 0 };
    rows.push(row);
    index.set(key.slice(0, 7), row);
  }
  for (const t of totals) {
    const row = index.get(t.date.slice(0, 7));
    if (!row) continue;
    const sk = sectionKey(t.sectionId);
    row[sk] = ((row[sk] as number | undefined) ?? 0) + t.seconds;
    row.total += t.seconds;
  }
  return rows;
}

export type Bucket = "day" | "week" | "month";

/** Agrupación adecuada para mostrar un rango sin saturar el gráfico. */
export function bucketFor(range: DateRange): Bucket {
  const days = eachDayKeys(range.from, range.to).length;
  if (days > 400) return "month";
  if (days > 92) return "week";
  return "day";
}

/** Serie apilada por sección agrupada por día, semana o mes (key = inicio del grupo). */
export function bucketedSeries(totals: DailyTotal[], range: DateRange, bucket: Bucket, weekStartsOn: WeekStart): SeriesRow[] {
  if (bucket === "day") return dailySeries(totals, range);
  const keyOf = (date: DateKey) => (bucket === "week" ? weekRange(date, weekStartsOn).from : monthRange(date).from);
  const rows = new Map<DateKey, SeriesRow>();
  for (let cursor = keyOf(range.from); cursor <= range.to; ) {
    rows.set(cursor, { key: cursor, total: 0 });
    cursor = bucket === "week" ? addDaysKey(cursor, 7) : addMonthsKey(cursor, 1);
  }
  for (const t of totals) {
    if (!inRange(t.date, range)) continue;
    const row = rows.get(keyOf(t.date));
    if (!row) continue;
    const sk = sectionKey(t.sectionId);
    row[sk] = ((row[sk] as number | undefined) ?? 0) + t.seconds;
    row.total += t.seconds;
  }
  return [...rows.values()];
}

/** Totales por semana para las últimas `weeks` semanas. */
export function weeklySeries(
  byDate: Map<DateKey, number>,
  endKey: DateKey,
  weeks: number,
  weekStartsOn: WeekStart,
): { key: DateKey; total: number }[] {
  const lastWeekStart = weekRange(endKey, weekStartsOn).from;
  const result: { key: DateKey; total: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const from = addDaysKey(lastWeekStart, -7 * i);
    const to = addDaysKey(from, 6);
    let total = 0;
    for (const day of eachDayKeys(from, to)) total += byDate.get(day) ?? 0;
    result.push({ key: from, total });
  }
  return result;
}

export function sectionDistribution(totals: DailyTotal[], range: DateRange) {
  const map = new Map<string | null, { seconds: number; count: number }>();
  for (const t of totals) {
    if (!inRange(t.date, range)) continue;
    const prev = map.get(t.sectionId) ?? { seconds: 0, count: 0 };
    map.set(t.sectionId, { seconds: prev.seconds + t.seconds, count: prev.count + t.count });
  }
  return [...map.entries()]
    .map(([sectionId, v]) => ({ sectionId, ...v }))
    .filter((d) => d.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds);
}

export function activeDaysInRange(byDate: Map<DateKey, number>, range: DateRange) {
  let days = 0;
  for (const [date, seconds] of byDate) if (seconds > 0 && inRange(date, range)) days++;
  return days;
}

export function bestDayInRange(byDate: Map<DateKey, number>, range: DateRange) {
  let best: { date: DateKey; seconds: number } | null = null;
  for (const [date, seconds] of byDate) {
    if (!inRange(date, range) || seconds <= 0) continue;
    if (!best || seconds > best.seconds) best = { date, seconds };
  }
  return best;
}

/**
 * Cumplimiento del objetivo diario en un rango. Solo cuenta días que tenían
 * objetivo y que ya terminaron; hoy cuenta únicamente si ya se cumplió.
 */
export function dailyGoalCompletion(
  byDate: Map<DateKey, Measures>,
  goals: Goal[],
  range: DateRange,
  today: DateKey,
  sectionId: string | null = null,
) {
  let withGoal = 0;
  let met = 0;
  const to = range.to < today ? range.to : today;
  for (const day of eachDayKeys(range.from, to)) {
    const daily = activeGoalsFor(goals, "daily", sectionId, day);
    if (!daily.length) continue;
    const measures = byDate.get(day) ?? EMPTY_MEASURES;
    const reached = daily.every((g) => goalMet(g, measures));
    if (day === today && !reached) continue;
    withGoal++;
    if (reached) met++;
  }
  return { withGoal, met, ratio: withGoal ? met / withGoal : 0 };
}

/** Cumplimiento del objetivo diario agrupado por semana (0..100), para graficar. */
export function complianceByWeek(
  byDate: Map<DateKey, Measures>,
  goals: Goal[],
  range: DateRange,
  today: DateKey,
  weekStartsOn: WeekStart,
) {
  const result: { key: DateKey; total: number; met: number; withGoal: number }[] = [];
  for (let start = weekRange(range.from, weekStartsOn).from; start <= range.to && start <= today; start = addDaysKey(start, 7)) {
    const end = addDaysKey(start, 6);
    const c = dailyGoalCompletion(byDate, goals, { from: start < range.from ? range.from : start, to: end > range.to ? range.to : end }, today);
    result.push({ key: start, total: Math.round(c.ratio * 100), met: c.met, withGoal: c.withGoal });
  }
  return result;
}

/** Primer día con actividad registrada (para acotar rangos "desde siempre"). */
export function firstActivityDate(totals: DailyTotal[]): DateKey | null {
  let first: DateKey | null = null;
  for (const t of totals) if (!first || t.date < first) first = t.date;
  return first;
}
