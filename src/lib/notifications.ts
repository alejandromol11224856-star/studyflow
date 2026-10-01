/**
 * Notificaciones. Hoy hay dos canales: aviso dentro de la app (toast) y
 * notificación del navegador (si el usuario dio permiso). La interfaz
 * `NotificationChannel` permite sumar más adelante push real (service worker +
 * Web Push desde un backend/cron) o email sin cambiar quién las dispara.
 */
export interface NotificationPayload {
  /** Identificador estable (evita duplicados del mismo recordatorio). */
  id: string;
  title: string;
  body: string;
}

export interface NotificationChannel {
  name: string;
  isAvailable(): boolean;
  send(payload: NotificationPayload): Promise<boolean>;
}

export type PermissionState = NotificationPermission | "unsupported";

export function notificationPermission(): PermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  if (notificationPermission() === "unsupported") return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return notificationPermission();
  }
}

export const browserChannel: NotificationChannel = {
  name: "browser",
  isAvailable: () => notificationPermission() === "granted",
  async send(payload) {
    try {
      // Si hay un service worker (PWA instalada), se usa: funciona también en Android.
      const registration = await navigator.serviceWorker?.getRegistration?.();
      if (registration) {
        await registration.showNotification(payload.title, { body: payload.body, tag: payload.id, icon: "/icon" });
        return true;
      }
      new Notification(payload.title, { body: payload.body, tag: payload.id, icon: "/icon" });
      return true;
    } catch {
      return false;
    }
  },
};

/** "HH:mm" a minutos del día. */
export function minutesOfDay(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * ¿Toca avisar? Sí desde la hora indicada y durante las 2 horas siguientes
 * (por si la app se abrió un rato después).
 */
export function isReminderDue(now: string, at: string, windowMinutes = 120) {
  const diff = minutesOfDay(now) - minutesOfDay(at);
  return diff >= 0 && diff <= windowMinutes;
}
