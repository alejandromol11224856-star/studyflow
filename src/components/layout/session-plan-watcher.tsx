"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSessionPlan } from "@/hooks/use-session-plan";
import { useTimerState } from "@/hooks/use-timer";
import { browserChannel } from "@/lib/notifications";
import { blockState } from "@/lib/session-plans";

/**
 * Avisa cuando termina un bloque de foco (Pomodoro, Deep Work…): toast en la
 * app y, si diste permiso y la app está en segundo plano, notificación.
 */
export function SessionPlanWatcher() {
  const { timer, elapsed, running } = useTimerState();
  const plan = useSessionPlan(timer);
  const completed = blockState(plan, elapsed)?.completedBlocks ?? null;
  const startedAt = timer?.startedAt ?? null;
  const prev = useRef<{ startedAt: string; completed: number } | null>(null);

  useEffect(() => {
    if (!startedAt || completed === null) {
      prev.current = null;
      return;
    }
    const before = prev.current;
    prev.current = { startedAt, completed };
    if (!before || before.startedAt !== startedAt || completed <= before.completed || !running) return;
    const body = `Tomate ${plan.breakMinutes} minutos: pausá la sesión y volvé cuando termine el descanso.`;
    toast.success(`Bloque ${completed} completo`, { description: body, duration: 10_000 });
    if (browserChannel.isAvailable() && document.visibilityState !== "visible") {
      void browserChannel.send({ id: `block-${startedAt}-${completed}`, title: `${plan.label}: bloque completo`, body });
    }
    // Solo cuando cambia la cantidad de bloques o la sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, startedAt]);

  return null;
}
