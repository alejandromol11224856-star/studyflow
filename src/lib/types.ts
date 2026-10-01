import type { DateKey, WeekStart } from "./dates";
import type { Preferences } from "./preferences";
import type { SectionColor, SectionIcon } from "./sections";

export type Plan = "free" | "pro" | "premium";
export type GoalPeriod = "daily" | "weekly" | "monthly";
/** time = minutos · count = veces (actividades) · pages · distance = km · reps */
export type GoalMetric = "time" | "count" | "pages" | "distance" | "reps";
export type ActivitySource = "manual" | "timer";

export interface AuthUser {
  id: string;
  email: string;
}

export interface Profile {
  id: string;
  displayName: string;
  timezone: string;
  weekStartsOn: WeekStart;
  plan: Plan;
  /** Objetivo principal en palabras del usuario ("Recibirme este año"). */
  mainGoal: string | null;
  preferences: Preferences;
  createdAt: string;
}

export type ProfileUpdate = Partial<Pick<Profile, "displayName" | "timezone" | "weekStartsOn" | "mainGoal" | "preferences">>;

/** Área de la vida que el usuario quiere medir. Totalmente definida por él. */
export interface Section {
  id: string;
  name: string;
  color: SectionColor;
  icon: SectionIcon;
  description: string | null;
  sortOrder: number;
  /** false = pausada: no aparece en Hoy, temporizador ni registro rápido. */
  isActive: boolean;
  archivedAt: string | null;
  createdAt: string;
}

export interface SectionInput {
  name: string;
  color: SectionColor;
  icon: SectionIcon;
  description?: string | null;
}

export type SectionUpdate = Partial<SectionInput> & { archivedAt?: string | null; sortOrder?: number; isActive?: boolean };

/** Medidas opcionales de una actividad además del tiempo. */
export interface ActivityMeasures {
  pages: number | null;
  distanceKm: number | null;
  reps: number | null;
}

export interface Activity extends ActivityMeasures {
  id: string;
  sectionId: string | null;
  title: string;
  notes: string | null;
  /** Día local del usuario en que se hizo la actividad. */
  date: DateKey;
  startedAt: string | null;
  /** 0 si la actividad no midió tiempo (solo páginas, km o repeticiones). */
  durationSeconds: number;
  source: ActivitySource;
  createdAt: string;
}

export interface ActivityInput extends Partial<ActivityMeasures> {
  sectionId: string | null;
  title: string;
  notes?: string | null;
  date: DateKey;
  startedAt?: string | null;
  durationSeconds: number;
  source?: ActivitySource;
}

export type ActivityUpdate = Partial<ActivityInput>;

export interface ActivityQuery {
  from?: DateKey;
  to?: DateKey;
  /** undefined = todas, null = sin sección */
  sectionId?: string | null;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityPage {
  items: Activity[];
  hasMore: boolean;
}

/**
 * Los objetivos se guardan versionados: cada cambio crea una versión con
 * `effectiveFrom`. Así el historial de días pasados se evalúa con el objetivo
 * que estaba vigente ese día.
 */
export interface Goal {
  id: string;
  /** null = objetivo global (todas las secciones) */
  sectionId: string | null;
  period: GoalPeriod;
  metric: GoalMetric;
  /** En la unidad de la métrica (tiempo: minutos). 0 = desactivado desde effectiveFrom. */
  target: number;
  effectiveFrom: DateKey;
  createdAt: string;
}

export interface GoalInput {
  sectionId: string | null;
  period: GoalPeriod;
  metric: GoalMetric;
  target: number;
  effectiveFrom: DateKey;
}

/**
 * Temporizador activo (uno por usuario). Se persiste en la base de datos para
 * que sobreviva a recargas y se pueda continuar desde otro dispositivo.
 * Tiempo transcurrido = accumulatedSeconds + (ahora - segmentStartedAt).
 */
export interface ActiveTimer {
  sectionId: string | null;
  title: string;
  startedAt: string;
  /** null cuando está en pausa */
  segmentStartedAt: string | null;
  accumulatedSeconds: number;
  updatedAt: string;
}

/** Agregado por día y sección (base de rachas, calendario, objetivos y estadísticas). */
export interface DailyTotal {
  date: DateKey;
  sectionId: string | null;
  seconds: number;
  count: number;
  pages: number;
  distance: number;
  reps: number;
}

export type HabitFrequency = "daily" | "weekly";

/** Algo que se marca como hecho (sin medir tiempo): meditar, leer, entrenar… */
export interface Habit {
  id: string;
  sectionId: string | null;
  name: string;
  icon: SectionIcon;
  color: SectionColor;
  /** daily: se espera los días de `daysOfWeek` (0 = domingo). weekly: `weeklyTarget` veces por semana. */
  frequency: HabitFrequency;
  daysOfWeek: number[];
  weeklyTarget: number | null;
  /** "HH:mm" en la zona horaria del usuario. */
  reminderTime: string | null;
  startDate: DateKey;
  isActive: boolean;
  archivedAt: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface HabitInput {
  name: string;
  icon: SectionIcon;
  color: SectionColor;
  sectionId: string | null;
  frequency: HabitFrequency;
  daysOfWeek: number[];
  weeklyTarget: number | null;
  reminderTime: string | null;
  startDate: DateKey;
}

export type HabitUpdate = Partial<HabitInput> & { isActive?: boolean; archivedAt?: string | null; sortOrder?: number };

export interface HabitCheck {
  habitId: string;
  date: DateKey;
}

export interface UnlockedAchievement {
  code: string;
  unlockedAt: string;
}
