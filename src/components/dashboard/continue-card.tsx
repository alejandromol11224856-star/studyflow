"use client";

import { ArrowRight, Check, Pause, Play } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { SectionAvatar } from "@/components/sections/section-visuals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress, Skeleton } from "@/components/ui/misc";
import { useActivities, useSectionMap, useToday } from "@/hooks/use-data";
import { saveSessionPlan, useSessionPlan } from "@/hooks/use-session-plan";
import { useTimerActions, useTimerState } from "@/hooks/use-timer";
import { relativeDayLabel } from "@/lib/dates";
import { formatClock, formatDuration } from "@/lib/format";
import { FREE_PLAN, blockState } from "@/lib/session-plans";
import { sectionColor } from "@/lib/sections";
import { cn } from "@/lib/utils";

/** Sesión en curso: el reloj grande y lo justo para pausar o terminar. */
function RunningSession() {
  const { timer, running, elapsed } = useTimerState();
  const actions = useTimerActions();
  const dialogs = useDialogs();
  const sectionMap = useSectionMap();
  const plan = useSessionPlan(timer);
  if (!timer) return null;
  const section = timer.sectionId ? sectionMap.get(timer.sectionId) : undefined;
  const block = blockState(plan, elapsed);
  const title = [section?.name, timer.title].filter(Boolean).join(" — ") || "Sesión libre";

  return (
    <div>
      <p className="flex items-center gap-2 text-[13px] font-semibold">
        <span className={cn("size-2 rounded-full", running ? "bg-success animate-pulse-soft" : "bg-muted-foreground")} />
        <span className={running ? "text-success" : "text-muted-foreground"}>{running ? "En curso" : "En pausa"}</span>
        {plan.focusMinutes > 0 && <span className="text-muted-foreground">· {plan.label}</span>}
      </p>
      <p className="mt-2 truncate text-[17px] font-semibold">{title}</p>
      <p className="mt-1 font-display text-[52px] font-semibold leading-none tabular" aria-live="off">
        {formatClock(elapsed)}
      </p>
      {block && (
        <div className="mt-4">
          <Progress value={block.ratio} label={`Bloque ${block.block}`} className="h-2" />
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Bloque {block.block} · faltan <span className="font-semibold text-foreground tabular">{formatClock(block.remaining).replace(/^0:/, "")}</span>
            {block.completedBlocks > 0 && ` · ${block.completedBlocks} ${block.completedBlocks === 1 ? "bloque completo" : "bloques completos"}`}
          </p>
        </div>
      )}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {running ? (
          <Button variant="outline" size="lg" onClick={actions.pause}>
            <Pause /> Pausar
          </Button>
        ) : (
          <Button variant="outline" size="lg" onClick={actions.resume}>
            <Play /> Seguir
          </Button>
        )}
        <Button variant="gradient" size="lg" onClick={dialogs.openFinishTimer}>
          <Check /> Terminar
        </Button>
      </div>
    </div>
  );
}

/**
 * "¿Qué hago ahora?": la sesión en curso, lo último para retomar en un toque
 * o, la primera vez, un bloque corto para empezar.
 */
export function ContinueCard({ className }: { className?: string }) {
  const today = useToday();
  const dialogs = useDialogs();
  const actions = useTimerActions();
  const sectionMap = useSectionMap();
  const { timer, isLoading } = useTimerState();
  const recent = useActivities({ limit: 1 });
  const last = recent.data?.items[0];
  const lastSection = last?.sectionId ? sectionMap.get(last.sectionId) : undefined;

  function resume() {
    if (!last) return;
    saveSessionPlan(FREE_PLAN);
    actions.start({ sectionId: lastSection ? last!.sectionId : null, title: last.title });
    toast.success("Sesión iniciada", { description: [lastSection?.name, last.title].filter(Boolean).join(" — ") });
  }

  const startPomodoro = () => dialogs.openStartTimer(undefined, { methodId: "pomodoro" });

  return (
    <Card data-tour="timer" className={cn("relative overflow-clip p-5 sm:p-6", className)}>
      {lastSection && !timer && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: sectionColor(lastSection.color) }} />
      )}
      <p className="eyebrow">{timer ? "Ahora" : last ? "Continuar" : "Para empezar"}</p>

      {isLoading || recent.isLoading ? (
        <Skeleton className="mt-3 h-28" />
      ) : timer ? (
        <div className="mt-3">
          <RunningSession />
        </div>
      ) : last ? (
        <div className="mt-3">
          <div className="flex items-center gap-3">
            <SectionAvatar section={lastSection ?? null} size="md" />
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold">{[lastSection?.name, last.title].filter(Boolean).join(" — ") || "Sesión libre"}</p>
              <p className="text-sm text-muted-foreground">
                {formatDuration(last.durationSeconds)} · {relativeDayLabel(last.date, today).toLowerCase()}
              </p>
            </div>
          </div>
          <Button variant="gradient" size="xl" className="mt-5 w-full" onClick={resume}>
            <Play className="fill-current" /> Continuar sesión
          </Button>
          <div className="mt-3 flex items-center justify-between gap-2 text-sm">
            <button type="button" onClick={() => dialogs.openStartTimer()} className="font-semibold text-muted-foreground hover:text-foreground">
              Empezar otra cosa
            </button>
            <button type="button" onClick={startPomodoro} className="font-semibold text-primary-text hover:underline">
              Con Pomodoro
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <p className="font-display text-[24px] font-semibold leading-tight">Un bloque de 25 minutos.</p>
          <p className="mt-1.5 text-[15px] text-muted-foreground">Elegí en qué, arrancá y, al terminar, se guarda solo en tu día.</p>
          <Button variant="gradient" size="xl" className="mt-5 w-full" onClick={startPomodoro}>
            <Play className="fill-current" /> Comenzar
          </Button>
          <Link href="/methods" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-text hover:underline">
            Cómo concentrarte mejor <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
    </Card>
  );
}
