"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ColorPicker, IconPicker, SectionAvatar } from "@/components/sections/section-visuals";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { useActiveSections, useCreateHabit, useHabits, useToday, useUpdateHabit } from "@/hooks/use-data";
import { WEEKDAY_LETTERS, frequencyLabel } from "@/lib/domain/habits";
import { HABIT_SUGGESTIONS, type SectionColor, type SectionIcon, guessSectionIcon, nextSectionColor } from "@/lib/sections";
import type { Habit, HabitFrequency } from "@/lib/types";
import { cn } from "@/lib/utils";

export function HabitFormDialog({
  open,
  onOpenChange,
  habit,
  draftName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit;
  /** Nombre sugerido para un hábito nuevo (por ejemplo, desde Métodos). */
  draftName?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={habit ? "Editar hábito" : "Nuevo hábito"}
        description={habit ? undefined : "Algo que querés hacer seguido y marcar como hecho, sin medir tiempo."}
        size="lg"
      >
        <HabitForm key={habit?.id ?? `new-${draftName ?? ""}`} habit={habit} draftName={draftName} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function HabitForm({ habit, draftName, onDone }: { habit?: Habit; draftName?: string; onDone: () => void }) {
  const today = useToday();
  const { data: habits = [] } = useHabits();
  const { active: sections } = useActiveSections();
  const create = useCreateHabit();
  const update = useUpdateHabit();

  const [name, setName] = useState(habit?.name ?? draftName ?? "");
  const [icon, setIcon] = useState<SectionIcon>(habit?.icon ?? (draftName ? guessSectionIcon(draftName) : "check"));
  const [iconTouched, setIconTouched] = useState(Boolean(habit));
  const [color, setColor] = useState<SectionColor>(habit?.color ?? nextSectionColor(habits.map((h) => h.color)));
  const [sectionId, setSectionId] = useState<string | null>(habit?.sectionId ?? null);
  const [frequency, setFrequency] = useState<HabitFrequency>(habit?.frequency ?? "daily");
  const [days, setDays] = useState<number[]>(habit?.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6]);
  const [weeklyTarget, setWeeklyTarget] = useState(habit?.weeklyTarget ?? 3);
  const [reminder, setReminder] = useState(habit?.reminderTime ?? "");
  const [isActive, setIsActive] = useState(habit?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const pending = create.isPending || update.isPending;

  const setNameAndIcon = (value: string) => {
    setName(value);
    if (!iconTouched) setIcon(guessSectionIcon(value) === "target" ? "check" : guessSectionIcon(value));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 60) return setError("Poné un nombre de hasta 60 caracteres.");
    if (frequency === "daily" && days.length === 0) return setError("Elegí al menos un día.");
    setError(null);
    const input = {
      name: trimmed,
      icon,
      color,
      sectionId,
      frequency,
      daysOfWeek: frequency === "daily" ? days : [0, 1, 2, 3, 4, 5, 6],
      weeklyTarget: frequency === "weekly" ? weeklyTarget : null,
      reminderTime: reminder || null,
      startDate: habit?.startDate ?? today,
    };
    try {
      if (habit) {
        await update.mutateAsync({ id: habit.id, patch: { ...input, isActive } });
        toast.success("Hábito actualizado");
      } else {
        await create.mutateAsync(input);
        toast.success(`Hábito "${trimmed}" creado`, { description: frequencyLabel(input) });
      }
      onDone();
    } catch {
      // toast global
    }
  }

  const used = new Set(habits.map((h) => h.name.toLowerCase()));
  const suggestions = habit ? [] : HABIT_SUGGESTIONS.filter((s) => !used.has(s.toLowerCase()));

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {suggestions.length > 0 && !name && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setNameAndIcon(s)}
              className="h-8 rounded-full border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-start gap-3">
        <SectionAvatar section={{ color, icon }} size="lg" className="mt-6" />
        <Field label="Nombre" error={error} className="flex-1">
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              value={name}
              onChange={(e) => setNameAndIcon(e.target.value)}
              placeholder="Ej: Meditar 10 minutos"
              maxLength={60}
              autoComplete="off"
            />
          )}
        </Field>
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-medium">Frecuencia</p>
        <SegmentedControl
          className="w-full"
          value={frequency}
          onChange={setFrequency}
          options={[
            { value: "daily", label: "Días fijos" },
            { value: "weekly", label: "Veces por semana" },
          ]}
        />
        {frequency === "daily" ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {WEEK_ORDER.map((d) => {
              const on = days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  aria-label={["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][d]}
                  onClick={() => setDays((prev) => (on ? prev.filter((x) => x !== d) : [...prev, d]))}
                  className={cn(
                    "size-10 rounded-xl text-sm font-medium transition-all",
                    on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-border",
                  )}
                >
                  {WEEKDAY_LETTERS[d]}
                </button>
              );
            })}
            <span className="ml-1 text-xs text-muted-foreground">{frequencyLabel({ frequency, daysOfWeek: days, weeklyTarget })}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 pt-1">
            <Button variant="outline" size="icon" aria-label="Menos" onClick={() => setWeeklyTarget((n) => Math.max(1, n - 1))}>
              <Minus />
            </Button>
            <span className="w-24 text-center text-sm">
              <b className="text-lg">{weeklyTarget}</b> {weeklyTarget === 1 ? "vez" : "veces"}
            </span>
            <Button variant="outline" size="icon" aria-label="Más" onClick={() => setWeeklyTarget((n) => Math.min(7, n + 1))}>
              <Plus />
            </Button>
            <span className="text-xs text-muted-foreground">por semana, cualquier día</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Área (opcional)" hint="Para verlo junto a esa área.">
          {(id) => (
            <Select id={id} value={sectionId ?? ""} onChange={(e) => setSectionId(e.target.value || null)}>
              <option value="">Ninguna</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Recordatorio (opcional)" hint="Te avisamos a esa hora si no lo marcaste.">
          {(id) => <Input id={id} type="time" value={reminder} onChange={(e) => setReminder(e.target.value)} />}
        </Field>
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

      {habit && (
        <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
          <div>
            <p className="text-sm font-medium">Activo</p>
            <p className="text-xs text-muted-foreground">Si lo pausás, deja de aparecer en Hoy hasta que lo reactives.</p>
          </div>
          <Switch checked={isActive} onChange={setIsActive} label="Hábito activo" />
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" loading={pending}>
          {habit ? "Guardar cambios" : "Crear hábito"}
        </Button>
      </DialogFooter>
    </form>
  );
}
