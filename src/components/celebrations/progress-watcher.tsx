"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  useAchievements,
  useDailyTotals,
  useSectionMap,
  useToday,
  useUnlockAchievements,
} from "@/hooks/use-data";
import { type GoalStatus, useGoalStatuses, useHabitStatuses, useProgression, useStreaks } from "@/hooks/use-metrics";
import { PERIOD_NOUN, goalSummary } from "@/lib/domain/goals";
import { formatTarget } from "@/lib/domain/metrics";
import { ACHIEVEMENTS, levelTitle } from "@/lib/domain/progression";
import { bestDayBefore } from "@/lib/domain/records";
import { formatDuration } from "@/lib/format";
import { useCelebrations } from "./celebration-provider";

const goalKey = (s: GoalStatus) => `${s.goal.sectionId ?? "global"}|${s.goal.period}|${s.goal.metric}|${s.range.from}|${s.goal.target}`;

function readNumber(key: string) {
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}

function writeNumber(key: string, value: number) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* sin almacenamiento */
  }
}

/**
 * Observa el progreso y celebra solo las transiciones que ocurren mientras la
 * app está abierta (al recargar no se repiten celebraciones). También guarda
 * los logros que se desbloquean.
 */
export function ProgressWatcher() {
  const { user } = useAuth();
  const { celebrate } = useCelebrations();
  const today = useToday();
  const sectionMap = useSectionMap();

  // --- Objetivos cumplidos -------------------------------------------------
  const { statuses, isLoading: goalsLoading } = useGoalStatuses();
  const goalsSignature = statuses.map((s) => `${goalKey(s)}:${s.progress.completed ? 1 : 0}`).join(",");
  const prevGoals = useRef<Map<string, boolean> | null>(null);
  useEffect(() => {
    if (goalsLoading) return;
    const current = new Map(statuses.map((s) => [goalKey(s), s.progress.completed]));
    const prev = prevGoals.current;
    prevGoals.current = current;
    if (!prev) return;
    for (const s of statuses) {
      if (prev.get(goalKey(s)) !== false || !s.progress.completed) continue;
      const section = s.goal.sectionId ? sectionMap.get(s.goal.sectionId) : null;
      const label = { daily: "diario", weekly: "semanal", monthly: "mensual" }[s.goal.period];
      if (section) {
        celebrate({ tone: "minor", title: `${section.name}: objetivo ${label} cumplido`, description: goalSummary(s.goal) });
      } else {
        // El de tiempo diario es "el" objetivo diario; los demás se nombran por su meta.
        const isMainDaily = s.goal.period === "daily" && s.goal.metric === "time";
        celebrate({
          tone: "major",
          title: isMainDaily ? "🎉 Objetivo diario cumplido" : `🎉 Objetivo ${label} cumplido: ${formatTarget(s.goal.metric, s.goal.target)}`,
          description: `Llegaste a ${formatTarget(s.goal.metric, s.goal.target)} ${PERIOD_NOUN[s.goal.period]}. ¡Seguí así!`,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalsSignature, goalsLoading]);

  // --- Logros: se guardan al cumplirse ----------------------------------------
  const { progression } = useProgression();
  const stored = useAchievements();
  const unlock = useUnlockAchievements();
  const inflight = useRef(new Set<string>());
  const newlyEarned = progression?.newlyEarned.join(",") ?? "";
  useEffect(() => {
    if (!progression || !stored.data) return;
    const codes = progression.newlyEarned.filter((c) => !inflight.current.has(c));
    if (!codes.length) return;
    for (const c of codes) inflight.current.add(c);
    const backfill = stored.data.length === 0 && codes.length > 2;
    unlock.mutate(codes, {
      onSuccess: (added) => {
        if (!added.length) return;
        if (backfill || added.length > 2) {
          celebrate({
            tone: "minor",
            title: `Desbloqueaste ${added.length} logros`,
            description: backfill ? "Por todo lo que ya venías haciendo. Miralos en Logros." : "Miralos en Logros.",
          });
          return;
        }
        for (const a of added) {
          const def = ACHIEVEMENTS.find((d) => d.code === a.code);
          if (def) celebrate({ tone: "major", title: `Logro desbloqueado: ${def.title}`, description: def.xp ? `${def.description} +${def.xp} XP` : def.description });
        }
      },
      onSettled: () => {
        for (const c of codes) inflight.current.delete(c);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newlyEarned, stored.data]);

  // --- Subida de nivel (se recuerda el último nivel visto) ---------------------
  const level = progression?.level.level;
  const settled = progression ? progression.newlyEarned.length === 0 : false;
  useEffect(() => {
    if (!user || level === undefined || !settled) return;
    const key = `studyflow:last-level:${user.id}`;
    const last = readNumber(key);
    if (last !== null && level > last) {
      celebrate({ tone: "major", title: `Subiste al nivel ${level}`, description: `${levelTitle(level)}. La constancia rinde.` });
    }
    if (last === null || level !== last) writeNumber(key, level);
  }, [level, settled, user, celebrate]);

  // --- Récords: mejor día y mejor racha ------------------------------------
  const totals = useDailyTotals();
  const streaks = useStreaks();
  const previousBestDay = totals.data ? bestDayBefore(totals.data, today) : 0;
  const todaySeconds = streaks.byDate.get(today) ?? 0;
  const prevToday = useRef<{ day: string; seconds: number } | null>(null);
  useEffect(() => {
    if (!totals.data) return;
    const prev = prevToday.current;
    prevToday.current = { day: today, seconds: todaySeconds };
    if (!prev || prev.day !== today) return;
    if (previousBestDay >= 30 * 60 && prev.seconds <= previousBestDay && todaySeconds > previousBestDay) {
      celebrate({ tone: "minor", title: "Nuevo récord: tu mejor día", description: `${formatDuration(todaySeconds)} registrados hoy.` });
    }
  }, [todaySeconds, today, previousBestDay, totals.data, celebrate]);

  const { current: streakCurrent, best: streakBest, isLoading: streaksLoading } = streaks;
  const prevStreak = useRef<{ current: number; best: number } | null>(null);
  useEffect(() => {
    if (streaksLoading) return;
    const prev = prevStreak.current;
    prevStreak.current = { current: streakCurrent, best: streakBest };
    if (prev && prev.best >= 3 && streakCurrent > prev.best) {
      celebrate({ tone: "major", title: `Nueva mejor racha: ${streakCurrent} días`, description: "Superaste tu récord de constancia." });
    }
  }, [streakCurrent, streakBest, streaksLoading, celebrate]);

  // --- Todos los hábitos del día ------------------------------------------
  const habits = useHabitStatuses();
  const allDone = habits.due.length > 0 && habits.doneToday === habits.due.length;
  const prevHabits = useRef<{ day: string; allDone: boolean } | null>(null);
  useEffect(() => {
    if (habits.isLoading) return;
    const prev = prevHabits.current;
    prevHabits.current = { day: today, allDone };
    if (prev && prev.day === today && !prev.allDone && allDone) {
      celebrate({ tone: "minor", title: "Hábitos del día completos", description: `${habits.due.length} de ${habits.due.length}. Bien hecho.` });
    }
  }, [allDone, today, habits.isLoading, habits.due.length, celebrate]);

  return null;
}
