"use client";

import { Check, Minus, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { PageHeader, SectionTitle } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SegmentedControl, Skeleton } from "@/components/ui/misc";
import { useDailyTotals, useGoals, useToday } from "@/hooks/use-data";
import { useGoalStatuses } from "@/hooks/use-metrics";
import { type DateKey, addDaysKey, capitalize, eachDayKeys, formatKey } from "@/lib/dates";
import { activeGoalsFor, goalMet } from "@/lib/domain/goals";
import { EMPTY_MEASURES, formatMeasure, formatTarget, measureValue } from "@/lib/domain/metrics";
import { measuresByDate } from "@/lib/domain/streaks";
import { formatPercent } from "@/lib/format";
import type { GoalPeriod } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GoalStatusCard, NewGoalCard } from "./goal-progress-card";

const GROUPS: { period: GoalPeriod; title: string; description: string }[] = [
  { period: "daily", title: "Hoy", description: "Se reinician cada día a la medianoche" },
  { period: "weekly", title: "Esta semana", description: "Se reinician al empezar la semana" },
  { period: "monthly", title: "Este mes", description: "Se reinician el primer día del mes" },
];

export function GoalsView() {
  const dialogs = useDialogs();
  const { statuses, isLoading } = useGoalStatuses();

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        eyebrow="Lo que te proponés"
        title="Objetivos"
        description="«Quiero dedicar 3 h por día a Programación.» Tiempo, veces, páginas, distancia o repeticiones."
        actions={
          <Button variant="gradient" onClick={() => dialogs.openGoalDialog({ sectionId: null })}>
            <Plus /> Nuevo objetivo
          </Button>
        }
      />

      {GROUPS.map((group) => {
        const list = statuses.filter((s) => s.goal.period === group.period);
        return (
          <section key={group.period}>
            <SectionTitle
              title={group.title}
              hint={list.length > 0 ? `${list.filter((s) => s.progress.completed).length} de ${list.length} cumplidos · ${group.description.toLowerCase()}` : group.description}
            />
            {isLoading ? (
              <Skeleton className="h-28" />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => (
                  <GoalStatusCard key={`${s.goal.sectionId}|${s.goal.metric}`} status={s} />
                ))}
                <NewGoalCard period={group.period} label={list.length ? "Agregar objetivo" : `Crear objetivo ${group.title.toLowerCase()}`} />
              </div>
            )}
          </section>
        );
      })}

      <ComplianceHistory />
    </div>
  );
}

/** Historial de cumplimiento de los objetivos diarios generales (cualquier métrica). */
function ComplianceHistory() {
  const totals = useDailyTotals();
  const goals = useGoals();
  const today = useToday();
  const [days, setDays] = useState<"30" | "90">("30");
  const n = Number(days);
  const byDate = useMemo(() => measuresByDate(totals.data ?? []), [totals.data]);

  const cells = eachDayKeys(addDaysKey(today, -(n - 1)), today).map((d: DateKey) => {
    const daily = activeGoalsFor(goals.data ?? [], "daily", null, d);
    const m = byDate.get(d) ?? EMPTY_MEASURES;
    const reached = daily.length > 0 && daily.every((g) => goalMet(g, m));
    const state: "met" | "missed" | "pending" | "none" = !daily.length ? "none" : reached ? "met" : d === today ? "pending" : "missed";
    const detail = daily
      .map((g) => `${formatMeasure(g.metric, measureValue(m, g.metric))} de ${formatTarget(g.metric, g.target)}`)
      .join(", ");
    return { d, state, detail };
  });
  const withGoal = cells.filter((c) => c.state === "met" || c.state === "missed");
  const met = withGoal.filter((c) => c.state === "met").length;

  const label = (c: (typeof cells)[number]) =>
    `${capitalize(formatKey(c.d, "EEEE d 'de' MMMM"))}: ${c.detail || "sin objetivo"}${
      c.state === "met" ? " · cumplido" : c.state === "missed" ? " · no cumplido" : c.state === "pending" ? " · en curso" : ""
    }`;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Historial de cumplimiento</CardTitle>
          <CardDescription>
            {withGoal.length
              ? `Objetivos diarios generales: cumpliste ${met} de ${withGoal.length} días (${formatPercent(met / withGoal.length)})`
              : "Definí un objetivo diario general para medir tu cumplimiento"}
          </CardDescription>
        </div>
        <SegmentedControl
          size="sm"
          value={days}
          onChange={setDays}
          options={[
            { value: "30", label: "30 días" },
            { value: "90", label: "90 días" },
          ]}
        />
      </CardHeader>
      <CardContent className="pt-4">
        {totals.isLoading || goals.isLoading ? (
          <Skeleton className="h-16" />
        ) : (
          <>
            <ul className="flex flex-wrap gap-1.5">
              {cells.map((c) => (
                <li
                  key={c.d}
                  title={label(c)}
                  aria-label={label(c)}
                  className={cn(
                    "flex items-center justify-center rounded-md [&_svg]:size-3",
                    n === 30 ? "size-7 sm:size-8" : "size-5 sm:size-6 [&_svg]:size-2.5",
                    c.state === "met" && "bg-success text-white",
                    c.state === "missed" && "bg-danger-soft text-danger",
                    c.state === "pending" && "bg-muted text-muted-foreground ring-2 ring-foreground/60",
                    c.state === "none" && "bg-muted/50 text-muted-foreground/50",
                  )}
                >
                  {c.state === "met" ? <Check strokeWidth={3} /> : c.state === "missed" ? <X strokeWidth={3} /> : c.state === "none" ? <Minus /> : null}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="flex size-3.5 items-center justify-center rounded bg-success text-white">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
                Cumplido
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="flex size-3.5 items-center justify-center rounded bg-danger-soft text-danger">
                  <X className="size-2.5" strokeWidth={3} />
                </span>
                No cumplido
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-3.5 rounded bg-muted ring-2 ring-foreground/60" /> Hoy
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="flex size-3.5 items-center justify-center rounded bg-muted/50 text-muted-foreground/60">
                  <Minus className="size-2.5" />
                </span>
                Sin objetivo
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
