"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { useClock } from "@/hooks/use-clock";
import { usePreferences, useTimeZone, useToday } from "@/hooks/use-data";
import { useGoalProgress, useHabitStatuses } from "@/hooks/use-metrics";
import { timeInTimeZone } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import { type NotificationPayload, browserChannel, isReminderDue } from "@/lib/notifications";

function alreadySent(key: string) {
  try {
    if (window.localStorage.getItem(key)) return true;
    window.localStorage.setItem(key, "1");
    return false;
  } catch {
    return false;
  }
}

async function deliver(payload: NotificationPayload) {
  // Con la app en segundo plano, notificación del sistema; si no, aviso en la app.
  if (document.visibilityState === "hidden" && browserChannel.isAvailable() && (await browserChannel.send(payload))) return;
  toast(payload.title, { description: payload.body, duration: 10_000 });
}

/**
 * Recordatorios de hábitos (a la hora configurada en cada uno) y del objetivo
 * diario (si todavía no se cumplió). Funcionan mientras StudyFlow está abierta
 * (pestaña o app instalada). Cada recordatorio se envía una vez por día.
 */
export function ReminderScheduler() {
  const { user } = useAuth();
  const { reminders } = usePreferences();
  const habits = useHabitStatuses();
  const daily = useGoalProgress("daily", null, "time");
  const timeZone = useTimeZone();
  const today = useToday();
  const now = useClock(30_000);

  useEffect(() => {
    if (!user || !reminders.enabled || habits.isLoading || daily.isLoading) return;
    const hhmm = timeInTimeZone(new Date(now).toISOString(), timeZone);
    const due: NotificationPayload[] = [];
    for (const h of habits.due) {
      if (h.habit.reminderTime && !h.doneToday && isReminderDue(hhmm, h.habit.reminderTime)) {
        due.push({ id: `habit:${h.habit.id}`, title: `Recordatorio: ${h.habit.name}`, body: "Todavía no lo marcaste hoy." });
      }
    }
    if (reminders.dailyGoalTime && daily.target > 0 && !daily.progress.completed && isReminderDue(hhmm, reminders.dailyGoalTime)) {
      due.push({
        id: "daily-goal",
        title: "Tu objetivo de hoy",
        body: `Te faltan ${formatDuration(daily.progress.remaining)} para cumplirlo.`,
      });
    }
    for (const payload of due) {
      if (!alreadySent(`studyflow:reminded:${user.id}:${today}:${payload.id}`)) void deliver(payload);
    }
  }, [now, user, reminders, habits, daily.isLoading, daily.target, daily.progress, timeZone, today]);

  return null;
}
