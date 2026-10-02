"use client";

import { PartyPopper, Pencil, Target } from "lucide-react";
import { toast } from "sonner";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, Skeleton } from "@/components/ui/misc";
import { useSetGoal } from "@/hooks/use-data";
import { useGoalProgress } from "@/hooks/use-metrics";
import { formatClock, formatDuration, formatMinutes, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const QUICK_GOALS = [30, 60, 120, 180, 240, 300];

export function DailyGoalCard({ className }: { className?: string }) {
  const { progress, target: targetMinutes, liveSeconds, isLoading, today } = useGoalProgress("daily", null, "time");
  const dialogs = useDialogs();
  const setGoal = useSetGoal();

  if (isLoading) {
    return (
      <Card className={cn("p-5", className)}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-6 h-14 w-56" />
        <Skeleton className="mt-8 h-3 w-full" />
      </Card>
    );
  }

  if (!targetMinutes) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <Glow tone="primary" />
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <HeaderIcon />
            <div>
              <CardTitle>Objetivo diario</CardTitle>
              <CardDescription>Definí cuánto tiempo querés dedicar cada día</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <p className="text-3xl font-semibold tracking-tight">{formatDuration(progress.done)}</p>
          <p className="mt-1 text-sm text-muted-foreground">registrados hoy. Elegí una meta para ver tu cuenta regresiva:</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK_GOALS.map((m) => (
              <Button
                key={m}
                variant="outline"
                size="sm"
                disabled={setGoal.isPending}
                onClick={() =>
                  setGoal.mutate(
                    { sectionId: null, period: "daily", metric: "time", target: m, effectiveFrom: today },
                    { onSuccess: () => toast.success(`Objetivo diario: ${formatMinutes(m)}`) },
                  )
                }
              >
                {formatMinutes(m)}
              </Button>
            ))}
            <Button variant="soft" size="sm" onClick={() => dialogs.openGoalDialog({ sectionId: null, period: "daily", metric: "time", lock: true })}>
              Personalizado
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { remaining: remainingSeconds, ratio, completed, done: doneSeconds, target: targetSeconds } = progress;
  const extra = Math.max(0, doneSeconds - targetSeconds);

  return (
    <Card className={cn("relative overflow-hidden", completed && "border-success/40", className)}>
      <Glow tone={completed ? "success" : "primary"} />
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <HeaderIcon completed={completed} />
          <div>
            <CardTitle>Objetivo diario</CardTitle>
            <CardDescription>Meta de {formatMinutes(targetMinutes)} · se reinicia cada día</CardDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Editar objetivo diario"
          onClick={() => dialogs.openGoalDialog({ sectionId: null, period: "daily", metric: "time", lock: true })}
        >
          <Pencil />
        </Button>
      </CardHeader>
      <CardContent className="relative pt-5">
        {completed ? (
          <div key="done" className="animate-pop">
            <p className="text-[28px] font-semibold leading-tight tracking-tight sm:text-4xl">Objetivo diario cumplido.</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {extra > 0 ? `Sumaste ${formatDuration(extra)} extra.` : "Llegaste justo a tu meta."}
            </p>
          </div>
        ) : (
          <div key="pending" aria-live="off">
            <p className="text-5xl font-semibold tabular tracking-tight sm:text-6xl">{formatClock(remainingSeconds)}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">restantes para completar tu día</p>
          </div>
        )}

        <div className="mt-6">
          <Progress
            value={ratio}
            label="Progreso del objetivo diario"
            className="h-3"
            tone={completed ? "success" : "primary"}
          />
          <div className="mt-2.5 flex items-center justify-between text-sm">
            <span>
              <span className="font-semibold">{formatDuration(doneSeconds)}</span>
              <span className="text-muted-foreground"> / {formatMinutes(targetMinutes)}</span>
            </span>
            <span className={cn("font-semibold tabular", completed ? "text-success" : "text-foreground")}>
              {completed && <PartyPopper className="mr-1 inline size-4 align-[-3px]" />}
              {formatPercent(ratio)}
            </span>
          </div>
          {liveSeconds > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success animate-pulse-soft" />
              Incluye {formatDuration(liveSeconds)} del temporizador en curso
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HeaderIcon({ completed }: { completed?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-xl",
        completed ? "bg-success-soft text-success" : "bg-primary-soft text-primary-text",
      )}
    >
      <Target className="size-[18px]" />
    </span>
  );
}

function Glow({ tone }: { tone: "primary" | "success" }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full opacity-70 blur-3xl"
      style={{ background: tone === "success" ? "var(--success-soft)" : "var(--primary-soft)" }}
    />
  );
}
