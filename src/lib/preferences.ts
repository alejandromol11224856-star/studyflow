import { z } from "zod";

/**
 * Preferencias del usuario (se guardan en profiles.preferences y se
 * sincronizan entre dispositivos). El parseo es tolerante: cualquier valor
 * inválido o desconocido vuelve al valor por defecto en vez de romper la app.
 */

// ---------------------------------------------------------------------------
// Widgets del dashboard
// ---------------------------------------------------------------------------
export type WidgetSpan = "full" | "half" | "third";

export interface WidgetDefinition {
  id: string;
  title: string;
  description: string;
  span: WidgetSpan;
  defaultVisible: boolean;
}

/**
 * El resumen de "Hoy" (saludo, racha, objetivo y botón Comenzar) siempre va
 * arriba; estos widgets van debajo. Por defecto solo lo del día: las
 * estadísticas se suman desde "Personalizar" o se ven en Progreso.
 */
export const WIDGETS = [
  { id: "today", title: "Objetivos y hábitos", description: "Lo que te toca hoy, para marcar en un toque", span: "full", defaultVisible: true },
  { id: "activities-today", title: "Actividades de hoy", description: "Lo que ya registraste hoy", span: "half", defaultVisible: true },
  { id: "sections", title: "Tus áreas", description: "Empezá una sesión en un toque", span: "half", defaultVisible: true },
  { id: "achievements", title: "Próximos logros", description: "Lo que estás por desbloquear", span: "half", defaultVisible: false },
  { id: "daily-goal", title: "Cuenta regresiva", description: "Tiempo que falta para tu objetivo diario", span: "half", defaultVisible: false },
  { id: "timer", title: "Temporizador", description: "Medí tu tiempo en vivo", span: "half", defaultVisible: false },
  { id: "streak", title: "Racha", description: "Racha actual, mejor racha y últimos días", span: "third", defaultVisible: false },
  { id: "level", title: "Nivel y XP", description: "Tu nivel y lo que falta para el próximo", span: "third", defaultVisible: false },
  { id: "total-time", title: "Tiempo total", description: "Horas acumuladas y actividades", span: "third", defaultVisible: false },
  { id: "recent", title: "Actividades recientes", description: "Tus últimas actividades y el reparto de hoy", span: "half", defaultVisible: false },
  { id: "weekly", title: "Progreso semanal", description: "Tiempo por día de esta semana", span: "half", defaultVisible: false },
  { id: "habits", title: "Semana de hábitos", description: "Tu semana de hábitos de un vistazo", span: "half", defaultVisible: false },
  { id: "calendar", title: "Calendario", description: "Mapa de calor del mes", span: "half", defaultVisible: false },
  { id: "goals", title: "Objetivos de la semana y el mes", description: "Progreso semanal y mensual", span: "half", defaultVisible: false },
  { id: "stats", title: "Estadísticas", description: "Distribución del tiempo del mes", span: "half", defaultVisible: false },
] as const satisfies readonly WidgetDefinition[];

export type WidgetId = (typeof WIDGETS)[number]["id"];
export interface WidgetPreference {
  id: WidgetId;
  visible: boolean;
}

const WIDGET_IDS = WIDGETS.map((w) => w.id) as WidgetId[];

export function widgetDefinition(id: WidgetId): WidgetDefinition {
  return WIDGETS.find((w) => w.id === id)!;
}

export function defaultWidgets(): WidgetPreference[] {
  return WIDGETS.map((w) => ({ id: w.id, visible: w.defaultVisible }));
}

/** Respeta el orden guardado, descarta ids desconocidos y agrega los nuevos al final. */
export function normalizeWidgets(raw: unknown): WidgetPreference[] {
  const result: WidgetPreference[] = [];
  const seen = new Set<string>();
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const { id, visible } = item as { id?: unknown; visible?: unknown };
      if (typeof id !== "string" || seen.has(id) || !WIDGET_IDS.includes(id as WidgetId)) continue;
      seen.add(id);
      result.push({ id: id as WidgetId, visible: visible !== false });
    }
  }
  for (const w of WIDGETS) if (!seen.has(w.id)) result.push({ id: w.id, visible: w.defaultVisible });
  return result;
}

// ---------------------------------------------------------------------------
// Color de acento (paleta validada: contraste AA en claro y oscuro)
// ---------------------------------------------------------------------------
export const ACCENTS = [
  { id: "violet", label: "Violeta", swatch: "#5b4ef5" },
  { id: "blue", label: "Azul", swatch: "#2563eb" },
  { id: "teal", label: "Turquesa", swatch: "#0f766e" },
  { id: "green", label: "Verde", swatch: "#15803d" },
  { id: "orange", label: "Naranja", swatch: "#c2410c" },
  { id: "rose", label: "Rosa", swatch: "#e11d48" },
  { id: "graphite", label: "Grafito", swatch: "#3f3f46" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];
export const DEFAULT_ACCENT: AccentId = "violet";
export const ACCENT_STORAGE_KEY = "studyflow:accent";

export function isAccentId(value: unknown): value is AccentId {
  return typeof value === "string" && ACCENTS.some((a) => a.id === value);
}

// ---------------------------------------------------------------------------
// Preferencias completas
// ---------------------------------------------------------------------------
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const remindersSchema = z.object({
  enabled: z.boolean().catch(true),
  /** Recordatorio del objetivo diario si todavía no se cumplió. */
  dailyGoalTime: z.string().regex(HHMM).nullable().catch(null),
});

const onboardingSchema = z.object({
  completedAt: z.string().nullable().catch(null),
  skippedAt: z.string().nullable().catch(null),
  intents: z.array(z.string().max(40)).max(12).catch([]),
  /** Tutorial interactivo: terminado o descartado ("Ahora no" / "Saltar"). */
  tourCompletedAt: z.string().nullable().catch(null),
  tourDismissedAt: z.string().nullable().catch(null),
});

export interface Preferences {
  accent: AccentId;
  widgets: WidgetPreference[];
  reminders: z.infer<typeof remindersSchema>;
  /** full = confeti en los momentos importantes · subtle = solo avisos. */
  celebrations: "full" | "subtle";
  onboarding: z.infer<typeof onboardingSchema>;
}

export const DEFAULT_PREFERENCES: Preferences = {
  accent: DEFAULT_ACCENT,
  widgets: defaultWidgets(),
  reminders: { enabled: true, dailyGoalTime: null },
  celebrations: "full",
  onboarding: { completedAt: null, skippedAt: null, intents: [], tourCompletedAt: null, tourDismissedAt: null },
};

export function parsePreferences(raw: unknown): Preferences {
  const obj = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const reminders = remindersSchema.safeParse(obj.reminders ?? {});
  const onboarding = onboardingSchema.safeParse(obj.onboarding ?? {});
  return {
    accent: isAccentId(obj.accent) ? obj.accent : DEFAULT_ACCENT,
    widgets: normalizeWidgets(obj.widgets),
    reminders: reminders.success ? reminders.data : DEFAULT_PREFERENCES.reminders,
    celebrations: obj.celebrations === "subtle" ? "subtle" : "full",
    onboarding: onboarding.success ? onboarding.data : DEFAULT_PREFERENCES.onboarding,
  };
}

/** Mezcla un cambio parcial sobre las preferencias actuales. */
export function mergePreferences(current: Preferences, patch: PreferencesPatch): Preferences {
  return parsePreferences({
    ...current,
    ...patch,
    reminders: { ...current.reminders, ...patch.reminders },
    onboarding: { ...current.onboarding, ...patch.onboarding },
  });
}

export type PreferencesPatch = Partial<Omit<Preferences, "reminders" | "onboarding">> & {
  reminders?: Partial<Preferences["reminders"]>;
  onboarding?: Partial<Preferences["onboarding"]>;
};
