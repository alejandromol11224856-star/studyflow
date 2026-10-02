"use client";

import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { METRIC_ICONS, METRIC_TILE_LABEL } from "@/components/goals/metric-icon";
import { ColorPicker, IconPicker, SectionAvatar } from "@/components/sections/section-visuals";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DurationInput } from "@/components/ui/duration-input";
import { Field, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  useActiveSections,
  useCreateSection,
  useProfile,
  useSetGoal,
  useToday,
  useUpdateSection,
} from "@/hooks/use-data";
import { GOAL_METRICS, METRIC_META } from "@/lib/domain/metrics";
import { canCreateSection, getPlan } from "@/lib/plans";
import {
  DEFAULT_SECTION_COLOR,
  DEFAULT_SECTION_ICON,
  type SectionColor,
  type SectionIcon,
  guessSectionIcon,
  nextSectionColor,
} from "@/lib/sections";
import type { GoalMetric, Section } from "@/lib/types";
import { cn } from "@/lib/utils";
import { fieldErrors, sectionSchema } from "@/lib/validation";

export function SectionFormDialog({
  open,
  onOpenChange,
  section,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: Section;
  onCreated?: (section: Section) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={section ? "Editar área" : "Nueva área"}
        description={section ? undefined : "Un área de tu vida que querés medir: estudio, gimnasio, idiomas…"}
        size="lg"
      >
        <SectionForm
          key={section?.id ?? "new"}
          section={section}
          onDone={(created) => {
            onOpenChange(false);
            if (created) onCreated?.(created);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function SectionForm({ section, onDone }: { section?: Section; onDone: (created?: Section) => void }) {
  const today = useToday();
  const { data: profile } = useProfile();
  const { active } = useActiveSections();
  const create = useCreateSection();
  const update = useUpdateSection();
  const setGoal = useSetGoal();

  const [name, setName] = useState(section?.name ?? "");
  const [description, setDescription] = useState(section?.description ?? "");
  const [color, setColor] = useState<SectionColor>(
    section?.color ?? (active.length ? nextSectionColor(active.map((s) => s.color)) : DEFAULT_SECTION_COLOR),
  );
  const [icon, setIcon] = useState<SectionIcon>(section?.icon ?? DEFAULT_SECTION_ICON);
  // Mientras el usuario no elija un ícono a mano, se sugiere según el nombre.
  const [iconTouched, setIconTouched] = useState(Boolean(section));
  const [isActive, setIsActive] = useState(section?.isActive ?? true);
  // Objetivo diario opcional del área, en cualquier métrica (tiempo en segundos acá).
  const [goalMetric, setGoalMetric] = useState<GoalMetric>("time");
  const [goalSeconds, setGoalSeconds] = useState(0);
  const [goalAmount, setGoalAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const plan = profile?.plan ?? "free";
  const limitReached = !section && !canCreateSection(plan, active.length);
  const pending = create.isPending || update.isPending || setGoal.isPending;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = sectionSchema.safeParse({ name, description });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    try {
      if (section) {
        await update.mutateAsync({
          id: section.id,
          patch: { name: parsed.data.name, description: parsed.data.description || null, color, icon, isActive },
        });
        toast.success("Área actualizada");
        onDone();
      } else {
        const created = await create.mutateAsync({ name: parsed.data.name, description: parsed.data.description || null, color, icon });
        const amount = Number(goalAmount.replace(",", "."));
        const target = goalMetric === "time" ? Math.round(goalSeconds / 60) : Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
        if (target > 0) {
          await setGoal.mutateAsync({ sectionId: created.id, period: "daily", metric: goalMetric, target, effectiveFrom: today });
        }
        toast.success(`Área "${created.name}" creada`, { description: "Ya podés empezar una sesión en ella." });
        onDone(created);
      }
    } catch {
      // toast global
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {limitReached && (
        <div className="flex gap-3 rounded-xl bg-warning-soft p-3 text-sm text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            Tu plan {getPlan(plan).name} permite hasta {getPlan(plan).limits.maxSections} áreas activas. Archivá alguna
            para crear otra.
          </p>
        </div>
      )}

      <div className="flex items-start gap-3">
        <SectionAvatar section={{ color, icon }} size="lg" className="mt-6" />
        <div className="flex-1 space-y-3">
          <Field label="Nombre" error={errors.name}>
            {(id, describedBy) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={!!errors.name || undefined}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!iconTouched) setIcon(guessSectionIcon(e.target.value));
                }}
                placeholder="Ej: Facultad, Trabajo, Meditación…"
                maxLength={40}
                autoComplete="off"
              />
            )}
          </Field>
          <Field label="Descripción" error={errors.description} hint="Opcional">
            {(id, describedBy) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Facultad, parciales y finales"
                maxLength={200}
              />
            )}
          </Field>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-medium">Color</p>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-medium">Ícono</p>
        <IconPicker
          value={icon}
          color={color}
          onChange={(i) => {
            setIcon(i);
            setIconTouched(true);
          }}
        />
      </div>

      {section && (
        <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
          <div>
            <p className="text-sm font-medium">Activa</p>
            <p className="text-xs text-muted-foreground">Pausada: no aparece en Hoy, temporizador ni registro rápido. Sus datos se conservan.</p>
          </div>
          <Switch checked={isActive} onChange={setIsActive} label="Área activa" />
        </div>
      )}

      {!section && (
        <div className="space-y-2 rounded-3xl border border-border p-4">
          <p className="text-[13px] font-semibold">
            Objetivo diario <span className="font-normal text-muted-foreground">(opcional)</span>
          </p>
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Qué medir">
            {GOAL_METRICS.map((m) => {
              const Icon = METRIC_ICONS[m];
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={goalMetric === m}
                  aria-label={METRIC_META[m].label}
                  onClick={() => setGoalMetric(m)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-2.5 text-[11px] font-semibold transition-all active:scale-95",
                    goalMetric === m ? "border-primary bg-primary-soft text-primary-text" : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {METRIC_TILE_LABEL[m]}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{METRIC_META[goalMetric].hint}</p>
          {goalMetric === "time" ? (
            <DurationInput defaultSeconds={0} onChange={setGoalSeconds} presets={[30, 60, 120, 180]} />
          ) : (
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step={METRIC_META[goalMetric].step}
                placeholder={METRIC_META[goalMetric].placeholder}
                aria-label={`Objetivo diario en ${METRIC_META[goalMetric].unit}`}
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                className="pr-28 tabular"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {METRIC_META[goalMetric].unit} por día
              </span>
            </div>
          )}
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={() => onDone()} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" variant="gradient" loading={pending} disabled={limitReached}>
          {section ? "Guardar cambios" : "Crear área"}
        </Button>
      </DialogFooter>
    </form>
  );
}
