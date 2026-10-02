"use client";

import { useSyncExternalStore } from "react";
import { FREE_PLAN, type SessionPlan } from "@/lib/session-plans";
import type { ActiveTimer } from "@/lib/types";

const KEY = "studyflow:session-plan";
const EVENT = "studyflow:session-plan";

interface StoredPlan extends SessionPlan {
  /** El plan corresponde al temporizador que empezó después de este momento. */
  startedAfter: number;
}

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Guarda el plan elegido para el temporizador que se está por iniciar. */
export function saveSessionPlan(plan: SessionPlan) {
  try {
    if (plan.focusMinutes > 0) {
      window.localStorage.setItem(KEY, JSON.stringify({ ...plan, startedAfter: Date.now() - 3000 } satisfies StoredPlan));
    } else {
      window.localStorage.removeItem(KEY);
    }
  } catch {
    /* sin almacenamiento: la sesión queda libre */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Plan del temporizador actual (libre si no hay o si es de otra sesión). */
export function useSessionPlan(timer: ActiveTimer | null): SessionPlan {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  if (!timer || !raw) return FREE_PLAN;
  try {
    const stored = JSON.parse(raw) as StoredPlan;
    if (Date.parse(timer.startedAt) < stored.startedAfter || !stored.focusMinutes) return FREE_PLAN;
    return stored;
  } catch {
    return FREE_PLAN;
  }
}
