"use client";

import { Play, Timer as TimerIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SectionChips } from "@/components/sections/section-visuals";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DurationInput } from "@/components/ui/duration-input";
import { Field, Input, Textarea } from "@/components/ui/input";
import { MeasuresInput } from "@/components/ui/measures-input";
import { EmptyState } from "@/components/ui/misc";
import { useActiveSections, useSectionMap } from "@/hooks/use-data";
import { useTimerActions, useTimerState } from "@/hooks/use-timer";
import { formatClock, formatDuration } from "@/lib/format";
import type { ActivityMeasures } from "@/lib/types";

// ---------------------------------------------------------------------------
// Iniciar temporizador
// ---------------------------------------------------------------------------
export function StartTimerDialog({
  open,
  onOpenChange,
  sectionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId?: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Iniciar temporizador" description="Elegí en qué vas a trabajar. Podés pausarlo cuando quieras.">
        <StartTimerForm initialSectionId={sectionId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function StartTimerForm({ initialSectionId, onDone }: { initialSectionId?: string | null; onDone?: () => void }) {
  const { active } = useActiveSections();
  const sectionMap = useSectionMap();
  const { timer } = useTimerState();
  const actions = useTimerActions();
  // undefined = el usuario todavía no eligió: usar la primera sección (aunque
  // las secciones terminen de cargar después de montar el formulario).
  const [picked, setPicked] = useState<string | null | undefined>(initialSectionId);
  const sectionId = picked === undefined ? (active[0]?.id ?? null) : picked;
  const setSectionId = setPicked;
  const [title, setTitle] = useState("");
  // Evita que el contenido cambie durante la animación de cierre.
  const [started, setStarted] = useState(false);

  if (timer && !started) {
    return (
      <EmptyState emoji="⏱️"
        compact
        icon={TimerIcon}
        title="Ya tenés un temporizador en curso"
        description="Terminalo o descartalo antes de empezar otro."
        action={<Button onClick={onDone}>Entendido</Button>}
      />
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (started) return;
        setStarted(true);
        actions.start({ sectionId, title: title.trim() });
        toast.success("Temporizador iniciado", {
          description: sectionId ? sectionMap.get(sectionId)?.name : undefined,
        });
        onDone?.();
      }}
      className="space-y-4"
    >
      {active.length > 0 && <SectionChips sections={active} value={sectionId} onChange={setSectionId} />}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="¿En qué vas a trabajar? (opcional)"
        maxLength={120}
        aria-label="Descripción"
        autoComplete="off"
      />
      <Button type="submit" size="lg" className="w-full">
        <Play className="fill-current" /> Iniciar
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Terminar temporizador
// ---------------------------------------------------------------------------
export function FinishTimerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Guardar sesión" description="Revisá los datos antes de registrar el tiempo.">
        <FinishTimerForm onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function FinishTimerForm({ onDone }: { onDone: () => void }) {
  const { timer, elapsed } = useTimerState();
  const actions = useTimerActions();
  const { active } = useActiveSections();
  const sectionMap = useSectionMap();
  // Se congela el tiempo al abrir: lo que tardes en escribir notas no cuenta.
  const [frozen] = useState(() => Math.min(Math.max(elapsed, 1), 86400));
  const [touched, setTouched] = useState(false);
  const [duration, setDuration] = useState(frozen);
  const [sectionId, setSectionId] = useState<string | null>(timer?.sectionId ?? null);
  const [title, setTitle] = useState(timer?.title ?? "");
  const [notes, setNotes] = useState("");
  const [measures, setMeasures] = useState<Partial<ActivityMeasures>>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // true mientras se guarda/descarta: mantiene el formulario visible durante
  // el cierre aunque el temporizador ya no exista en caché.
  const [closing, setClosing] = useState(false);

  if (!timer && !closing) {
    return (
      <EmptyState emoji="⏱️"
        compact
        icon={TimerIcon}
        title="No hay temporizador activo"
        description="Puede que lo hayas terminado desde otro dispositivo."
        action={<Button onClick={onDone}>Cerrar</Button>}
      />
    );
  }

  const defaultTitle = (sectionId && sectionMap.get(sectionId)?.name) || "Sesión de trabajo";
  const durationSeconds = touched ? duration : frozen;

  async function save() {
    if (!timer) return;
    if (durationSeconds < 1 || durationSeconds > 86400) {
      setError("La duración debe estar entre 1 minuto y 24 horas.");
      return;
    }
    setClosing(true);
    try {
      await actions.finish({
        timer,
        title: title.trim() || defaultTitle,
        notes: notes.trim() || null,
        sectionId,
        durationSeconds,
        pages: measures.pages ?? null,
        distanceKm: measures.distanceKm ?? null,
        reps: measures.reps ?? null,
      });
      toast.success(`+${formatDuration(durationSeconds, { seconds: durationSeconds < 60 })} registrados`, {
        description: title.trim() || defaultTitle,
      });
      onDone();
    } catch {
      setClosing(false);
    }
  }

  async function discard() {
    if (!confirmDiscard) {
      setConfirmDiscard(true);
      window.setTimeout(() => setConfirmDiscard(false), 3500);
      return;
    }
    setClosing(true);
    try {
      await actions.discard();
      toast("Temporizador descartado");
      onDone();
    } catch {
      setClosing(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="rounded-2xl bg-muted/60 px-4 py-3 text-center">
        <p className="text-3xl font-semibold tabular tracking-tight">{formatClock(durationSeconds)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {elapsed > 86400 ? "El temporizador superó 24 h; ajustá la duración real." : "Tiempo a registrar"}
        </p>
      </div>

      {active.length > 0 && <SectionChips sections={active} value={sectionId} onChange={setSectionId} />}

      <Field label="Título">
        {(id) => (
          <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={defaultTitle} maxLength={120} />
        )}
      </Field>

      <Field label="Ajustar duración" error={error} hint="Si te olvidaste de pausar, corregilo acá.">
        {(id) => (
          <DurationInput
            idPrefix={id}
            defaultSeconds={frozen}
            presets={[]}
            onChange={(s) => {
              setTouched(true);
              setDuration(s);
              setError(null);
            }}
          />
        )}
      </Field>

      <MeasuresInput value={measures} onChange={setMeasures} />

      <Field label="Notas" hint="Opcional">
        {(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={2000} />}
      </Field>

      <DialogFooter className="sm:justify-between">
        <Button variant="danger-ghost" onClick={discard} disabled={actions.finishing}>
          {confirmDiscard ? "¿Seguro? Tocá de nuevo" : "Descartar"}
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row [&>button]:w-full sm:[&>button]:w-auto">
          <Button variant="outline" onClick={onDone} disabled={actions.finishing}>
            Seguir midiendo
          </Button>
          <Button type="submit" loading={actions.finishing}>
            Guardar actividad
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
