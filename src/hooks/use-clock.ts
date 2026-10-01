"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Reloj compartido: un solo `setInterval` por intervalo para toda la app,
 * aunque haya decenas de componentes mostrando tiempo en vivo. Así todos se
 * actualizan en el mismo tick y no se acumulan timers.
 */
interface ClockStore {
  now: number;
  listeners: Set<() => void>;
  intervalId?: number;
}

const stores = new Map<number, ClockStore>();

function getStore(intervalMs: number) {
  let store = stores.get(intervalMs);
  if (!store) {
    store = { now: Date.now(), listeners: new Set() };
    stores.set(intervalMs, store);
  }
  return store;
}

function tick(store: ClockStore) {
  store.now = Date.now();
  for (const listener of store.listeners) listener();
}

function subscribe(intervalMs: number, listener: () => void) {
  const store = getStore(intervalMs);
  store.listeners.add(listener);
  if (store.intervalId === undefined) {
    store.now = Date.now();
    store.intervalId = window.setInterval(() => tick(store), intervalMs);
  }
  // Al volver a la pestaña, actualizar de inmediato (los intervalos se frenan en segundo plano).
  const onVisible = () => document.visibilityState === "visible" && tick(store);
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    document.removeEventListener("visibilitychange", onVisible);
    store.listeners.delete(listener);
    if (store.listeners.size === 0 && store.intervalId !== undefined) {
      window.clearInterval(store.intervalId);
      store.intervalId = undefined;
    }
  };
}

const noopUnsubscribe = () => {};

/**
 * Devuelve `Date.now()` y re-renderiza cada `intervalMs`. Con `enabled=false`
 * se congela (útil para no gastar renders cuando el temporizador está pausado).
 */
export function useClock(intervalMs: number, enabled = true) {
  const subscribeToClock = useCallback(
    (listener: () => void) => (enabled ? subscribe(intervalMs, listener) : noopUnsubscribe),
    [intervalMs, enabled],
  );
  return useSyncExternalStore(
    subscribeToClock,
    () => getStore(intervalMs).now,
    () => 0,
  );
}
