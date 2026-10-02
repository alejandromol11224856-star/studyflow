/**
 * Mensajes motivacionales: humanos, variados y nunca culposos. Se elige uno
 * por día, contexto y franja horaria (cada 4 horas): cambia lo suficiente
 * para no repetirse, pero no a cada segundo mientras usás la app.
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
  /** Tiempo registrado hoy y ayer (segundos). */
  todaySeconds?: number;
  yesterdaySeconds?: number;
  /** Actividades registradas hoy. */
  todayCount?: number;
  /** Días desde la última actividad anterior a hoy (null = nunca registró nada). */
  daysSinceLastActivity?: number | null;
  /** Hoy ya es el mejor día registrado. */
  isNewBestDay?: boolean;
}

const POOLS = {
  morning: [
    "Hoy no necesitás hacerlo perfecto. Necesitás avanzar.",
    "Un primer bloque corto alcanza para arrancar el día.",
    "Lo que hagas en la primera hora marca el ritmo del resto.",
    "Empezá por lo que más te cuesta, mientras tenés energía.",
    "Día nuevo, página en blanco. Escribí el primer renglón.",
  ],
  notStarted: [
    "Todavía estás a tiempo: diez minutos ya cuentan.",
    "No necesitás hacerlo perfecto. Necesitás mantener el movimiento.",
    "Arrancá con algo chico. El impulso viene después.",
    "Un poco todos los días termina siendo muchísimo.",
    "Elegí una sola cosa y empezá por ahí.",
  ],
  noGoal: [
    "Un poco todos los días termina siendo muchísimo.",
    "Definí un objetivo para hoy: lo que se mide, mejora.",
    "Elegí una sola cosa importante para hoy y empezá por ahí.",
    "Un objetivo chico y claro le gana a uno grande y difuso.",
  ],
  firstDay: [
    "Tu primera sesión es la más importante: la que empieza todo.",
    "Hoy empieza tu registro. Con diez minutos alcanza para arrancar.",
    "Bienvenido. Empezá con algo chico y dejá que el progreso se vea.",
  ],
  returning: [
    "Volviste. Lo importante es retomar, no recuperar todo lo que pasó.",
    "Pasaron unos días. Empezá con algo corto y retomá el ritmo.",
    "Retomar también es parte de la constancia.",
    "Hoy es un buen día para volver. Un bloque corto alcanza.",
  ],
  firstSession: [
    "Primera sesión del día hecha. Lo más difícil ya pasó.",
    "Arrancaste. Ahora es cuestión de sumar.",
    "Buen comienzo: ya hay algo en el registro de hoy.",
  ],
  partial: [
    "Ya llevás {minutes}. Seguí un poco más.",
    "{minutes} hoy. Cada bloque suma.",
    "Vas sumando: {minutes} hasta ahora.",
    "Un día más de trabajo se convierte en progreso acumulado.",
  ],
  betterThanYesterday: [
    "Hoy ya avanzaste más que ayer.",
    "Superaste lo de ayer. Así se construye el ritmo.",
    "Más que ayer. No hace falta más que eso.",
  ],
  halfway: [
    "Pasaste la mitad. Seguí con el mismo ritmo.",
    "Más de la mitad hecha. Vas muy bien.",
    "La mitad ya está. Lo que falta es más corto que lo que hiciste.",
  ],
  almost: [
    "Te faltan {remaining}. Ya casi.",
    "Último empujón: {remaining} y cerrás el día.",
    "Solo {remaining} más para cumplir lo que te propusiste.",
  ],
  streakRisk: [
    "Tu racha de {streak} días sigue viva: te faltan {remaining}.",
    "Quedan unas horas para sostener tus {streak} días seguidos.",
    "Llevás {streak} días seguidos. Un rato más y suman uno nuevo.",
  ],
  completed: [
    "Objetivo cumplido. Hoy cumpliste con vos mismo.",
    "Objetivo cumplido. Lo que sumes ahora es extra.",
    "Día cumplido. Descansar también es parte del plan.",
    "Hecho. Mañana, lo mismo: la constancia hace el resto.",
  ],
  exceeded: [
    "Superaste tu objetivo. Todo lo que sumes es extra.",
    "Ya superaste lo que te propusiste para hoy.",
  ],
  streakGoing: [
    "{streak} días seguidos. Tu constancia empieza a ser rutina.",
    "Vas {streak} días seguidos. Objetivo cumplido otra vez.",
    "{streak} días seguidos cumpliendo. Así se construye un hábito.",
  ],
  newRecord: [
    "Es tu mejor día registrado. Vale la pena notarlo.",
    "Nuevo récord personal: nunca habías sumado tanto en un día.",
  ],
  habitsPending: [
    "Te {habitsVerb} {habits} para hoy.",
    "Los hábitos se construyen de a uno: te {habitsVerb} {habits}.",
    "Objetivo listo. {habitsCap} para cerrar el día.",
  ],
};

/** Mensajes para las recompensas (al cumplir algo). */
const REWARDS = {
  goal: ["Hoy cumpliste lo que te propusiste.", "Lo dijiste y lo hiciste.", "Un objetivo más que pasa de idea a hecho."],
  habit: ["Un día más en la cadena.", "Hecho. La constancia se arma así, de a un día.", "Otro eslabón."],
  habitsAll: ["Todos los hábitos de hoy, listos.", "Día de hábitos completo."],
  session: ["Sesión guardada. Cada bloque suma.", "Tiempo registrado. Se nota el avance."],
  level: ["Tu constancia se nota.", "Cada sesión te trajo hasta acá.", "Subir de nivel es la suma de días normales."],
  record: ["Nunca habías hecho tanto en un día.", "Nuevo récord personal."],
  streak: ["Nunca habías sostenido tantos días seguidos.", "Tu mejor racha hasta ahora."],
};

export type RewardKind = keyof typeof REWARDS;

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** "42 minutos", "1 hora y 5 minutos", "2 horas". */
export function humanDuration(totalSeconds: number) {
  const minutes = Math.max(0, Math.round(totalSeconds / 60));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hours = h === 1 ? "1 hora" : `${h} horas`;
  const mins = m === 1 ? "1 minuto" : `${m} minutos`;
  if (!h) return mins;
  return m ? `${hours} y ${mins}` : hours;
}

function pick(pool: keyof typeof POOLS, ctx: MotivationContext, vars: Record<string, string | number>) {
  const options = POOLS[pool];
  const message = options[hash(`${ctx.dateKey}:${pool}:${Math.floor(ctx.hour / 4)}`) % options.length];
  return message.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

/** Frase corta para acompañar una recompensa (varía con la semilla). */
export function rewardMessage(kind: RewardKind, seed = Date.now()) {
  const options = REWARDS[kind];
  return options[Math.abs(Math.floor(seed)) % options.length];
}

export function motivationalMessage(ctx: MotivationContext): string {
  const pending = Math.max(0, ctx.habitsDue - ctx.habitsDone);
  const habitsLabel = pending === 1 ? "1 hábito" : `${pending} hábitos`;
  const vars = {
    remaining: humanDuration(ctx.remainingSeconds),
    streak: ctx.streak,
    minutes: humanDuration(ctx.todaySeconds ?? 0),
    habits: habitsLabel,
    habitsVerb: pending === 1 ? "queda" : "quedan",
    habitsCap: pending === 1 ? "Falta 1 hábito" : `Faltan ${pending} hábitos`,
  };
  const todaySeconds = ctx.todaySeconds ?? 0;
  const away = ctx.daysSinceLastActivity;

  if (ctx.completed) {
    if (ctx.isNewBestDay) return pick("newRecord", ctx, vars);
    if (pending > 0) return pick("habitsPending", ctx, vars);
    if (ctx.streak >= 2) return pick("streakGoing", ctx, vars);
    return ctx.exceeded ? pick("exceeded", ctx, vars) : pick("completed", ctx, vars);
  }

  if (!ctx.hasActivityToday && away === null) return pick("firstDay", ctx, vars);
  if (!ctx.hasActivityToday && (away ?? 0) >= 3) return pick("returning", ctx, vars);

  if (!ctx.hasGoal) {
    if (pending > 0 && ctx.hasActivityToday) return pick("habitsPending", ctx, vars);
    if (ctx.hasActivityToday) return todaySeconds >= 60 ? pick("partial", ctx, vars) : pick("firstSession", ctx, vars);
    return pick("noGoal", ctx, vars);
  }

  if (ctx.hour >= 19 && ctx.streak > 1 && !ctx.todayCompleted) return pick("streakRisk", ctx, vars);
  if (ctx.ratio >= 0.75) return pick("almost", ctx, vars);
  if (ctx.ratio >= 0.5) return pick("halfway", ctx, vars);
  if (ctx.ratio > 0 || ctx.hasActivityToday || ctx.habitsDone > 0) {
    const yesterday = ctx.yesterdaySeconds ?? 0;
    if (yesterday > 0 && todaySeconds > yesterday) return pick("betterThanYesterday", ctx, vars);
    if (ctx.todayCount === 1) return pick("firstSession", ctx, vars);
    return todaySeconds >= 60 ? pick("partial", ctx, vars) : pick("firstSession", ctx, vars);
  }
  return ctx.hour < 12 ? pick("morning", ctx, vars) : pick("notStarted", ctx, vars);
}
