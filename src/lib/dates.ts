import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

/**
 * Las fechas "de calendario" se manejan como claves `yyyy-MM-dd` (DateKey).
 * Siempre representan el día local del usuario según su zona horaria, así el
 * objetivo diario se reinicia a medianoche de *su* día, no del servidor.
 */
export type DateKey = string;
export type WeekStart = 0 | 1;

const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: string): value is DateKey {
  return KEY_RE.test(value);
}

/** Date local -> clave (usa la zona horaria del entorno). */
export function keyFromDate(date: Date): DateKey {
  return format(date, "yyyy-MM-dd");
}

/** Clave -> Date a medianoche local (para aritmética de calendario). */
export function dateFromKey(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function partsInTimeZone(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

/** Día calendario de un instante en una zona horaria IANA. */
export function dateKeyInTimeZone(date: Date, timeZone?: string): DateKey {
  try {
    const p = partsInTimeZone(date, timeZone);
    return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
  } catch {
    return keyFromDate(date);
  }
}

export function todayKey(timeZone?: string): DateKey {
  return dateKeyInTimeZone(new Date(), timeZone);
}

/** Hora "HH:mm" de un instante ISO en la zona horaria del usuario. */
export function timeInTimeZone(iso: string, timeZone?: string) {
  try {
    const p = partsInTimeZone(new Date(iso), timeZone);
    return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
  } catch {
    return format(new Date(iso), "HH:mm");
  }
}

function offsetMs(date: Date, timeZone: string) {
  const p = partsInTimeZone(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Fecha + hora de pared en una zona horaria -> instante ISO (UTC). */
export function zonedTimeToIso(key: DateKey, time: string, timeZone?: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh || 0, mm || 0);
  if (!timeZone) return new Date(y, m - 1, d, hh || 0, mm || 0).toISOString();
  try {
    let ts = wall - offsetMs(new Date(wall), timeZone);
    // Segunda pasada para cruzar correctamente cambios de horario de verano.
    ts = wall - offsetMs(new Date(ts), timeZone);
    return new Date(ts).toISOString();
  } catch {
    return new Date(y, m - 1, d, hh || 0, mm || 0).toISOString();
  }
}

export function addDaysKey(key: DateKey, amount: number): DateKey {
  return keyFromDate(addDays(dateFromKey(key), amount));
}

export function addMonthsKey(key: DateKey, amount: number): DateKey {
  return keyFromDate(addMonths(dateFromKey(key), amount));
}

/** Días calendario entre dos claves (a - b). */
export function diffDays(a: DateKey, b: DateKey) {
  return differenceInCalendarDays(dateFromKey(a), dateFromKey(b));
}

export interface DateRange {
  from: DateKey;
  to: DateKey;
}

export function weekRange(key: DateKey, weekStartsOn: WeekStart = 1): DateRange {
  const d = dateFromKey(key);
  return {
    from: keyFromDate(startOfWeek(d, { weekStartsOn })),
    to: keyFromDate(endOfWeek(d, { weekStartsOn })),
  };
}

export function monthRange(key: DateKey): DateRange {
  const d = dateFromKey(key);
  return { from: keyFromDate(startOfMonth(d)), to: keyFromDate(endOfMonth(d)) };
}

export function eachDayKeys(from: DateKey, to: DateKey): DateKey[] {
  if (from > to) return [];
  return eachDayOfInterval({ start: dateFromKey(from), end: dateFromKey(to) }).map(keyFromDate);
}

/** Formatea una clave con date-fns en español. */
export function formatKey(key: DateKey, pattern: string) {
  return format(dateFromKey(key), pattern, { locale: es });
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Hoy", "Ayer" o "lunes 3 de marzo". */
export function relativeDayLabel(key: DateKey, today: DateKey) {
  const diff = diffDays(today, key);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff === -1) return "Mañana";
  const sameYear = key.slice(0, 4) === today.slice(0, 4);
  return capitalize(formatKey(key, sameYear ? "EEEE d 'de' MMMM" : "d 'de' MMMM yyyy"));
}

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function listTimeZones(): string[] {
  try {
    const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
    const zones = intl.supportedValuesOf?.("timeZone");
    if (zones?.length) return zones;
  } catch {
    /* navegadores antiguos */
  }
  return ["UTC", browserTimeZone()];
}

export const WEEKDAY_SHORT: Record<WeekStart, string[]> = {
  1: ["L", "M", "X", "J", "V", "S", "D"],
  0: ["D", "L", "M", "X", "J", "V", "S"],
};
