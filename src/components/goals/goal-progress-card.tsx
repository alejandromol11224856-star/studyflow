"use client";

import { Check, Plus } from "lucide-react";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { SectionAvatar } from "@/components/sections/section-visuals";
import { Badge, Progress } from "@/components/ui/misc";
import { useSectionMap } from "@/hooks/use-data";
import type { GoalStatus } from "@/hooks/use-metrics";
import { PERIOD_LABEL, PERIOD_NOUN } from "@/lib/domain/goals";
import { PERIOD_SUFFIX, formatMeasure, formatTarget } from "@/lib/domain/metrics";
import { sectionColor } from "@/lib/sections";
import type { GoalPeriod } from "@/lib/types";
import { cn } from "@/lib/utils";

export function goalRemainingText(status: GoalStatus) {
  const { goal, progress } = status;
  if (progress.completed) {
    const extra = progress.done - progress.target;
    return extra > 0 ? `+${formatMeasure(goal.metric, extra)} por encima de la meta` : "Meta alcanzada";
  }
  return `Faltan ${formatMeasure(goal.metric, progress.remaining)} ${PERIOD_NOUN[goal.period]}`;
}

/** Tarjeta de un objetivo con su progreso; al tocarla se edita. */
export function GoalStatusCard({ status, showSection = true, className }: { status: GoalStatus; showSection?: boolean; className?: string }) {
  const dialogs = useDialogs();
  const sectionMap = useSectionMap();
  const { goal, progress } = status;
  const section = goal.sectionId ? sectionMap.get(goal.sectionId) : null;

  return (
    <button
      type="button"
      onClick={() => dialogs.openGoalDialog({ sectionId: goal.sectionId, period: goal.period, metric: goal.metric, lock: true })}
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card p-4 text-left shadow-card transition hover:border-foreground/15 hover:shadow-elevated active:scale-[0.99]",
        className,
      )}
      aria-label={`Editar objetivo ${PERIOD_LABEL[goal.period].toLowerCase()}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
          {showSection && <SectionAvatar section={section ?? null} size="xs" />}
          <span className="truncate">
            {showSection ? (section?.name ?? "General") : PERIOD_LABEL[goal.period]}
            {showSection && ` · ${PERIOD_LABEL[goal.period]}`}
          </span>
        </span>
        {progress.completed && (
          <Badge tone="success">
            <Check /> Cumplido
          </Badge>
        )}
      </div>
      <p className="mt-2 text-lg font-semibold tracking-tight">
        {formatMeasure(goal.metric, progress.done)}{" "}
        <span className="text-sm font-normal text-muted-foreground">/ {formatTarget(goal.metric, goal.target)}</span>
      </p>
      <Progress
        className="mt-2.5 h-1.5"
        value={progress.ratio}
        color={progress.completed ? "var(--success)" : section ? sectionColor(section.color) : undefined}
        label={`Progreso: ${formatTarget(goal.metric, goal.target)} ${PERIOD_SUFFIX[goal.period]}`}
      />
      <p className="mt-2 text-xs text-muted-foreground">{goalRemainingText(status)}</p>
    </button>
  );
}

/** Tarjeta para crear un objetivo nuevo (con alcance y período sugeridos). */
export function NewGoalCard({
  sectionId = null,
  period,
  label = "Nuevo objetivo",
  className,
}: {
  sectionId?: string | null;
  period?: GoalPeriod;
  label?: string;
  className?: string;
}) {
  const dialogs = useDialogs();
  return (
    <button
      type="button"
      onClick={() => dialogs.openGoalDialog({ sectionId, period })}
      className={cn(
        "flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border p-4 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:bg-primary-soft hover:text-primary-text",
        className,
      )}
    >
      <Plus className="size-5" />
      {label}
    </button>
  );
}
