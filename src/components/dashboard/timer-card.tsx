"use client";

import { ChevronDown, Pause, Play, Square, Timer, Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { StartTimerForm } from "@/components/dialogs/timer-dialogs";
import { useAuth } from "@/components/providers/auth-provider";
import { SectionDot, SectionIconGlyph } from "@/components/sections/section-visuals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/misc";
import { useActiveSections, useSectionMap } from "@/hooks/use-data";
import { useTimerActions, useTimerState } from "@/hooks/use-timer";
import { formatClock } from "@/lib/format";
import { sectionColor } from "@/lib/sections";
import { cn } from "@/lib/utils";

export function TimerCard({ className }: { className?: string }) {
  const { timer, running, elapsed, isLoading } = useTimerState();
  const actions = useTimerActions();
  const dialogs = useDialogs();
  const sectionMap = useSectionMap();
  const { active } = useActiveSections();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const { mode } = useAuth();
  const section = timer?.sectionId ? sectionMap.get(timer.sectionId) : undefined;

  return (
    <Card id="timer" className={cn("flex flex-col", className)}>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
            <Timer className="size-[18px]" />
          </span>
          <div>
            <CardTitle>Temporizador</CardTitle>
            <CardDescription>
              {!timer
                ? "Medí tu tiempo en vivo"
                : mode === "supabase"
                  ? "Sincronizado: podés seguirlo desde otro dispositivo"
                  : "Sigue contando aunque cierres la pestaña"}
            </CardDescription>
          </div>
        </div>
        {timer && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
              running ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
            )}
          >
            <span className={cn("size-1.5 rounded-full bg-current", running && "animate-pulse-soft")} />
            {running ? "En curso" : "En pausa"}
          </span>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col pt-4">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !timer ? (
          <div className="flex flex-1 flex-col gap-4">
            <p className="text-center text-5xl font-semibold tabular tracking-tight text-muted-foreground/40">0:00:00</p>
            <StartTimerForm />
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <DropdownMenu>
              <DropdownMenuTrigger className="mx-auto inline-flex max-w-full items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                {section ? (
                  <span style={{ color: sectionColor(section.color) }} className="[&_svg]:size-4">
                    <SectionIconGlyph icon={section.icon} />
                  </span>
                ) : (
                  <SectionDot color={null} />
                )}
                <span className="truncate font-medium">{section?.name ?? "Sin área"}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuLabel>Cambiar área</DropdownMenuLabel>
                {active.map((s) => (
                  <DropdownMenuItem key={s.id} onSelect={() => actions.update({ sectionId: s.id })}>
                    <SectionDot color={s.color} /> {s.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onSelect={() => actions.update({ sectionId: null })}>
                  <SectionDot color={null} /> Sin área
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {timer.title && <p className="mt-2 truncate text-center text-sm text-muted-foreground">{timer.title}</p>}

            <p
              className={cn(
                "my-5 text-center text-5xl font-semibold tabular tracking-tight transition-opacity sm:text-6xl",
                !running && "opacity-60",
              )}
              aria-live="off"
            >
              {formatClock(elapsed)}
            </p>

            <div className="mt-auto grid grid-cols-[1fr_1fr_auto] gap-2">
              {running ? (
                <Button variant="secondary" size="lg" onClick={actions.pause}>
                  <Pause className="fill-current" /> Pausar
                </Button>
              ) : (
                <Button size="lg" onClick={actions.resume}>
                  <Play className="fill-current" /> Continuar
                </Button>
              )}
              <Button variant={running ? "primary" : "outline"} size="lg" onClick={dialogs.openFinishTimer}>
                <Square className="size-3.5 fill-current" /> Terminar
              </Button>
              <Button variant="ghost" size="icon-lg" aria-label="Descartar temporizador" onClick={() => setConfirmDiscard(true)}>
                <Trash />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="¿Descartar el temporizador?"
        description={`Se perderán ${formatClock(elapsed)} sin registrar. Esta acción no se puede deshacer.`}
        confirmLabel="Descartar"
        destructive
        onConfirm={async () => {
          await actions.discard();
          toast("Temporizador descartado");
        }}
      />
    </Card>
  );
}
