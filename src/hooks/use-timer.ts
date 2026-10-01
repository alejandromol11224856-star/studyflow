"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  isTimerRunning,
  pauseTimer,
  resumeTimer,
  startTimer,
  timerDateKey,
  timerElapsedSeconds,
} from "@/lib/domain/timer";
import { getErrorMessage } from "@/lib/errors";
import type { ActiveTimer, ActivityMeasures } from "@/lib/types";
import { useClock } from "./use-clock";
import { activityChange, patchDailyTotals, queryKeys, requireRepo, useScope, useTimeZone } from "./use-data";

/** Estado del temporizador con el tiempo transcurrido actualizado cada segundo. */
export function useTimerState() {
  const { uid, repo } = useScope();
  const query = useQuery({
    queryKey: queryKeys.timer(uid),
    queryFn: () => requireRepo(repo).getTimer(),
    enabled: !!repo,
    // Mantiene sincronizado el temporizador iniciado en otro dispositivo.
    refetchInterval: 60_000,
  });
  const timer = query.data ?? null;
  const running = isTimerRunning(timer);
  const now = useClock(1000, running);
  return {
    timer,
    running,
    paused: Boolean(timer && !running),
    elapsed: timerElapsedSeconds(timer, now),
    isLoading: query.isLoading,
  };
}

export interface FinishTimerInput extends Partial<ActivityMeasures> {
  timer: ActiveTimer;
  title: string;
  notes?: string | null;
  sectionId: string | null;
  durationSeconds: number;
}

/** Acciones del temporizador con actualizaciones optimistas. */
export function useTimerActions() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  const timeZone = useTimeZone();
  const key = queryKeys.timer(uid);

  const current = () => qc.getQueryData<ActiveTimer | null>(key) ?? null;

  const save = useMutation({
    meta: { silent: true },
    mutationFn: (next: ActiveTimer) => requireRepo(repo).saveTimer(next),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = current();
      qc.setQueryData(key, next);
      return { previous };
    },
    onError: (error, _next, ctx) => {
      qc.setQueryData(key, ctx?.previous ?? null);
      toast.error(getErrorMessage(error));
    },
  });

  const discard = useMutation({
    meta: { silent: true },
    mutationFn: () => requireRepo(repo).clearTimer(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const previous = current();
      qc.setQueryData(key, null);
      return { previous };
    },
    onError: (error, _v, ctx) => {
      qc.setQueryData(key, ctx?.previous ?? null);
      toast.error(getErrorMessage(error));
    },
  });

  const finish = useMutation({
    mutationFn: ({ timer, title, notes, sectionId, durationSeconds, pages, distanceKm, reps }: FinishTimerInput) =>
      requireRepo(repo).finishTimer({
        sectionId,
        title,
        notes,
        date: timerDateKey(timer, timeZone),
        startedAt: timer.startedAt,
        durationSeconds,
        pages,
        distanceKm,
        reps,
        source: "timer",
      }),
    onSuccess: (activity) => {
      // Mover el tiempo del temporizador a los totales en el mismo render evita
      // que el progreso "salte" mientras se refrescan los datos.
      patchDailyTotals(qc, uid, [activityChange(activity, 1)]);
      qc.setQueryData(key, null);
      void qc.invalidateQueries({ queryKey: queryKeys.activitiesRoot(uid) });
      void qc.invalidateQueries({ queryKey: queryKeys.totals(uid) });
    },
  });

  return {
    start(input: { sectionId: string | null; title: string }) {
      save.mutate(startTimer(input));
    },
    pause() {
      const t = current();
      if (t) save.mutate(pauseTimer(t));
    },
    resume() {
      const t = current();
      if (t) save.mutate(resumeTimer(t));
    },
    update(patch: Partial<Pick<ActiveTimer, "sectionId" | "title">>) {
      const t = current();
      if (t) save.mutate({ ...t, ...patch, updatedAt: new Date().toISOString() });
    },
    discard: () => discard.mutateAsync(),
    finish: finish.mutateAsync,
    finishing: finish.isPending,
    saving: save.isPending,
  };
}
