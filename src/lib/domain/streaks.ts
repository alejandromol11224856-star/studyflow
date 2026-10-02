import { type DateKey, addDaysKey, eachDayKeys } from "../dates";
import type { DailyTotal, Goal } from "../types";
import { activeGoalsFor, goalMet } from "./goals";
import { EMPTY_MEASURES, type Measures, addMeasures } from "./metrics";

/**
 * Segundos por día. Si se pasa `sectionId` (string) filtra por esa sección;
 * `undefined` suma todas.
 */
export function totalsByDate(totals: DailyTotal[], sectionId?: string): Map<DateKey, number> {
  const map = new Map<DateKey, number>();
  for (const t of totals) {
    if (sectionId !== undefined && t.sectionId !== sectionId) continue;
    map.set(t.date, (map.get(t.date) ?? 0) + t.seconds);
  }
  return map;
}

/** Todas las medidas por día (tiempo, veces, páginas, distancia, repeticiones). */
export function measuresByDate(totals: DailyTotal[], sectionId?: string): Map<DateKey, Measures> {
  const map = new Map<DateKey, Measures>();
  for (const t of totals) {
    if (sectionId !== undefined && t.sectionId !== sectionId) continue;
    map.set(t.date, addMeasures(map.get(t.date) ?? EMPTY_MEASURES, t));
  }
  return map;
}

/**
 * Un día cuenta como "cumplido" si:
 *  - había objetivos diarios ese día (de cualquier métrica) y se alcanzaron todos, o
 *  - no había objetivo diario y se registró alguna actividad.
 */
export function isDayCompleted(date: DateKey, measures: Measures, goals: Goal[], sectionId: string | null = null): boolean {
  if (measures.count <= 0) return false;
  const daily = activeGoalsFor(goals, "daily", sectionId, date);
  return daily.length === 0 || daily.every((g) => goalMet(g, measures));
}

export interface StreakSummary {
  current: number;
  best: number;
  /** Rango de la mejor racha (para mostrar cuándo se consiguió). */
  bestRange: { from: DateKey; to: DateKey } | null;
  todayCompleted: boolean;
  completedDates: Set<DateKey>;
}

export function completedDatesFor(byDate: Map<DateKey, Measures>, goals: Goal[], today: DateKey, sectionId: string | null = null) {
  const completed = new Set<DateKey>();
  for (const [date, measures] of byDate) {
    if (date > today) continue;
    if (isDayCompleted(date, measures, goals, sectionId)) completed.add(date);
  }
  return completed;
}

export function streaksFromCompleted(completedDates: Set<DateKey>, today: DateKey): StreakSummary {
  const sorted = [...completedDates].sort();
  let best = 0;
  let bestRange: StreakSummary["bestRange"] = null;
  let run = 0;
  let runStart: DateKey | null = null;
  let prev: DateKey | null = null;
  for (const date of sorted) {
    if (prev && addDaysKey(prev, 1) === date) {
      run += 1;
    } else {
      run = 1;
      runStart = date;
    }
    if (run > best) {
      best = run;
      bestRange = { from: runStart ?? date, to: date };
    }
    prev = date;
  }

  // Racha actual: si hoy todavía no se cumplió, sigue viva desde ayer.
  const todayCompleted = completedDates.has(today);
  let current = 0;
  let cursor = todayCompleted ? today : addDaysKey(today, -1);
  while (completedDates.has(cursor)) {
    current += 1;
    cursor = addDaysKey(cursor, -1);
  }

  return { current, best: Math.max(best, current), bestRange, todayCompleted, completedDates };
}

export function computeStreaks(params: {
  byDate: Map<DateKey, Measures>;
  goals: Goal[];
  today: DateKey;
  sectionId?: string | null;
}): StreakSummary {
  const { byDate, goals, today, sectionId = null } = params;
  return streaksFromCompleted(completedDatesFor(byDate, goals, today, sectionId), today);
}

/** Largo de la racha día a día (para el gráfico de evolución). */
export function streakSeries(completedDates: Set<DateKey>, from: DateKey, to: DateKey) {
  // Arrancar con la racha que venía antes del rango.
  let run = 0;
  let cursor = addDaysKey(from, -1);
  while (completedDates.has(cursor)) {
    run += 1;
    cursor = addDaysKey(cursor, -1);
  }
  return eachDayKeys(from, to).map((key) => {
    run = completedDates.has(key) ? run + 1 : 0;
    return { key, total: run };
  });
}

/** Racha más larga dentro de un rango (sin contar lo que venía de antes). */
export function longestRunInRange(completedDates: Set<DateKey>, from: DateKey, to: DateKey) {
  if (from > to) return 0;
  let best = 0;
  let run = 0;
  for (const key of eachDayKeys(from, to)) {
    run = completedDates.has(key) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}
