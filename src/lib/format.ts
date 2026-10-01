/** Utilidades de formato de duraciones. Todas reciben segundos. */

/** 9015 -> "2:30:15" */
export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** 9015 -> "2h 30m", 2700 -> "45m", 40 -> "40s", 0 -> "0m" */
export function formatDuration(totalSeconds: number, opts: { seconds?: boolean } = {}) {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s === 0) return "0m";
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m || (!h && !opts.seconds)) parts.push(`${m}m`);
  if (opts.seconds && sec) parts.push(`${sec}s`);
  return parts.join(" ");
}

/** Minutos a texto: 90 -> "1h 30m" */
export function formatMinutes(minutes: number) {
  return formatDuration(minutes * 60);
}

/** Segundos a horas decimales para gráficos: 5400 -> 1.5 */
export function toHours(seconds: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round((seconds / 3600) * factor) / factor;
}

/** Etiqueta compacta para ejes: 5400 -> "1.5h", 1800 -> "30m" */
export function formatAxis(seconds: number) {
  if (seconds === 0) return "0";
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = seconds / 3600;
  return `${Number.isInteger(h) ? h : h.toFixed(1)}h`;
}

const TICK_STEPS = [60, 300, 600, 900, 1800, 3600, 7200, 10800, 18000, 36000, 72000, 108000, 180000, 360000];

/**
 * Ticks "redondos" para un eje de tiempo (1m, 5m, 15m, 30m, 1h, 2h…), con
 * como máximo `count` intervalos. Evita etiquetas repetidas como "1m, 1m".
 */
export function timeTicks(maxSeconds: number, count = 4) {
  const max = Math.max(maxSeconds, 60);
  const step = TICK_STEPS.find((s) => max / s <= count) ?? Math.ceil(max / count / 3600) * 3600;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  return ticks;
}

export function formatPercent(ratio: number) {
  return `${Math.round(ratio * 100)}%`;
}

/** Convierte horas + minutos de un formulario a segundos. */
export function hmToSeconds(hours: number, minutes: number) {
  return Math.round((Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60);
}

export function secondsToHm(seconds: number) {
  const total = Math.round(seconds / 60);
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}
