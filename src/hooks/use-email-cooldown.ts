"use client";

import { useCallback, useSyncExternalStore } from "react";
import { EMAIL_COOLDOWN_SECONDS } from "@/lib/auth-links";
import { useClock } from "./use-clock";

const EVENT = "studyflow:email-cooldown";

function storageKey(email: string) {
  return `studyflow:email-cooldown:${email.trim().toLowerCase()}`;
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

/**
 * Espera entre correos de confirmación para no spamear (y no chocar con el
 * límite de Supabase). Se guarda por email, así sobrevive a recargas.
 */
export function useEmailCooldown(email: string) {
  const key = storageKey(email);
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const until = raw ? Number(raw) || 0 : 0;
  const now = useClock(1000, until > 0);
  const remaining = until > 0 && now > 0 ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;

  const start = useCallback(
    (seconds: number = EMAIL_COOLDOWN_SECONDS) => {
      try {
        window.localStorage.setItem(key, String(Date.now() + seconds * 1000));
      } catch {
        /* sin almacenamiento: el botón queda habilitado */
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );

  return { remaining, start };
}
