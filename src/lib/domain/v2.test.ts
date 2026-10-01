import { describe, expect, it } from "vitest";
import { isReminderDue } from "../notifications";
import { DEFAULT_PREFERENCES, defaultWidgets, mergePreferences, normalizeWidgets, parsePreferences } from "../preferences";
import type { DailyTotal, Goal, Habit } from "../types";
import { activeGoalsFor, currentGoals, goalFor, goalMet, goalProgress } from "./goals";
import { frequencyLabel, habitCompletion, habitStreak, habitsForToday, isHabitDue } from "./habits";
import { EMPTY_MEASURES, formatMeasure, formatTarget } from "./metrics";
import { motivationalMessage } from "./motivation";
import { ACHIEVEMENTS, computeProgression, computeXp, goalCompletions, levelFromXp, xpToNext } from "./progression";
import { computeRecords } from "./records";
import { bucketFor, bucketedSeries, complianceByWeek } from "./stats";
import { isDayCompleted, measuresByDate, streakSeries } from "./streaks";

const goal = (p: Partial<Goal> & { effectiveFrom: string; target: number }): Goal => ({
  id: Math.random().toString(36),
  sectionId: null,
  period: "daily",
  metric: "time",
  createdAt: `${p.effectiveFrom}T00:00:00Z`,
  ...p,
});

const total = (date: string, p: Partial<DailyTotal> = {}): DailyTotal => ({
  date,
  sectionId: null,
  seconds: 0,
  count: 1,
  pages: 0,
  distance: 0,
  reps: 0,
  ...p,
});

const habit = (p: Partial<Habit> = {}): Habit => ({
  id: "h1",
  sectionId: null,
  name: "Meditar",
  icon: "flower",
  color: "violet",
  frequency: "daily",
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  weeklyTarget: null,
  reminderTime: null,
  startDate: "2026-09-01",
  isActive: true,
  archivedAt: null,
  sortOrder: 0,
  createdAt: "2026-09-01T00:00:00Z",
  ...p,
});

const TODAY = "2026-10-01"; // jueves

describe("objetivos por métrica", () => {
  const goals = [
    goal({ effectiveFrom: "2026-09-01", target: 180 }),
    goal({ effectiveFrom: "2026-09-01", metric: "pages", target: 30 }),
    goal({ effectiveFrom: "2026-09-01", metric: "count", period: "weekly", target: 4, sectionId: "gym" }),
  ];

  it("cada métrica es un objetivo independiente", () => {
    expect(goalFor(goals, "daily", null, TODAY, "time")?.target).toBe(180);
    expect(goalFor(goals, "daily", null, TODAY, "pages")?.target).toBe(30);
    expect(goalFor(goals, "daily", null, TODAY, "distance")).toBeNull();
    expect(activeGoalsFor(goals, "daily", null, TODAY)).toHaveLength(2);
  });

  it("evalúa el cumplimiento en la unidad de cada métrica", () => {
    const m = { ...EMPTY_MEASURES, seconds: 3 * 3600, pages: 12, count: 3, distance: 5.2 };
    expect(goalMet(goals[0], m)).toBe(true);
    expect(goalMet(goals[1], m)).toBe(false);
    expect(goalProgress(goals[1], m)).toMatchObject({ done: 12, target: 30, remaining: 18 });
    expect(goalMet(goal({ effectiveFrom: TODAY, metric: "distance", target: 5 }), m)).toBe(true);
  });

  it("lista las versiones vigentes ordenadas (diarios primero, generales antes que secciones)", () => {
    const list = currentGoals(goals, TODAY);
    expect(list.map((g) => `${g.period}:${g.metric}`)).toEqual(["daily:time", "daily:pages", "weekly:count"]);
  });

  it("formatea medidas y metas", () => {
    expect(formatTarget("count", 4)).toBe("4 veces");
    expect(formatTarget("count", 1)).toBe("1 vez");
    expect(formatTarget("pages", 30)).toBe("30 páginas");
    expect(formatTarget("time", 90)).toBe("1h 30m");
    expect(formatMeasure("distance", 5.25)).toBe("5,25 km");
    expect(formatMeasure("time", 5400)).toBe("1h 30m");
  });

  it("un día está cumplido solo si se alcanzan TODOS los objetivos diarios generales", () => {
    const m = { ...EMPTY_MEASURES, seconds: 4 * 3600, pages: 10, count: 2 };
    expect(isDayCompleted(TODAY, m, goals)).toBe(false);
    expect(isDayCompleted(TODAY, { ...m, pages: 30 }, goals)).toBe(true);
    expect(isDayCompleted(TODAY, EMPTY_MEASURES, [])).toBe(false);
    expect(isDayCompleted(TODAY, { ...EMPTY_MEASURES, count: 1 }, [])).toBe(true);
  });
});

describe("hábitos", () => {
  it("diario con días fijos: los días no programados no cortan la racha", () => {
    // Lunes a viernes. 1/10 es jueves.
    const h = habit({ daysOfWeek: [1, 2, 3, 4, 5], startDate: "2026-09-21" });
    const done = new Set(["2026-09-24", "2026-09-25", "2026-09-28", "2026-09-29", "2026-09-30"]);
    expect(isHabitDue(h, "2026-09-27")).toBe(false); // domingo
    const s = habitStreak(h, done, TODAY, 1);
    expect(s.current).toBe(5); // hoy pendiente: no corta
    expect(s.best).toBe(5);
    expect(habitStreak(h, new Set([...done, TODAY]), TODAY, 1).current).toBe(6);
  });

  it("un día programado sin hacer corta la racha", () => {
    const h = habit({ startDate: "2026-09-25" });
    const s = habitStreak(h, new Set(["2026-09-25", "2026-09-26", "2026-09-28", "2026-09-29", "2026-09-30"]), TODAY, 1);
    expect(s.current).toBe(3);
    expect(s.best).toBe(3);
  });

  it("semanal: cuenta semanas que alcanzaron la meta", () => {
    const h = habit({ frequency: "weekly", weeklyTarget: 2, startDate: "2026-09-14" });
    // Semanas (lunes): 14/9 ✓, 21/9 ✓, 28/9 en curso con 1.
    const done = new Set(["2026-09-15", "2026-09-17", "2026-09-22", "2026-09-26", "2026-09-29"]);
    const s = habitStreak(h, done, TODAY, 1);
    expect(s.unit).toBe("semanas");
    expect(s.current).toBe(2);
    expect(habitStreak(h, new Set([...done, TODAY]), TODAY, 1).current).toBe(3);
  });

  it("cumplimiento: hoy o la semana en curso solo cuentan si ya se cumplieron", () => {
    const h = habit({ startDate: "2026-09-28" });
    const c = habitCompletion(h, new Set(["2026-09-28", "2026-09-30"]), { from: "2026-09-28", to: "2026-10-04" }, TODAY, 1);
    expect(c).toMatchObject({ done: 2, expected: 3 }); // 28, 29, 30 (hoy pendiente no cuenta)
    const w = habit({ frequency: "weekly", weeklyTarget: 3, startDate: "2026-09-01" });
    expect(habitCompletion(w, new Set(["2026-09-29"]), { from: "2026-09-28", to: "2026-10-04" }, TODAY, 1).expected).toBe(0);
  });

  it("los semanales desaparecen de Hoy cuando ya se cumplió la meta (salvo si se marcaron hoy)", () => {
    const w = habit({ id: "w", frequency: "weekly", weeklyTarget: 1, startDate: "2026-09-01" });
    const met = new Map([["w", new Set(["2026-09-29"])]]);
    expect(habitsForToday([w], met, TODAY, 1)).toHaveLength(0);
    expect(habitsForToday([w], new Map([["w", new Set([TODAY])]]), TODAY, 1)).toHaveLength(1);
    expect(habitsForToday([habit({ isActive: false })], new Map(), TODAY, 1)).toHaveLength(0);
  });

  it("describe la frecuencia", () => {
    expect(frequencyLabel(habit())).toBe("Todos los días");
    expect(frequencyLabel(habit({ daysOfWeek: [1, 2, 3, 4, 5] }))).toBe("Lunes a viernes");
    expect(frequencyLabel(habit({ frequency: "weekly", weeklyTarget: 4 }))).toBe("4 veces por semana");
  });
});

describe("XP anti-abuso", () => {
  const base = { goals: [], habits: [], checks: [], achievements: [], today: TODAY, weekStartsOn: 1 as const };

  it("1 hora en 60 actividades de 1 minuto rinde lo mismo en tiempo que 1 actividad de 1 hora", () => {
    const one = computeXp({ ...base, totals: [total(TODAY, { seconds: 3600, count: 1 })] });
    const sixty = computeXp({ ...base, totals: [total(TODAY, { seconds: 3600, count: 60 })] });
    expect(one.time).toBe(10);
    expect(sixty.time).toBe(10);
    // El bonus por registrar tiene tope diario (5 actividades).
    expect(sixty.activities).toBe(15);
    expect(sixty.total - one.total).toBe(12);
  });

  it("muchas actividades sin tiempo real no dan bonus de registro", () => {
    const spam = computeXp({ ...base, totals: [total(TODAY, { seconds: 5 * 60, count: 50 })] });
    expect(spam.activities).toBe(0);
    expect(spam.time).toBe(0);
  });

  it("el tiempo tiene tope de 12 h por día", () => {
    expect(computeXp({ ...base, totals: [total(TODAY, { seconds: 20 * 3600 })] }).time).toBe(120);
  });

  it("hábitos: solo checks válidos y con tope diario", () => {
    const habits = Array.from({ length: 10 }, (_, i) => habit({ id: `h${i}`, startDate: "2026-09-30" }));
    const all = habits.map((h) => ({ habitId: h.id, date: TODAY }));
    const xp = computeXp({ ...base, totals: [], habits, checks: [...all, { habitId: "h0", date: "2026-09-01" }, { habitId: "h1", date: "2026-12-01" }] });
    expect(xp.habits).toBe(8 * 5);
  });

  it("objetivos cumplidos suman XP según el período", () => {
    const goals = [goal({ effectiveFrom: "2026-09-28", target: 60 }), goal({ effectiveFrom: "2026-09-28", period: "weekly", target: 180 })];
    const totals = [total("2026-09-28", { seconds: 3600 }), total("2026-09-29", { seconds: 3600 }), total("2026-09-30", { seconds: 1800 })];
    const completions = goalCompletions(totals, goals, TODAY, 1);
    expect(completions.filter((c) => c.period === "daily")).toHaveLength(2);
    expect(completions.filter((c) => c.period === "weekly")).toHaveLength(0); // 2,5 h de 3 h
    expect(computeXp({ ...base, goals, totals }, completions).goals).toBe(50);
  });

  it("niveles: XP creciente por nivel", () => {
    expect(xpToNext(1)).toBe(100);
    expect(levelFromXp(0)).toMatchObject({ level: 1, current: 0, needed: 100 });
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100)).toMatchObject({ level: 2, current: 0, needed: 140 });
    expect(levelFromXp(240).level).toBe(3);
  });
});

describe("logros", () => {
  const base = { goals: [], habits: [], checks: [], today: TODAY, weekStartsOn: 1 as const };

  it("se ganan por condición y los guardados quedan aunque cambien los datos", () => {
    const totals = [total(TODAY, { seconds: 2 * 3600 })];
    const p = computeProgression({ ...base, totals, achievements: [] });
    expect(p.newlyEarned).toContain("first-day");
    expect(p.newlyEarned).not.toContain("hours-10");
    const stored = computeProgression({ ...base, totals: [], achievements: [{ code: "hours-100", unlockedAt: "2026-09-01T00:00:00Z" }] });
    expect(stored.achievements.find((a) => a.definition.code === "hours-100")?.earned).toBe(true);
    expect(stored.newlyEarned).toEqual([]);
    expect(stored.xp.achievements).toBe(ACHIEVEMENTS.find((a) => a.code === "hours-100")!.xp);
  });

  it("detecta una semana completa", () => {
    const week = ["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27"];
    const p = computeProgression({ ...base, totals: week.map((d) => total(d, { seconds: 600 })), achievements: [] });
    expect(p.stats.perfectWeeks).toBe(1);
    expect(p.newlyEarned).toContain("perfect-week");
    expect(p.newlyEarned).toContain("streak-7");
  });

  it("los logros de nivel no dan XP (evita bucles)", () => {
    expect(ACHIEVEMENTS.filter((a) => a.category === "Nivel").every((a) => a.xp === 0)).toBe(true);
    expect(new Set(ACHIEVEMENTS.map((a) => a.code)).size).toBe(ACHIEVEMENTS.length);
  });
});

describe("récords", () => {
  it("guarda cuándo se consiguió cada uno", () => {
    const totals = [
      total("2026-09-01", { seconds: 2 * 3600, count: 2 }),
      total("2026-09-02", { seconds: 5 * 3600, count: 1 }),
      total("2026-09-03", { seconds: 3600, count: 4 }),
      total("2026-08-10", { seconds: 3600 }),
    ];
    const r = computeRecords({ totals, goals: [], habits: [], checks: [], today: TODAY, weekStartsOn: 1 });
    expect(r.bestDay).toEqual({ seconds: 5 * 3600, date: "2026-09-02" });
    expect(r.mostActivities).toEqual({ count: 4, date: "2026-09-03" });
    expect(r.bestMonth?.month).toBe("2026-09-01");
    expect(r.bestWeek?.from).toBe("2026-08-31");
    expect(r.longestStreak).toEqual({ days: 3, from: "2026-09-01", to: "2026-09-03" });
  });
});

describe("estadísticas v2", () => {
  it("agrupa rangos largos por semana o mes", () => {
    expect(bucketFor({ from: "2026-09-01", to: "2026-10-01" })).toBe("day");
    expect(bucketFor({ from: "2026-03-01", to: "2026-10-01" })).toBe("week");
    expect(bucketFor({ from: "2024-01-01", to: "2026-10-01" })).toBe("month");
    const rows = bucketedSeries([total("2026-09-29", { seconds: 60 }), total("2026-10-01", { seconds: 120 })], { from: "2026-09-28", to: "2026-10-04" }, "week", 1);
    expect(rows).toEqual([{ key: "2026-09-28", total: 180, none: 180 }]);
  });

  it("cumplimiento por semana y evolución de la racha", () => {
    const goals = [goal({ effectiveFrom: "2026-09-01", target: 60 })];
    const byDate = measuresByDate([total("2026-09-28", { seconds: 3600 }), total("2026-09-29", { seconds: 600 })]);
    const weeks = complianceByWeek(byDate, goals, { from: "2026-09-28", to: TODAY }, TODAY, 1);
    expect(weeks).toEqual([{ key: "2026-09-28", total: 33, met: 1, withGoal: 3 }]);
    expect(streakSeries(new Set(["2026-09-29", "2026-09-30"]), "2026-09-29", TODAY).map((r) => r.total)).toEqual([1, 2, 0]);
  });
});

describe("preferencias", () => {
  it("toleran datos inválidos o viejos", () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences({ accent: "neon", celebrations: 3, reminders: "x" })).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences({ accent: "teal" }).accent).toBe("teal");
  });

  it("respetan el orden guardado, ignoran desconocidos y agregan widgets nuevos", () => {
    const w = normalizeWidgets([{ id: "timer", visible: false }, { id: "ghost", visible: true }, { id: "today", visible: true }]);
    expect(w[0]).toEqual({ id: "timer", visible: false });
    expect(w[1].id).toBe("today");
    expect(w).toHaveLength(defaultWidgets().length);
  });

  it("se combinan parcialmente", () => {
    const next = mergePreferences(DEFAULT_PREFERENCES, { reminders: { dailyGoalTime: "20:00" } });
    expect(next.reminders).toEqual({ enabled: true, dailyGoalTime: "20:00" });
    expect(mergePreferences(next, { reminders: { dailyGoalTime: "25:00" } }).reminders.dailyGoalTime).toBeNull();
  });
});

describe("motivación y recordatorios", () => {
  const ctx = {
    dateKey: TODAY,
    hour: 10,
    hasGoal: true,
    ratio: 0,
    completed: false,
    remainingSeconds: 3 * 3600,
    hasActivityToday: false,
    streak: 0,
    todayCompleted: false,
    habitsDue: 0,
    habitsDone: 0,
  };

  it("el mensaje es estable durante el día y depende del contexto", () => {
    expect(motivationalMessage(ctx)).toBe(motivationalMessage(ctx));
    expect(motivationalMessage({ ...ctx, ratio: 0.8, remainingSeconds: 1800 })).toMatch(/30m|empujón/);
    expect(motivationalMessage({ ...ctx, completed: true, ratio: 1 })).toMatch(/cumplido|Hecho|extra/i);
    expect(motivationalMessage({ ...ctx, hour: 21, streak: 6, ratio: 0.3, remainingSeconds: 3600 })).toMatch(/6 días/);
  });

  it("los recordatorios se disparan desde la hora indicada y hasta 2 h después", () => {
    expect(isReminderDue("19:59", "20:00")).toBe(false);
    expect(isReminderDue("20:00", "20:00")).toBe(true);
    expect(isReminderDue("21:30", "20:00")).toBe(true);
    expect(isReminderDue("22:01", "20:00")).toBe(false);
  });
});
