import type { Plan } from "./types";

/**
 * Definición central de planes. Hoy ningún plan tiene límites: StudyFlow es
 * 100% usable gratis. La estructura queda lista para monetizar:
 *  - `profiles.plan` solo lo cambia el backend (columna no editable por el usuario).
 *  - La tabla `subscriptions` la escribe un webhook (Stripe, Mercado Pago…)
 *    con la service role, y un trigger sincroniza `profiles.plan`.
 *  - Los límites de base de datos viven en la tabla `plans` (null = ilimitado).
 * Para agregar un límite: definirlo acá (UI) y en `plans` (base de datos).
 */
export interface PlanDefinition {
  id: Plan;
  name: string;
  description: string;
  limits: {
    /** Secciones activas (no archivadas). */
    maxSections: number;
    maxHabits: number;
  };
  features: {
    dataExport: boolean;
    advancedStats: boolean;
    customAccent: boolean;
  };
}

const UNLIMITED = Number.POSITIVE_INFINITY;

export const PLANS: Record<Plan, PlanDefinition> = {
  free: {
    id: "free",
    name: "Gratis",
    description: "Todo lo necesario para construir disciplina todos los días.",
    limits: { maxSections: UNLIMITED, maxHabits: UNLIMITED },
    features: { dataExport: true, advancedStats: true, customAccent: true },
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Para quienes usan StudyFlow como su sistema principal.",
    limits: { maxSections: UNLIMITED, maxHabits: UNLIMITED },
    features: { dataExport: true, advancedStats: true, customAccent: true },
  },
  premium: {
    id: "premium",
    name: "Premium",
    description: "Todas las funciones, presentes y futuras.",
    limits: { maxSections: UNLIMITED, maxHabits: UNLIMITED },
    features: { dataExport: true, advancedStats: true, customAccent: true },
  },
};

export function getPlan(plan: Plan | null | undefined): PlanDefinition {
  return PLANS[plan ?? "free"] ?? PLANS.free;
}

export function isPlan(value: unknown): value is Plan {
  return value === "free" || value === "pro" || value === "premium";
}

export function canCreateSection(plan: Plan, activeSections: number) {
  return activeSections < getPlan(plan).limits.maxSections;
}

export function canCreateHabit(plan: Plan, activeHabits: number) {
  return activeHabits < getPlan(plan).limits.maxHabits;
}
