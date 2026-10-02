/**
 * Planes de sesión (Pomodoro, Deep Work, bloques): se apoyan en el
 * temporizador existente. El temporizador mide el tiempo trabajado; el plan
 * solo marca cuándo termina cada bloque de foco y sugiere el descanso.
 * Se guardan en este dispositivo (no cambian la base de datos).
 */
export interface SessionPlan {
  methodId: string;
  label: string;
  /** 0 = sesión libre (sin bloques). */
  focusMinutes: number;
  breakMinutes: number;
}

export const FREE_PLAN: SessionPlan = { methodId: "free", label: "Libre", focusMinutes: 0, breakMinutes: 0 };

export const SESSION_PRESETS: SessionPlan[] = [
  FREE_PLAN,
  { methodId: "pomodoro", label: "Pomodoro", focusMinutes: 25, breakMinutes: 5 },
  { methodId: "block-50", label: "Bloque 50/10", focusMinutes: 50, breakMinutes: 10 },
  { methodId: "deep-work", label: "Deep Work", focusMinutes: 90, breakMinutes: 15 },
];

export function presetFor(methodId: string | null | undefined): SessionPlan {
  return SESSION_PRESETS.find((p) => p.methodId === methodId) ?? FREE_PLAN;
}

export interface BlockState {
  /** Bloque actual (1, 2, 3…). */
  block: number;
  /** Segundos que faltan para terminar el bloque actual. */
  remaining: number;
  /** 0..1 dentro del bloque actual. */
  ratio: number;
  /** Bloques de foco ya completos. */
  completedBlocks: number;
}

/** Estado del bloque para un tiempo trabajado (segundos). null si el plan es libre. */
export function blockState(plan: SessionPlan, elapsedSeconds: number): BlockState | null {
  if (!plan.focusMinutes) return null;
  const focus = plan.focusMinutes * 60;
  const elapsed = Math.max(0, Math.floor(elapsedSeconds));
  const completedBlocks = Math.floor(elapsed / focus);
  const within = elapsed % focus;
  return { block: completedBlocks + 1, remaining: focus - within, ratio: within / focus, completedBlocks };
}
