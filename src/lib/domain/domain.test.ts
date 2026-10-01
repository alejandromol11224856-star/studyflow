import { describe, expect, it } from "vitest";
import { addDaysKey, dateKeyInTimeZone, monthRange, weekRange, zonedTimeToIso } from "../dates";
import { formatClock, formatDuration, timeTicks } from "../format";
import type { DailyTotal, Goal } from "../types";
import { computeProgress, goalFor, goalMinutesFor, periodRange } from "./goals";
import { dailyGoalCompletion, dailySeries, sectionDistribution, sumInRange } from "./stats";
import { computeStreaks, measuresByDate as totalsByDate } from "./streaks";
import { pauseTimer, resumeTimer, startTimer, timerElapsedSeconds } from "./timer";

/** Objetivo de tiempo (minutos) por defecto; otras métricas vía `metric`. */
const goal = (p: Partial<Goal> & { targetMinutes?: number; effectiveFrom: string }): Goal => {
  const { targetMinutes, ...rest } = p;
  return {
    id: Math.random().toString(36),
    sectionId: null,
    period: "daily",
    metric: "time",
    target: targetMinutes ?? 0,
    createdAt: `${p.effectiveFrom}T00:00:00Z`,
    ...rest,
  };
};

const total = (date: string, minutes: number, sectionId: string | null = null): DailyTotal => ({
  date,
  sectionId,
  seconds: minutes * 60,
  count: 1,
  pages: 0,
  distance: 0,
  reps: 0,
});

describe("objetivos versionados", () => {
  const goals = [goal({ targetMinutes: 120, effectiveFrom: "2026-09-01" }), goal({ targetMinutes: 180, effectiveFrom: "2026-09-20" })];

  it("usa la versión vigente en cada fecha", () => {
    expect(goalMinutesFor(goals, "daily", null, "2026-08-31")).toBe(0);
    expect(goalMinutesFor(goals, "daily", null, "2026-09-10")).toBe(120);
    expect(goalMinutesFor(goals, "daily", null, "2026-09-20")).toBe(180);
    expect(goalMinutesFor(goals, "daily", null, "2026-10-01")).toBe(180);
  });

  it("una versión con 0 minutos desactiva el objetivo", () => {
    const off = [...goals, goal({ targetMinutes: 0, effectiveFrom: "2026-09-25" })];
    expect(goalFor(off, "daily", null, "2026-09-26")).toBeNull();
    expect(goalMinutesFor(off, "daily", null, "2026-09-21")).toBe(180);
  });

  it("separa objetivos globales y por sección", () => {
    const mixed = [...goals, goal({ targetMinutes: 30, effectiveFrom: "2026-09-01", sectionId: "eng" })];
    expect(goalMinutesFor(mixed, "daily", "eng", "2026-09-10")).toBe(30);
    expect(goalMinutesFor(mixed, "daily", null, "2026-09-10")).toBe(120);
    expect(goalMinutesFor(mixed, "weekly", null, "2026-09-10")).toBe(0);
  });

  it("calcula progreso, restante y cumplimiento", () => {
    expect(computeProgress(2 * 3600 + 15 * 60, 3 * 3600)).toMatchObject({
      remaining: 45 * 60,
      completed: false,
      ratio: 0.75,
    });
    expect(computeProgress(3 * 3600, 3 * 3600)).toMatchObject({ remaining: 0, completed: true, ratio: 1 });
    expect(computeProgress(4 * 3600, 3 * 3600).ratio).toBe(1);
    expect(computeProgress(100, 0)).toMatchObject({ completed: false, ratio: 0 });
  });

  it("rangos de período (semana desde el lunes, mes calendario)", () => {
    expect(periodRange("weekly", "2026-10-01", 1)).toEqual({ from: "2026-09-28", to: "2026-10-04" });
    expect(periodRange("weekly", "2026-10-01", 0)).toEqual({ from: "2026-09-27", to: "2026-10-03" });
    expect(periodRange("monthly", "2026-02-10", 1)).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });
});

describe("rachas", () => {
  const today = "2026-10-01";

  it("sin objetivo, cuenta días con actividad y la racha sigue viva si hoy falta", () => {
    const byDate = totalsByDate([total("2026-09-28", 10), total("2026-09-29", 10), total("2026-09-30", 10)]);
    const s = computeStreaks({ byDate, goals: [], today });
    expect(s).toMatchObject({ current: 3, best: 3, todayCompleted: false });
  });

  it("con objetivo, solo cuentan los días que lo alcanzaron", () => {
    const goals = [goal({ targetMinutes: 60, effectiveFrom: "2026-01-01" })];
    const byDate = totalsByDate([
      total("2026-09-26", 90),
      total("2026-09-27", 70),
      total("2026-09-28", 30), // no alcanza: corta la racha
      total("2026-09-29", 60),
      total("2026-09-30", 61),
      total(today, 65),
    ]);
    const s = computeStreaks({ byDate, goals, today });
    expect(s.current).toBe(3);
    expect(s.best).toBe(3);
    expect(s.todayCompleted).toBe(true);
  });

  it("un día sin actividad corta la racha actual pero conserva la mejor", () => {
    const byDate = totalsByDate([total("2026-09-20", 10), total("2026-09-21", 10), total("2026-09-22", 10), total("2026-09-30", 10)]);
    const s = computeStreaks({ byDate, goals: [], today });
    expect(s.current).toBe(1);
    expect(s.best).toBe(3);
  });

  it("filtra por sección", () => {
    const totals = [total("2026-09-30", 10, "gym"), total(today, 10, "study")];
    expect(computeStreaks({ byDate: totalsByDate(totals, "gym"), goals: [], today, sectionId: "gym" }).current).toBe(1);
    expect(computeStreaks({ byDate: totalsByDate(totals), goals: [], today }).current).toBe(2);
  });

  it("ignora días futuros", () => {
    const byDate = totalsByDate([total("2026-10-05", 10)]);
    expect(computeStreaks({ byDate, goals: [], today }).best).toBe(0);
  });
});

describe("estadísticas", () => {
  const totals = [total("2026-09-29", 60, "a"), total("2026-09-29", 30, "b"), total("2026-09-30", 45, "a"), total("2026-10-01", 15, null)];

  it("suma por rango y por sección", () => {
    expect(sumInRange(totals, { from: "2026-09-29", to: "2026-09-30" }).seconds).toBe(135 * 60);
    expect(sumInRange(totals, { from: "2026-09-01", to: "2026-10-31" }, "a").seconds).toBe(105 * 60);
    expect(sumInRange(totals, { from: "2026-09-01", to: "2026-10-31" }, null).seconds).toBe(15 * 60);
  });

  it("serie diaria con días vacíos y desglose", () => {
    const rows = dailySeries(totals, { from: "2026-09-28", to: "2026-10-01" });
    expect(rows.map((r) => r.total)).toEqual([0, 90 * 60, 45 * 60, 15 * 60]);
    expect(rows[1]).toMatchObject({ a: 3600, b: 1800 });
    expect(rows[3]).toMatchObject({ none: 900 });
  });

  it("distribución ordenada de mayor a menor", () => {
    expect(sectionDistribution(totals, { from: "2026-09-01", to: "2026-10-31" }).map((d) => d.sectionId)).toEqual(["a", "b", null]);
  });

  it("cumplimiento: hoy solo cuenta si ya se cumplió", () => {
    const goals = [goal({ targetMinutes: 60, effectiveFrom: "2026-09-01" })];
    const byDate = totalsByDate(totals);
    const r = dailyGoalCompletion(byDate, goals, { from: "2026-09-29", to: "2026-10-01" }, "2026-10-01");
    expect(r).toMatchObject({ withGoal: 2, met: 1 });
  });
});

describe("fechas y zonas horarias", () => {
  it("el día depende de la zona horaria del usuario", () => {
    const instant = new Date("2026-10-01T02:30:00Z");
    expect(dateKeyInTimeZone(instant, "UTC")).toBe("2026-10-01");
    expect(dateKeyInTimeZone(instant, "America/Argentina/Buenos_Aires")).toBe("2026-09-30");
  });

  it("convierte hora local a instante UTC", () => {
    expect(zonedTimeToIso("2026-10-01", "09:30", "America/Argentina/Buenos_Aires")).toBe("2026-10-01T12:30:00.000Z");
    expect(zonedTimeToIso("2026-07-01", "09:00", "Europe/Madrid")).toBe("2026-07-01T07:00:00.000Z");
    expect(zonedTimeToIso("2026-01-15", "09:00", "Europe/Madrid")).toBe("2026-01-15T08:00:00.000Z");
  });

  it("aritmética de días cruzando meses y años bisiestos", () => {
    expect(addDaysKey("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDaysKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(monthRange("2028-02-15")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(weekRange("2026-01-01", 1)).toEqual({ from: "2025-12-29", to: "2026-01-04" });
  });
});

describe("temporizador", () => {
  it("acumula tiempo con pausas", () => {
    const t0 = new Date("2026-10-01T10:00:00Z");
    let timer = startTimer({ sectionId: null, title: "" }, t0);
    expect(timerElapsedSeconds(timer, t0.getTime() + 90_000)).toBe(90);
    timer = pauseTimer(timer, new Date(t0.getTime() + 120_000));
    expect(timerElapsedSeconds(timer, t0.getTime() + 999_000)).toBe(120);
    timer = resumeTimer(timer, new Date(t0.getTime() + 600_000));
    expect(timerElapsedSeconds(timer, t0.getTime() + 630_000)).toBe(150);
  });
});

describe("formato", () => {
  it("formatea relojes y duraciones", () => {
    expect(formatClock(3 * 3600)).toBe("3:00:00");
    expect(formatClock(2 * 3600 + 15 * 60 + 7)).toBe("2:15:07");
    expect(formatDuration(2 * 3600 + 15 * 60)).toBe("2h 15m");
    expect(formatDuration(3 * 3600)).toBe("3h");
    expect(formatDuration(45 * 60)).toBe("45m");
    expect(formatDuration(42)).toBe("42s");
    expect(formatDuration(0)).toBe("0m");
  });

  it("ticks de eje redondos y sin repetir", () => {
    expect(timeTicks(42)).toEqual([0, 60]);
    expect(timeTicks(5 * 3600 + 600)).toEqual([0, 7200, 14400, 21600]);
    const t = timeTicks(50 * 60);
    expect(new Set(t).size).toBe(t.length);
  });
});
