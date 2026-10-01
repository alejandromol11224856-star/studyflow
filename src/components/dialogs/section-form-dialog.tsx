"use client";

import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { canCreateSection, getPlan } from "@/lib/plans";
import {
  DEFAULT_SECTION_COLOR,
  DEFAULT_SECTION_ICON,
  type SectionColor,
  type SectionIcon,
  guessSectionIcon,
  nextSectionColor,
} from "@/lib/sections";
import type { Section } from "@/lib/types";
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
        title={section ? "Editar sección" : "Nueva sección"}
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
  const [goalSeconds, setGoalSeconds] = useState(0);
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
        toast.success("Sección actualizada");
        onDone();
      } else {
        const created = await create.mutateAsync({ name: parsed.data.name, description: parsed.data.description || null, color, icon });
        if (goalSeconds >= 60) {
          await setGoal.mutateAsync({
            sectionId: created.id,
            period: "daily",
            metric: "time",
            target: Math.round(goalSeconds / 60),
            effectiveFrom: today,
          });
        }
        toast.success(`Sección "${created.name}" creada`);
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
            Tu plan {getPlan(plan).name} permite hasta {getPlan(plan).limits.maxSections} secciones activas. Archivá alguna
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
          <Switch checked={isActive} onChange={setIsActive} label="Sección activa" />
        </div>
      )}

      {!section && (
        <Field label="Objetivo diario de tiempo (opcional)" hint="Podés sumar objetivos de veces, páginas o distancia después, en Objetivos.">
          {(id) => <DurationInput idPrefix={id} defaultSeconds={0} onChange={setGoalSeconds} presets={[30, 60, 120, 180]} />}
        </Field>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={() => onDone()} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" loading={pending} disabled={limitReached}>
          {section ? "Guardar cambios" : "Crear sección"}
        </Button>
      </DialogFooter>
    </form>
  );
}
