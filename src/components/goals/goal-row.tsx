"use client";

import { Check } from "lucide-react";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { SectionAvatar } from "@/components/sections/section-visuals";
import { Progress } from "@/components/ui/misc";
import { useSectionMap } from "@/hooks/use-data";
import type { GoalStatus } from "@/hooks/use-metrics";
import { PERIOD_SUFFIX, formatMeasure, formatTarget } from "@/lib/domain/metrics";
import { sectionColor } from "@/lib/sections";
import { cn } from "@/lib/utils";

/** Fila compacta de un objetivo con su progreso (para Hoy y widgets). */
export function GoalRow({ status, className }: { status: GoalStatus; className?: string }) {
  const dialogs = useDialogs();
  const sectionMap = useSectionMap();
  const { goal, progress, liveSeconds } = status;
  const section = goal.sectionId ? sectionMap.get(goal.sectionId) : null;
  const label = section?.name ?? "General";

  return (
    <button
      type="button"
      onClick={() => dialogs.openGoalDialog({ sectionId: goal.sectionId, period: goal.period, metric: goal.metric, lock: true })}
      className={cn("flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-muted/70", className)}
      aria-label={`${label}: ${formatTarget(goal.metric, goal.target)} ${PERIOD_SUFFIX[goal.period]}`}
    >
      <SectionAvatar section={section ?? null} size="sm" className={cn(!section && "bg-primary-soft text-primary-text")} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium">
            {label}
            <span className="font-normal text-muted-foreground"> · {formatTarget(goal.metric, goal.target)}</span>
          </p>
          <p className="shrink-0 text-xs tabular">
            {progress.completed ? (
              <span className="inline-flex items-center gap-1 font-medium text-success">
                <Check className="size-3.5" strokeWidth={3} /> Listo
              </span>
            ) : (
              <span className="text-muted-foreground">
                <b className="font-semibold text-foreground">{formatMeasure(goal.metric, progress.done)}</b> /{" "}
                {formatTarget(goal.metric, goal.target)}
              </span>
            )}
          </p>
        </div>
        <Progress
          className="mt-1.5 h-1.5"
          value={progress.ratio}
          color={progress.completed ? "var(--success)" : section ? sectionColor(section.color) : undefined}
        />
        {liveSeconds > 0 && !progress.completed && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success animate-pulse-soft" /> contando el temporizador
          </p>
        )}
      </div>
    </button>
  );
}
