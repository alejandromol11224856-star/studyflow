import { formatDuration } from "../format";

/**
 * "¿Estoy mejorando?" en una frase. Compara el período actual con el mismo
 * tramo del anterior (la semana pasada "a esta altura"). Nunca culpa: si vas
 * más lento, lo dice con calma y con lo que todavía se puede hacer.
 */
export type VerdictTone = "up" | "same" | "down" | "first" | "empty";

export interface Verdict {
  tone: VerdictTone;
  headline: string;
  detail: string;
  /** Variación (0.18 = +18%); null si no hay base para comparar. */
  trend: number | null;
}

export function progressVerdict(input: {
  period: "week" | "month";
  current: number;
  previous: number;
  /** Días que todavía quedan en el período actual (sin contar hoy). */
  daysLeft: number;
}): Verdict {
  const { period, current, previous, daysLeft } = input;
  const past = period === "week" ? "la semana pasada" : "el mes pasado";
  const thisPeriod = period === "week" ? "esta semana" : "este mes";
  const trend = previous > 0 ? (current - previous) / previous : null;
  const now = formatDuration(current);
  const before = formatDuration(previous);

  if (current === 0 && previous === 0) {
    return {
      tone: "empty",
      headline: "Tu progreso empieza con la primera sesión.",
      detail: `Todavía no hay tiempo registrado ${thisPeriod}. Con diez minutos ya aparece acá.`,
      trend,
    };
  }
  if (previous === 0) {
    return {
      tone: "first",
      headline: "Estás construyendo tu base.",
      detail: `${now} ${thisPeriod}. Es el punto de partida para comparar de acá en adelante.`,
      trend,
    };
  }
  if (trend! > 0.08) {
    return {
      tone: "up",
      headline: `Sí: vas mejor que ${past}.`,
      detail: `${now} hasta ahora, un ${Math.round(trend! * 100)}% más que ${past} a esta altura (${before}).`,
      trend,
    };
  }
  if (trend! < -0.08) {
    return {
      tone: "down",
      headline: `${capitalizeFirst(thisPeriod)} vas un poco más lento.`,
      detail:
        daysLeft > 0
          ? `${now} hasta ahora; ${past} a esta altura llevabas ${before}. Quedan ${daysLeft} ${daysLeft === 1 ? "día" : "días"}.`
          : `${now} frente a ${before}. Un período más lento no borra lo que ya construiste.`,
      trend,
    };
  }
  return {
    tone: "same",
    headline: `Vas parejo con ${past}.`,
    detail: `${now} hasta ahora, casi lo mismo que ${past} a esta altura (${before}). La constancia también es esto.`,
    trend,
  };
}

function capitalizeFirst(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
