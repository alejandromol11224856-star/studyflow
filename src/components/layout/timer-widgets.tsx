"use client";

import { Pause, Play, Square, Timer } from "lucide-react";
import { SectionDot } from "@/components/sections/section-visuals";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { useSectionMap } from "@/hooks/use-data";
import { useTimerActions, useTimerState } from "@/hooks/use-timer";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

function useTimerLabel() {
  const { timer } = useTimerState();
  const sectionMap = useSectionMap();
  const section = timer?.sectionId ? sectionMap.get(timer.sectionId) : undefined;
  return { section, label: timer?.title || section?.name || "Sesión sin área" };
}

/** Bloque del temporizador en la barra lateral de escritorio. */
export function SidebarTimer() {
  const { timer, running, elapsed } = useTimerState();
  const actions = useTimerActions();
  const dialogs = useDialogs();
  const { section, label } = useTimerLabel();

  if (!timer) {
    return (
      <button
        type="button"
        onClick={() => dialogs.openStartTimer()}
        className="mx-3 mb-3 flex items-center gap-2.5 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary-soft hover:text-primary-text"
      >
        <Timer className="size-4" /> Iniciar temporizador
      </button>
    );
  }

  return (
    <div className="mx-3 mb-3 rounded-2xl border border-border bg-card p-3 shadow-card animate-slide-up">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={cn("size-1.5 rounded-full", running ? "bg-success animate-pulse-soft" : "bg-warning")} />
        {running ? "En curso" : "En pausa"}
        {section && <SectionDot color={section.color} className="ml-auto" />}
      </div>
      <p className="mt-1 truncate text-sm font-medium">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xl font-semibold tabular tracking-tight">{formatClock(elapsed)}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={running ? actions.pause : actions.resume}
            className="inline-flex size-8 items-center justify-center rounded-lg bg-muted text-foreground transition hover:bg-border"
            aria-label={running ? "Pausar" : "Continuar"}
          >
            {running ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
          </button>
          <button
            type="button"
            onClick={dialogs.openFinishTimer}
            className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary-hover"
            aria-label="Terminar y guardar"
          >
            <Square className="size-3.5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Barra flotante del temporizador en móvil (sobre la barra de navegación). */
export function TimerMiniBar() {
  const { timer, running, elapsed } = useTimerState();
  const actions = useTimerActions();
  const dialogs = useDialogs();
  const { section, label } = useTimerLabel();
  if (!timer) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 animate-slide-up lg:hidden">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-popover/95 p-2 pl-3.5 shadow-elevated backdrop-blur">
        <span className={cn("size-2 shrink-0 rounded-full", running ? "bg-success animate-pulse-soft" : "bg-warning")} />
        <button type="button" onClick={dialogs.openFinishTimer} className="min-w-0 flex-1 text-left">
          <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            {section && <SectionDot color={section.color} />}
            <span className="truncate">{label}</span>
          </span>
          <span className="block text-base font-semibold tabular leading-tight">{formatClock(elapsed)}</span>
        </button>
        <button
          type="button"
          onClick={running ? actions.pause : actions.resume}
          className="inline-flex size-10 items-center justify-center rounded-xl bg-muted text-foreground active:scale-95"
          aria-label={running ? "Pausar" : "Continuar"}
        >
          {running ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
        </button>
        <button
          type="button"
          onClick={dialogs.openFinishTimer}
          className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground active:scale-95"
          aria-label="Terminar y guardar"
        >
          <Square className="size-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
}
