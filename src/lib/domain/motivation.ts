import { formatDuration } from "../format";

/**
 * Mensajes motivacionales contextuales: cálidos, nunca agresivos ni
 * culpabilizantes. Se elige uno por día, contexto y franja horaria: así no se
 * repite siempre el mismo pero tampoco cambia a cada segundo.
 */
export interface MotivationContext {
  dateKey: string;
  hour: number;
  hasGoal: boolean;
  /** Progreso del objetivo diario principal (0..1). */
  ratio: number;
  completed: boolean;
  /** Se pasó de la meta (no solo la alcanzó). */
  exceeded?: boolean;
  remainingSeconds: number;
  hasActivityToday: boolean;
  streak: number;
  todayCompleted: boolean;
  habitsDue: number;
  habitsDone: number;
}

const POOLS = {
  noGoal: [
    "Un poco todos los días termina siendo muchísimo.",
    "Definí un objetivo para hoy: lo que se mide, mejora.",
    "Elegí una sola cosa importante para hoy y empezá por ahí.",
    "Un objetivo chico y claro le gana a uno grande y difuso.",
  ],
  morning: [
    "Un buen día empieza con un primer bloque. 25 minutos alcanzan para arrancar.",
    "Hoy no necesitás hacerlo perfecto. Solo empezar.",
    "Empezá por lo más difícil mientras tenés energía. ☀️",
    "Lo que hagas en la primera hora marca el resto del día.",
  ],
  notStarted: [
    "Todavía estás a tiempo: un bloque corto ya cuenta.",
    "Hoy no necesitás hacerlo perfecto. Solo empezar.",
    "Arrancá con 10 minutos. El impulso viene después.",
    "Un poco todos los días termina siendo muchísimo.",
  ],
  started: [
    "Ya arrancaste: lo más difícil está hecho. 💪",
    "Vas sumando. Un bloque más y se nota.",
    "Buen comienzo. Mantené el ritmo sin apurarte.",
    "Cada minuto cuenta. Seguí así.",
  ],
  halfway: [
    "Pasaste la mitad. Seguí con el mismo ritmo.",
    "Más de la mitad hecha. Vas muy bien. 🙌",
    "La mitad ya es tuya. Vamos por el resto.",
  ],
  almost: [
    "Te faltan {remaining}. Ya casi. 🏁",
    "Último empujón: {remaining} y cerrás el día.",
    "Solo {remaining} más. ¡Lo tenés!",
  ],
  streakRisk: [
    "Tu racha de {streak} días sigue viva: te faltan {remaining}.",
    "Quedan unas horas para sostener tu racha de {streak} días. 🔥",
    "🔥 {streak} días seguidos. Un rato más y suman uno nuevo.",
  ],
  completed: [
    "🚀 Objetivo cumplido. Lo que sumes ahora es extra.",
    "Día cumplido. Descansar también es parte del plan.",
    "Hecho. Mañana, lo mismo: la constancia hace el resto.",
    "🎉 Objetivo cumplido. Hoy fue un buen día.",
  ],
  exceeded: [
    "🚀 Ya superaste tu objetivo. Todo lo que sumes es extra.",
    "🚀 Superaste tu meta de hoy. ¡Imparable!",
  ],
  streakGoing: [
    "🔥 Vas {streak} días seguidos. Objetivo cumplido.",
    "🔥 {streak} días seguidos. Hecho por hoy, ¡qué constancia!",
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

function pick(pool: keyof typeof POOLS, ctx: MotivationContext, vars: Record<string, string | number>) {
  const options = POOLS[pool];
  // Cambia por día y por franja de 4 horas: variado, pero estable mientras usás la app.
  const message = options[hash(`${ctx.dateKey}:${pool}:${Math.floor(ctx.hour / 4)}`) % options.length];
  return message.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

export function motivationalMessage(ctx: MotivationContext): string {
  const vars = {
    remaining: formatDuration(ctx.remainingSeconds),
    streak: ctx.streak,
    habits: ctx.habitsDue - ctx.habitsDone,
  };
  if (ctx.completed) {
    if (ctx.habitsDone < ctx.habitsDue) return pick("habitsPending", ctx, vars);
    if (ctx.streak >= 2) return pick("streakGoing", ctx, vars);
    return ctx.exceeded ? pick("exceeded", ctx, vars) : pick("completed", ctx, vars);
  }
  if (!ctx.hasGoal) {
    if (ctx.habitsDue > ctx.habitsDone && ctx.hasActivityToday) return pick("habitsPending", ctx, vars);
    return ctx.hasActivityToday ? pick("started", ctx, vars) : pick("noGoal", ctx, vars);
  }
  if (ctx.hour >= 19 && ctx.streak > 1 && !ctx.todayCompleted) return pick("streakRisk", ctx, vars);
  if (ctx.ratio >= 0.75) return pick("almost", ctx, vars);
  if (ctx.ratio >= 0.5) return pick("halfway", ctx, vars);
  if (ctx.ratio > 0 || ctx.hasActivityToday || ctx.habitsDone > 0) return pick("started", ctx, vars);
  return ctx.hour < 12 ? pick("morning", ctx, vars) : pick("notStarted", ctx, vars);
}
