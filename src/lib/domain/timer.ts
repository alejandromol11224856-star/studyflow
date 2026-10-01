import { dateKeyInTimeZone } from "../dates";
import type { ActiveTimer } from "../types";

/** Segundos transcurridos del temporizador (incluye el segmento en curso). */
export function timerElapsedSeconds(timer: ActiveTimer | null | undefined, now: number = Date.now()) {
  if (!timer) return 0;
  const running = timer.segmentStartedAt ? Math.max(0, (now - Date.parse(timer.segmentStartedAt)) / 1000) : 0;
  return Math.floor(timer.accumulatedSeconds + running);
}

export function isTimerRunning(timer: ActiveTimer | null | undefined) {
  return Boolean(timer?.segmentStartedAt);
}

export function startTimer(input: { sectionId: string | null; title: string }, now = new Date()): ActiveTimer {
  const iso = now.toISOString();
  return {
    sectionId: input.sectionId,
    title: input.title,
    startedAt: iso,
    segmentStartedAt: iso,
    accumulatedSeconds: 0,
    updatedAt: iso,
  };
}

export function pauseTimer(timer: ActiveTimer, now = new Date()): ActiveTimer {
  if (!timer.segmentStartedAt) return timer;
  return {
    ...timer,
    accumulatedSeconds: timerElapsedSeconds(timer, now.getTime()),
    segmentStartedAt: null,
    updatedAt: now.toISOString(),
  };
}

export function resumeTimer(timer: ActiveTimer, now = new Date()): ActiveTimer {
  if (timer.segmentStartedAt) return timer;
  const iso = now.toISOString();
  return { ...timer, segmentStartedAt: iso, updatedAt: iso };
}

/** Día al que se imputa el tiempo del temporizador (el día en que empezó). */
export function timerDateKey(timer: ActiveTimer, timeZone?: string) {
  return dateKeyInTimeZone(new Date(timer.startedAt), timeZone);
}
