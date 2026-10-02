"use client";

import { useEffect } from "react";
import { useTimerState } from "@/hooks/use-timer";
import { formatClock } from "@/lib/format";

const PREFIX = /^\d+:\d{2}:\d{2}( \(en pausa\))? · /;

/** Muestra el tiempo de la sesión en el título de la pestaña mientras corre. */
export function TimerDocumentTitle() {
  const { timer, running, elapsed } = useTimerState();
  useEffect(() => {
    if (!timer) return;
    const base = document.title.replace(PREFIX, "");
    document.title = `${formatClock(elapsed)}${running ? "" : " (en pausa)"} · ${base}`;
    return () => {
      document.title = document.title.replace(PREFIX, "");
    };
  }, [timer, running, elapsed]);
  return null;
}
