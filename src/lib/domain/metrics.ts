import { formatDuration, formatMinutes } from "../format";
import type { DailyTotal, GoalMetric, GoalPeriod } from "../types";

/** Medidas agregadas de un día (o rango). Tiempo en segundos. */
export interface Measures {
  seconds: number;
  count: number;
  pages: number;
  distance: number;
  reps: number;
}

export const EMPTY_MEASURES: Measures = { seconds: 0, count: 0, pages: 0, distance: 0, reps: 0 };

export function addMeasures(a: Measures, b: Pick<DailyTotal, keyof Measures>): Measures {
  return {
    seconds: a.seconds + b.seconds,
    count: a.count + b.count,
    pages: a.pages + b.pages,
    distance: Math.round((a.distance + b.distance) * 100) / 100,
    reps: a.reps + b.reps,
  };
}

export const GOAL_METRICS: GoalMetric[] = ["time", "count", "pages", "distance", "reps"];

export const METRIC_META: Record<
  GoalMetric,
  { label: string; unit: string; hint: string; step: number; max: number; placeholder: string }
> = {
  time: { label: "Tiempo", unit: "min", hint: "Ej: Programación → 2 horas · Inglés → 30 minutos", step: 1, max: 44640, placeholder: "" },
  count: { label: "Veces", unit: "veces", hint: "Ej: Gym → 4 veces por semana", step: 1, max: 1000, placeholder: "4" },
  pages: { label: "Páginas", unit: "páginas", hint: "Ej: Lectura → 30 páginas por día", step: 1, max: 100000, placeholder: "30" },
  distance: { label: "Distancia", unit: "km", hint: "Ej: Running → 5 km", step: 0.1, max: 100000, placeholder: "5" },
  reps: { label: "Repeticiones", unit: "repeticiones", hint: "Ej: Flexiones → 100 por día", step: 1, max: 1000000, placeholder: "100" },
};

export const PERIOD_SUFFIX: Record<GoalPeriod, string> = {
  daily: "por día",
  weekly: "por semana",
  monthly: "por mes",
};

/** Valor de una métrica en su unidad base (tiempo: segundos). */
export function measureValue(m: Measures, metric: GoalMetric) {
  switch (metric) {
    case "time":
      return m.seconds;
    case "count":
      return m.count;
    case "pages":
      return m.pages;
    case "distance":
      return m.distance;
    case "reps":
      return m.reps;
  }
}

/** Meta del objetivo en la unidad base (tiempo: minutos -> segundos). */
export function targetBase(metric: GoalMetric, target: number) {
  return metric === "time" ? Math.round(target * 60) : target;
}

function formatNumber(n: number) {
  return Number.isInteger(n) ? n.toLocaleString("es-AR") : n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

/** Valor en unidad base con su unidad: 5400 s -> "1h 30m", 30 páginas -> "30 págs". */
export function formatMeasure(metric: GoalMetric, value: number) {
  switch (metric) {
    case "time":
      return formatDuration(value);
    case "count":
      return `${formatNumber(value)} ${value === 1 ? "vez" : "veces"}`;
    case "pages":
      return `${formatNumber(value)} ${value === 1 ? "pág" : "págs"}`;
    case "distance":
      return `${formatNumber(value)} km`;
    case "reps":
      return `${formatNumber(value)} reps`;
  }
}

/** Meta legible: (time, 180) -> "3h", (pages, 30) -> "30 páginas". */
export function formatTarget(metric: GoalMetric, target: number) {
  switch (metric) {
    case "time":
      return formatMinutes(target);
    case "count":
      return `${formatNumber(target)} ${target === 1 ? "vez" : "veces"}`;
    case "pages":
      return `${formatNumber(target)} ${target === 1 ? "página" : "páginas"}`;
    case "distance":
      return `${formatNumber(target)} km`;
    case "reps":
      return `${formatNumber(target)} ${target === 1 ? "repetición" : "repeticiones"}`;
  }
}
