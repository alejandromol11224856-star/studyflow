"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DurationInput } from "@/components/ui/duration-input";
import { Field, Input, Select } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/misc";
import { useActiveSections, useGoals, useSectionMap, useSetGoal, useToday } from "@/hooks/use-data";
import { GOAL_PERIODS, PERIOD_LABEL, goalTargetFor } from "@/lib/domain/goals";
import { GOAL_METRICS, METRIC_EMOJI, METRIC_META, PERIOD_SUFFIX, formatTarget } from "@/lib/domain/metrics";
import type { GoalMetric, GoalPeriod } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface GoalDialogOptions {
  sectionId: string | null;
  period?: GoalPeriod;
  metric?: GoalMetric;
  /** true: editar ese objetivo puntual (sección/período/métrica fijos). */
  lock?: boolean;
}

const TIME_CONFIG: Record<GoalPeriod, { presets: number[]; maxHours: number; fallback: number }> = {
  daily: { presets: [30, 60, 120, 180, 240, 300], maxHours: 24, fallback: 120 },
  weekly: { presets: [300, 600, 900, 1200, 1500, 2100], maxHours: 168, fallback: 600 },
  monthly: { presets: [1200, 2400, 3600, 4800, 6000, 9000], maxHours: 744, fallback: 2400 },
};

export function GoalDialog({
  open,
  onOpenChange,
  options,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: GoalDialogOptions;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={options.lock ? "Editar objetivo" : "Nuevo objetivo"}
        description={options.lock ? undefined : "Tiempo, veces, páginas, distancia o repeticiones: lo que quieras medir."}
      >
        <GoalForm key={JSON.stringify(options)} options={options} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function GoalForm({ options, onDone }: { options: GoalDialogOptions; onDone: () => void }) {
  const today = useToday();
  const goals = useGoals();
  const setGoal = useSetGoal();
  const { active } = useActiveSections();
  const sectionMap = useSectionMap();
  const [sectionId, setSectionId] = useState<string | null>(options.sectionId);
  const [period, setPeriod] = useState<GoalPeriod>(options.period ?? "daily");
  const [metric, setMetric] = useState<GoalMetric>(options.metric ?? "time");
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [rawNumber, setRawNumber] = useState<Record<string, string>>({});

  const scopeKey = `${sectionId ?? "global"}|${period}|${metric}`;
  const current = goalTargetFor(goals.data ?? [], period, sectionId, today, metric);
  const fallback = metric === "time" ? TIME_CONFIG[period].fallback : 0;
  const target = drafts[scopeKey] ?? (current || fallback);
  const sectionName = sectionId ? (sectionMap.get(sectionId)?.name ?? "Área") : "Todas las áreas";
  const valid = metric === "time" ? target >= 1 : target > 0;

  async function save(value: number) {
    try {
      await setGoal.mutateAsync({ sectionId, period, metric, target: value, effectiveFrom: today });
      toast.success(value > 0 ? "Objetivo guardado" : "Objetivo eliminado", {
        description: value > 0 ? `${sectionName} · ${formatTarget(metric, value)} ${PERIOD_SUFFIX[period]}` : undefined,
      });
      onDone();
    } catch {
      // toast global
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) void save(target);
      }}
    >
      {options.lock ? (
        <div className="rounded-xl bg-muted/60 px-3.5 py-2.5 text-sm">
          <span className="font-medium">{sectionName}</span>
          <span className="text-muted-foreground">
            {" "}
            · {PERIOD_LABEL[period]} · {METRIC_META[metric].label}
          </span>
        </div>
      ) : (
        <>
          <Field label="¿Para qué?">
            {(id) => (
              <Select id={id} value={sectionId ?? ""} onChange={(e) => setSectionId(e.target.value || null)}>
                <option value="">Todas las áreas (objetivo general)</option>
                {active.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <div className="space-y-1.5">
            <p className="text-[13px] font-semibold">Qué medir</p>
            <div className="grid grid-cols-5 gap-1.5">
              {GOAL_METRICS.map((m) => {
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={metric === m}
                    onClick={() => setMetric(m)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-2xl border px-1 py-3 text-[11px] font-bold transition-all active:scale-95",
                      metric === m
                        ? "border-primary bg-primary-soft text-primary-text shadow-sm"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span aria-hidden className="text-2xl leading-none">
                      {METRIC_EMOJI[m]}
                    </span>
                    {METRIC_META[m].label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">{METRIC_META[metric].hint}</p>
          </div>

          <SegmentedControl
            className="w-full"
            value={period}
            onChange={setPeriod}
            options={GOAL_PERIODS.map((p) => ({ value: p, label: PERIOD_LABEL[p] }))}
          />
        </>
      )}

      <div>
        <p className="mb-2 text-[13px] font-medium">
          {current ? `Meta actual: ${formatTarget(metric, current)}` : "Meta"}
        </p>
        {metric === "time" ? (
          <DurationInput
            key={scopeKey}
            defaultSeconds={target * 60}
            maxHours={TIME_CONFIG[period].maxHours}
            presets={TIME_CONFIG[period].presets}
            onChange={(s) => setDrafts((d) => ({ ...d, [scopeKey]: Math.round(s / 60) }))}
          />
        ) : (
          <div className="relative">
            <Input
              key={scopeKey}
              type="number"
              inputMode="decimal"
              min={0}
              step={METRIC_META[metric].step}
              max={METRIC_META[metric].max}
              placeholder={METRIC_META[metric].placeholder}
              aria-label={`Meta en ${METRIC_META[metric].unit}`}
              value={rawNumber[scopeKey] ?? (current ? String(current) : "")}
              onChange={(e) => {
                setRawNumber((r) => ({ ...r, [scopeKey]: e.target.value }));
                const n = Number(e.target.value.replace(",", "."));
                setDrafts((d) => ({ ...d, [scopeKey]: Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0 }));
              }}
              className="pr-28 tabular"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {METRIC_META[metric].unit} {PERIOD_SUFFIX[period]}
            </span>
          </div>
        )}
      </div>

      {valid && (
        <p className="rounded-xl border border-dashed border-border px-3.5 py-2.5 text-sm">
          <span className="text-muted-foreground">Tu objetivo:</span>{" "}
          <span className="font-medium">
            {sectionName} · {formatTarget(metric, target)} {PERIOD_SUFFIX[period]}
          </span>
        </p>
      )}

      <div className="flex gap-2.5 rounded-xl bg-muted/70 p-3 text-xs text-muted-foreground">
        <Info className="mt-px size-4 shrink-0" />
        <p>
          Se aplica desde hoy. Los días anteriores conservan el objetivo que tenían, así tu historial de cumplimiento no
          se altera.
        </p>
      </div>

      <DialogFooter className="sm:justify-between">
        {current > 0 ? (
          <Button variant="danger-ghost" onClick={() => void save(0)} disabled={setGoal.isPending}>
            Quitar objetivo
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        <Button type="submit" loading={setGoal.isPending} disabled={!valid}>
          Guardar objetivo
        </Button>
      </DialogFooter>
    </form>
  );
}
