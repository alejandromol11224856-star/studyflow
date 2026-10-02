"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SectionChips } from "@/components/sections/section-visuals";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DurationInput } from "@/components/ui/duration-input";
import { Field, Input, Textarea } from "@/components/ui/input";
import { MeasuresInput, formatActivityMeasures } from "@/components/ui/measures-input";
import { Switch } from "@/components/ui/switch";
import {
  useActiveSections,
  useCreateActivity,
  useSectionMap,
  useTimeZone,
  useToday,
  useUpdateActivity,
} from "@/hooks/use-data";
import { type DateKey, timeInTimeZone, zonedTimeToIso } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import type { Activity, ActivityInput, ActivityMeasures } from "@/lib/types";
import { activitySchema, fieldErrors } from "@/lib/validation";

export interface ActivityFormOptions {
  activity?: Activity;
  date?: DateKey;
  sectionId?: string | null;
}

export function ActivityFormDialog({
  open,
  onOpenChange,
  options,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: ActivityFormOptions;
}) {
  const editing = Boolean(options.activity);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={editing ? "Editar actividad" : "Registrar actividad"}
        description={editing ? undefined : "Tu objetivo y tus estadísticas se actualizan al instante."}
      >
        <ActivityForm key={options.activity?.id ?? "new"} options={options} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ActivityForm({ options, onDone }: { options: ActivityFormOptions; onDone: () => void }) {
  const today = useToday();
  const timeZone = useTimeZone();
  const { active } = useActiveSections();
  const sectionMap = useSectionMap();
  const create = useCreateActivity();
  const update = useUpdateActivity();
  const existing = options.activity;

  const [sectionId, setSectionId] = useState<string | null>(
    existing ? existing.sectionId : options.sectionId !== undefined ? options.sectionId : (active[0]?.id ?? null),
  );
  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState<DateKey>(existing?.date ?? options.date ?? today);
  const [duration, setDuration] = useState(existing?.durationSeconds ?? 30 * 60);
  const [startTime, setStartTime] = useState(existing?.startedAt ? timeInTimeZone(existing.startedAt, timeZone) : "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [measureTime, setMeasureTime] = useState(existing ? existing.durationSeconds > 0 : true);
  const [measures, setMeasures] = useState<Partial<ActivityMeasures>>({
    pages: existing?.pages ?? null,
    distanceKm: existing?.distanceKm ?? null,
    reps: existing?.reps ?? null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Si se edita una actividad de una sección archivada o pausada, mostrarla igual.
  const current = existing?.sectionId ? sectionMap.get(existing.sectionId) : undefined;
  const chipSections = current && !active.some((s) => s.id === current.id) ? [...active, current] : active;
  const hasOtherMeasure = Boolean(measures.pages || measures.distanceKm || measures.reps);
  const defaultTitle = (sectionId && sectionMap.get(sectionId)?.name) || "Actividad";
  const pending = create.isPending || update.isPending;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = activitySchema.safeParse({
      title: title.trim() || defaultTitle,
      notes,
      date,
      durationSeconds: duration,
      startTime,
    });
    const nextErrors = parsed.success ? {} : fieldErrors(parsed.error);
    if (date > today) nextErrors.date = "No podés registrar actividades en días futuros.";
    if (measureTime && duration < 60) nextErrors.durationSeconds = "La duración mínima es 1 minuto.";
    if (!measureTime && !hasOtherMeasure) nextErrors.durationSeconds = "Sin tiempo, cargá páginas, distancia o repeticiones.";
    setErrors(nextErrors);
    if (!parsed.success || Object.keys(nextErrors).length) return;

    const input: ActivityInput = {
      sectionId,
      title: parsed.data.title,
      notes: notes.trim() || null,
      date,
      durationSeconds: measureTime ? duration : 0,
      startedAt: startTime ? zonedTimeToIso(date, startTime, timeZone) : null,
      pages: measures.pages ?? null,
      distanceKm: measures.distanceKm ?? null,
      reps: measures.reps ?? null,
    };
    const summary = [measureTime ? formatDuration(duration) : "", formatActivityMeasures(measures)].filter(Boolean).join(" · ");

    try {
      if (existing) {
        await update.mutateAsync({ id: existing.id, patch: input, previous: existing });
        toast.success("Actividad actualizada");
      } else {
        await create.mutateAsync({ ...input, source: "manual" });
        toast.success(`+${summary} registrados`, { description: input.title });
      }
      onDone();
    } catch {
      // El toast de error lo muestra el MutationCache global.
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {chipSections.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium">Área</p>
          <SectionChips sections={chipSections} value={sectionId} onChange={setSectionId} />
        </div>
      )}

      <Field label="¿Qué hiciste?" error={errors.title}>
        {(id, describedBy) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            aria-invalid={!!errors.title || undefined}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={defaultTitle}
            maxLength={120}
            autoComplete="off"
          />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha" error={errors.date}>
          {(id, describedBy) => (
            <Input
              id={id}
              type="date"
              aria-describedby={describedBy}
              aria-invalid={!!errors.date || undefined}
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
            />
          )}
        </Field>
        <Field label="Hora de inicio" error={errors.startTime} hint="Opcional">
          {(id, describedBy) => (
            <Input
              id={id}
              type="time"
              aria-describedby={describedBy}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          )}
        </Field>
      </div>

      <Field
        label={
          <span className="flex w-full items-center justify-between">
            Duración
            <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
              Medir tiempo
              <Switch checked={measureTime} onChange={setMeasureTime} label="Medir tiempo" />
            </span>
          </span>
        }
        error={errors.durationSeconds}
      >
        {(id) =>
          measureTime ? (
            <DurationInput idPrefix={id} defaultSeconds={duration} onChange={setDuration} invalid={!!errors.durationSeconds} />
          ) : (
            <p className="rounded-xl bg-muted/60 px-3.5 py-2.5 text-sm text-muted-foreground">
              Sin tiempo: registrá páginas, distancia o repeticiones abajo.
            </p>
          )
        }
      </Field>

      <MeasuresInput value={measures} onChange={setMeasures} defaultOpen={!measureTime} key={measureTime ? "t" : "m"} />

      <Field label="Notas" error={errors.notes} hint="Opcional: qué aprendiste, cómo te fue, pendientes…">
        {(id, describedBy) => (
          <Textarea
            id={id}
            aria-describedby={describedBy}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={2000}
          />
        )}
      </Field>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" loading={pending}>
          {existing ? "Guardar cambios" : "Registrar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
