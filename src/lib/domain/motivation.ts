import { formatDuration } from "../format";

/**
 * Mensajes motivacionales contextuales. Sobrios (nada de frases épicas) y
 * variados: se elige uno por día y contexto, así no se repite siempre el mismo
 * pero tampoco cambia a cada segundo.
 */
export interface MotivationContext {
  dateKey: string;
  hour: number;
  hasGoal: boolean;
  /** Progreso del objetivo diario principal (0..1). */
  ratio: number;
  completed: boolean;
  remainingSeconds: number;
  hasActivityToday: boolean;
  streak: number;
  todayCompleted: boolean;
  habitsDue: number;
  habitsDone: number;
}

const POOLS = {
  noGoal: [
    "Definí un objetivo para hoy: lo que se mide, mejora.",
    "Elegí una sola cosa importante para hoy y empezá por ahí.",
    "Un objetivo chico y claro le gana a uno grande y difuso.",
  ],
  morning: [
    "Un buen día empieza con un primer bloque. 25 minutos alcanzan para arrancar.",
    "Empezá por lo más difícil mientras tenés energía.",
    "Lo que hagas en la primera hora marca el resto del día.",
  ],
  notStarted: [
    "Todavía estás a tiempo: un bloque corto ya cuenta.",
    "No hace falta un día perfecto, solo empezar.",
    "Arrancá con 15 minutos. El impulso viene después.",
  ],
  started: [
    "Ya arrancaste: lo más difícil está hecho.",
    "Vas sumando. Un bloque más y se nota.",
    "Buen comienzo. Mantené el ritmo sin apurarte.",
  ],
  halfway: [
    "Pasaste la mitad. Seguí con el mismo ritmo.",
    "Más de la mitad hecha. Vas bien.",
  ],
  almost: [
    "Te faltan {remaining}. Ya casi.",
    "Último empujón: {remaining} y cerrás el día.",
  ],
  streakRisk: [
    "Tu racha de {streak} días sigue viva: te faltan {remaining}.",
    "Quedan unas horas para sostener tu racha de {streak} días.",
  ],
  completed: [
    "Objetivo cumplido. Lo que sumes ahora es extra.",
    "Día cumplido. Descansar también es parte del plan.",
    "Hecho. Mañana, lo mismo: la constancia hace el resto.",
  ],
  habitsPending: [
    "Te quedan {habits} hábitos para hoy.",
    "Los hábitos se construyen de a uno: te quedan {habits}.",
  ],
};

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function pick(pool: keyof typeof POOLS, dateKey: string, vars: Record<string, string | number>) {
  const options = POOLS[pool];
  const message = options[hash(`${dateKey}:${pool}`) % options.length];
  return message.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

export function motivationalMessage(ctx: MotivationContext): string {
  const vars = {
    remaining: formatDuration(ctx.remainingSeconds),
    streak: ctx.streak,
    habits: ctx.habitsDue - ctx.habitsDone,
  };
  if (ctx.completed) {
    return ctx.habitsDone < ctx.habitsDue ? pick("habitsPending", ctx.dateKey, vars) : pick("completed", ctx.dateKey, vars);
  }
  if (!ctx.hasGoal) {
    if (ctx.habitsDue > ctx.habitsDone && ctx.hasActivityToday) return pick("habitsPending", ctx.dateKey, vars);
    return ctx.hasActivityToday ? pick("started", ctx.dateKey, vars) : pick("noGoal", ctx.dateKey, vars);
  }
  if (ctx.hour >= 19 && ctx.streak > 1 && !ctx.todayCompleted) return pick("streakRisk", ctx.dateKey, vars);
  if (ctx.ratio >= 0.75) return pick("almost", ctx.dateKey, vars);
  if (ctx.ratio >= 0.5) return pick("halfway", ctx.dateKey, vars);
  if (ctx.ratio > 0 || ctx.hasActivityToday || ctx.habitsDone > 0) return pick("started", ctx.dateKey, vars);
  return ctx.hour < 12 ? pick("morning", ctx.dateKey, vars) : pick("notStarted", ctx.dateKey, vars);
}
