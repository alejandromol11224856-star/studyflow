import { type DateKey, type DateRange, type WeekStart, addDaysKey, dateFromKey, eachDayKeys, weekRange } from "../dates";
import type { Habit, HabitCheck } from "../types";

export const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const WEEKDAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"];

export function weekday(date: DateKey) {
  return dateFromKey(date).getDay();
}

/** Checks agrupados por hábito. */
export function checksByHabit(checks: HabitCheck[]) {
  const map = new Map<string, Set<DateKey>>();
  for (const c of checks) {
    let set = map.get(c.habitId);
    if (!set) {
      set = new Set();
      map.set(c.habitId, set);
    }
    set.add(c.date);
  }
  return map;
}

export function isHabitVisible(habit: Habit) {
  return habit.isActive && !habit.archivedAt;
}

/** ¿El hábito "corresponde" ese día? (los semanales pueden hacerse cualquier día). */
export function isHabitDue(habit: Habit, date: DateKey) {
  if (date < habit.startDate) return false;
  return habit.frequency === "weekly" || habit.daysOfWeek.includes(weekday(date));
}

export function frequencyLabel(habit: Pick<Habit, "frequency" | "daysOfWeek" | "weeklyTarget">) {
  if (habit.frequency === "weekly") {
    const n = habit.weeklyTarget ?? 1;
    return `${n} ${n === 1 ? "vez" : "veces"} por semana`;
  }
  const days = [...habit.daysOfWeek].sort();
  if (days.length === 7) return "Todos los días";
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return "Lunes a viernes";
  if (days.length === 2 && days.includes(0) && days.includes(6)) return "Fines de semana";
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.filter((d) => days.includes(d)).map((d) => WEEKDAY_LABELS[d]).join(", ");
}

function checksInRange(done: Set<DateKey>, from: DateKey, to: DateKey) {
  let n = 0;
  for (const d of done) if (d >= from && d <= to) n++;
  return n;
}

/** "1 día", "3 días", "1 semana"… */
export function streakLabel(n: number, unit: "días" | "semanas") {
  if (n === 1) return `1 ${unit === "días" ? "día" : "semana"}`;
  return `${n} ${unit}`;
}

export interface HabitStreak {
  current: number;
  best: number;
  /** "días" para hábitos diarios, "semanas" para semanales. */
  unit: "días" | "semanas";
}

/**
 * Racha de un hábito. Diario: días programados consecutivos cumplidos (los
 * días no programados no cortan). Semanal: semanas consecutivas que alcanzaron
 * la meta. El período en curso no corta la racha si todavía no se cumplió.
 */
export function habitStreak(habit: Habit, done: Set<DateKey>, today: DateKey, weekStartsOn: WeekStart): HabitStreak {
  if (habit.frequency === "weekly") {
    const target = habit.weeklyTarget ?? 1;
    const firstWeek = weekRange(habit.startDate, weekStartsOn).from;
    const thisWeek = weekRange(today, weekStartsOn).from;
    const met = (start: DateKey) => checksInRange(done, start, addDaysKey(start, 6)) >= target;
    let best = 0;
    let run = 0;
    for (let w = firstWeek; w <= thisWeek; w = addDaysKey(w, 7)) {
      if (met(w)) {
        run += 1;
        best = Math.max(best, run);
      } else if (w !== thisWeek) {
        run = 0;
      }
    }
    let current = 0;
    let cursor = met(thisWeek) ? thisWeek : addDaysKey(thisWeek, -7);
    while (cursor >= firstWeek && met(cursor)) {
      current += 1;
      cursor = addDaysKey(cursor, -7);
    }
    return { current, best: Math.max(best, current), unit: "semanas" };
  }

  let best = 0;
  let run = 0;
  if (habit.startDate <= today) {
    for (const day of eachDayKeys(habit.startDate, today)) {
      if (!isHabitDue(habit, day)) continue;
      if (done.has(day)) {
        run += 1;
        best = Math.max(best, run);
      } else if (day !== today) {
        run = 0;
      }
    }
  }
  let current = 0;
  let cursor = isHabitDue(habit, today) && !done.has(today) ? addDaysKey(today, -1) : today;
  while (cursor >= habit.startDate) {
    if (isHabitDue(habit, cursor)) {
      if (!done.has(cursor)) break;
      current += 1;
    }
    cursor = addDaysKey(cursor, -1);
  }
  return { current, best: Math.max(best, current), unit: "días" };
}

export interface HabitCompletion {
  done: number;
  expected: number;
  ratio: number;
}

/**
 * Cumplimiento en un rango. El día (o la semana) en curso solo cuenta si ya
 * se cumplió, para no penalizar lo que todavía está a tiempo.
 */
export function habitCompletion(
  habit: Habit,
  done: Set<DateKey>,
  range: DateRange,
  today: DateKey,
  weekStartsOn: WeekStart,
): HabitCompletion {
  const from = range.from > habit.startDate ? range.from : habit.startDate;
  const to = range.to < today ? range.to : today;
  if (from > to) return { done: 0, expected: 0, ratio: 0 };

  let doneCount = 0;
  let expected = 0;
  if (habit.frequency === "weekly") {
    const target = habit.weeklyTarget ?? 1;
    const thisWeek = weekRange(today, weekStartsOn).from;
    for (let w = weekRange(from, weekStartsOn).from; w <= to; w = addDaysKey(w, 7)) {
      const n = Math.min(target, checksInRange(done, w, addDaysKey(w, 6)));
      if (w === thisWeek && n < target) continue;
      expected += target;
      doneCount += n;
    }
  } else {
    for (const day of eachDayKeys(from, to)) {
      if (!isHabitDue(habit, day)) continue;
      const checked = done.has(day);
      if (day === today && !checked) continue;
      expected += 1;
      if (checked) doneCount += 1;
    }
  }
  return { done: doneCount, expected, ratio: expected ? doneCount / expected : 0 };
}

/** Progreso de la semana para hábitos semanales. */
export function weeklyHabitProgress(habit: Habit, done: Set<DateKey>, today: DateKey, weekStartsOn: WeekStart) {
  const { from, to } = weekRange(today, weekStartsOn);
  return { done: checksInRange(done, from, to), target: habit.weeklyTarget ?? 1 };
}

/**
 * Hábitos para mostrar hoy: los diarios programados para hoy y los semanales
 * que todavía no alcanzaron la meta de la semana (o que se marcaron hoy).
 */
export function habitsForToday(habits: Habit[], byHabit: Map<string, Set<DateKey>>, today: DateKey, weekStartsOn: WeekStart) {
  return habits.filter((h) => {
    if (!isHabitVisible(h) || !isHabitDue(h, today)) return false;
    if (h.frequency === "daily") return true;
    const done = byHabit.get(h.id) ?? new Set<DateKey>();
    const p = weeklyHabitProgress(h, done, today, weekStartsOn);
    return p.done < p.target || done.has(today);
  });
}
