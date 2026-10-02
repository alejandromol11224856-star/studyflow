"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { METRIC_ICONS, METRIC_TILE_LABEL, METRIC_VERB } from "@/components/goals/metric-icon";
import { SectionIconGlyph } from "@/components/sections/section-visuals";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DurationInput } from "@/components/ui/duration-input";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/misc";
import { useActiveSections, useGoals, useSectionMap, useSetGoal, useToday } from "@/hooks/use-data";
import { GOAL_PERIODS, goalTargetFor } from "@/lib/domain/goals";
import { GOAL_METRICS, METRIC_META, PERIOD_SUFFIX, formatTarget } from "@/lib/domain/metrics";
import { sectionColor } from "@/lib/sections";
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

const PERIOD_OPTION: Record<GoalPeriod, string> = { daily: "Por día", weekly: "Por semana", monthly: "Por mes" };

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
      <DialogContent title={options.lock ? "Editar objetivo" : "Nuevo objetivo"} description={options.lock ? undefined : "Armá la frase y listo."}>
        <GoalForm key={JSON.stringify(options)} options={options} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all active:scale-95",
        active ? "border-transparent bg-ink text-background" : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
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
  const sectionName = sectionId ? (sectionMap.get(sectionId)?.name ?? "Área") : null;
  const valid = metric === "time" ? target >= 1 : target > 0;

  // La frase del objetivo, en vivo: "Quiero dedicar 3h por día a Programación."
  const sentence = valid
    ? `Quiero ${METRIC_VERB[metric]} ${formatTarget(metric, target)} ${PERIOD_SUFFIX[period]}${
        sectionName ? `${metric === "time" ? " a" : " en"} ${sectionName}` : ""
      }.`
    : `Quiero ${METRIC_VERB[metric]}…`;

  async function save(value: number) {
    try {
      await setGoal.mutateAsync({ sectionId, period, metric, target: value, effectiveFrom: today });
      toast.success(value > 0 ? "Objetivo guardado" : "Objetivo eliminado", {
        description: value > 0 ? sentence : undefined,
      });
      onDone();
    } catch {
      // toast global
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) void save(target);
      }}
    >
      <p className="font-display text-[26px] font-semibold leading-snug" aria-live="polite">
        {sentence}
      </p>

      {!options.lock && (
        <>
          <div>
            <p className="mb-2 text-[13px] font-semibold">¿En qué?</p>
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-none sm:-mx-6 sm:px-6">
              <Chip active={sectionId === null} onClick={() => setSectionId(null)}>
                En general
              </Chip>
              {active.map((s) => (
                <Chip key={s.id} active={sectionId === s.id} onClick={() => setSectionId(s.id)}>
                  <span style={{ color: sectionId === s.id ? undefined : sectionColor(s.color) }} className="[&_svg]:size-4">
                    <SectionIconGlyph icon={s.icon} />
                  </span>
                  {s.name}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold">¿Qué medís?</p>
            <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Qué medir">
              {GOAL_METRICS.map((m) => {
                const Icon = METRIC_ICONS[m];
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={metric === m}
                    aria-label={METRIC_META[m].label}
                    onClick={() => setMetric(m)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 text-[11px] font-semibold transition-all active:scale-95",
                      metric === m ? "border-primary bg-primary-soft text-primary-text" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                    {METRIC_TILE_LABEL[m]}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{METRIC_META[metric].hint}</p>
          </div>
        </>
      )}

      <div>
        <p className="mb-2 text-[13px] font-semibold">{current ? `¿Cuánto? (hoy: ${formatTarget(metric, current)})` : "¿Cuánto?"}</p>
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
              className="h-14 pr-32 font-display text-[22px] tabular"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              {METRIC_META[metric].unit}
            </span>
          </div>
        )}
      </div>

      {!options.lock && (
        <div>
          <p className="mb-2 text-[13px] font-semibold">¿Cada cuánto?</p>
          <SegmentedControl className="w-full" value={period} onChange={setPeriod} options={GOAL_PERIODS.map((p) => ({ value: p, label: PERIOD_OPTION[p] }))} />
        </div>
      )}

      <p className="flex gap-2.5 text-xs text-muted-foreground">
        <Info className="mt-px size-4 shrink-0" />
        Se aplica desde hoy. Los días anteriores conservan su objetivo, así tu historial no cambia.
      </p>

      <DialogFooter className="sm:justify-between">
        {current > 0 ? (
          <Button variant="danger-ghost" onClick={() => void save(0)} disabled={setGoal.isPending}>
            Quitar objetivo
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        <Button type="submit" variant="gradient" size="lg" loading={setGoal.isPending} disabled={!valid}>
          {current > 0 ? "Guardar objetivo" : "Crear objetivo"}
        </Button>
      </DialogFooter>
    </form>
  );
}
