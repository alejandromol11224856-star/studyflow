"use client";

import { useEffect } from "react";
import { useTimerState } from "@/hooks/use-timer";
import { formatClock } from "@/lib/format";

/** Muestra el temporizador en el título de la pestaña mientras corre. */
export function TimerDocumentTitle() {
  const { timer, running, elapsed } = useTimerState();
  useEffect(() => {
    if (!timer) return;
    const base = document.title.replace(/^(⏱|⏸) [\d:]+ · /, "");
    document.title = `${running ? "⏱" : "⏸"} ${formatClock(elapsed)} · ${base}`;
    return () => {
      document.title = document.title.replace(/^(⏱|⏸) [\d:]+ · /, "");
    };
  }, [timer, running, elapsed]);
  return null;
}
