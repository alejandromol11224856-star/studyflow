"use client";

import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bell,
  ChevronDown,
  Ellipsis,
  Flame,
  ListChecks,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { PageHeader } from "@/components/layout/page-header";
import { SectionAvatar } from "@/components/sections/section-visuals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";
import { useDeleteHabit, useHabits, useReorderHabits, useSectionMap, useToday, useUpdateHabit } from "@/hooks/use-data";
import { type HabitStatus, useHabitStatuses } from "@/hooks/use-metrics";
import { frequencyLabel, streakLabel } from "@/lib/domain/habits";
import { formatPercent } from "@/lib/format";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { HabitCheckButton, HabitWeekStrip } from "./habit-visuals";

function HabitActions({ habit, onDelete }: { habit: Habit; onDelete: () => void }) {
  const dialogs = useDialogs();
  const update = useUpdateHabit();
  const archived = Boolean(habit.archivedAt);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Acciones de ${habit.name}`}
      >
        <Ellipsis className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => dialogs.openHabitForm(habit)}>
          <Pencil /> Editar
        </DropdownMenuItem>
        {!archived && (
          <DropdownMenuItem
            onSelect={() =>
              update.mutate(
                { id: habit.id, patch: { isActive: !habit.isActive } },
                { onSuccess: () => toast.success(habit.isActive ? "Hábito pausado" : "Hábito activado") },
              )
            }
          >
            {habit.isActive ? <Pause /> : <Play />} {habit.isActive ? "Pausar" : "Activar"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() =>
            update.mutate(
              { id: habit.id, patch: { archivedAt: archived ? null : new Date().toISOString() } },
              { onSuccess: () => toast.success(archived ? "Hábito restaurado" : "Hábito archivado") },
            )
          }
        >
          {archived ? <ArchiveRestore /> : <Archive />} {archived ? "Restaurar" : "Archivar"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={onDelete}>
          <Trash /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HabitCard({ status, onDelete }: { status: HabitStatus; onDelete: () => void }) {
  const today = useToday();
  const sectionMap = useSectionMap();
  const { habit, streak, week, month, weekly, doneToday, checks } = status;
  const section = habit.sectionId ? sectionMap.get(habit.sectionId) : undefined;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <HabitCheckButton habit={habit} date={today} done={doneToday} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{habit.name}</p>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <span>{weekly ? `${weekly.done}/${weekly.target} esta semana` : frequencyLabel(habit)}</span>
            {section && <span>· {section.name}</span>}
            {habit.reminderTime && (
              <span className="inline-flex items-center gap-0.5">
                · <Bell className="size-3" /> {habit.reminderTime}
              </span>
            )}
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="inline-flex items-center gap-1 text-sm font-semibold">
            <Flame className={cn("size-4", streak.current > 0 ? "text-primary-text" : "text-muted-foreground")} />
            {streak.current}
          </p>
          <p className="text-[11px] text-muted-foreground">mejor {streak.best}</p>
        </div>
        <HabitActions habit={habit} onDelete={onDelete} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <HabitWeekStrip habit={habit} checks={checks} />
        <dl className="flex gap-4 text-xs">
          <div className="sm:hidden">
            <dt className="text-muted-foreground">Racha</dt>
            <dd className="font-semibold">
              {streakLabel(streak.current, streak.unit)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Semana</dt>
            <dd className="font-semibold tabular">{week.expected ? formatPercent(week.ratio) : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Mes</dt>
            <dd className="font-semibold tabular">{month.expected ? formatPercent(month.ratio) : "—"}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}

export function HabitsView() {
  const dialogs = useDialogs();
  const { data: all = [], isLoading } = useHabits();
  const { statuses, due, doneToday } = useHabitStatuses();
  const remove = useDeleteHabit();
  const reorder = useReorderHabits();
  const [toDelete, setToDelete] = useState<Habit | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  const [ordering, setOrdering] = useState(false);

  const paused = all.filter((h) => !h.archivedAt && !h.isActive);
  const archived = all.filter((h) => h.archivedAt);
  const ordered = all.filter((h) => !h.archivedAt);
  const weekRatio = statuses.reduce((a, s) => a + s.week.done, 0) / Math.max(1, statuses.reduce((a, s) => a + s.week.expected, 0));
  const monthRatio = statuses.reduce((a, s) => a + s.month.done, 0) / Math.max(1, statuses.reduce((a, s) => a + s.month.expected, 0));

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return;
    const ids = ordered.map((h) => h.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate([...ids, ...archived.map((h) => h.id)]);
  };

  return (
    <div>
      <PageHeader
        title="Hábitos"
        description="Lo que querés hacer seguido. Se marcan como hechos; no miden tiempo."
        actions={
          <>
            {ordered.length > 1 && (
              <Button variant={ordering ? "soft" : "outline"} onClick={() => setOrdering((o) => !o)}>
                <ArrowUpDown /> {ordering ? "Listo" : "Ordenar"}
              </Button>
            )}
            <Button onClick={() => dialogs.openHabitForm()}>
              <Plus /> Nuevo hábito
            </Button>
          </>
        }
      />

      {statuses.length > 0 && !ordering && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "Hoy", value: due.length ? `${doneToday}/${due.length}` : "—" },
            { label: "Esta semana", value: formatPercent(weekRatio) },
            { label: "Este mes", value: formatPercent(monthRatio) },
          ].map((t) => (
            <Card key={t.label} className="p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">{t.label}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight tabular">{t.value}</p>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : ordered.length === 0 ? (
        <Card>
          <EmptyState
            icon={ListChecks}
            title="Creá tu primer hábito"
            description="Meditar, leer, entrenar, tomar agua… algo chico que quieras sostener todos los días o algunas veces por semana."
            action={
              <Button onClick={() => dialogs.openHabitForm()}>
                <Plus /> Nuevo hábito
              </Button>
            }
          />
        </Card>
      ) : ordering ? (
        <Card className="divide-y divide-border">
          {ordered.map((h, i) => (
            <div key={h.id} className="flex items-center gap-3 px-4 py-3">
              <SectionAvatar section={h} size="sm" />
              <p className="flex-1 truncate text-sm font-medium">{h.name}</p>
              <Button variant="ghost" size="icon" aria-label={`Subir ${h.name}`} disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Bajar ${h.name}`} disabled={i === ordered.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown />
              </Button>
            </div>
          ))}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {statuses.map((s) => (
            <HabitCard key={s.habit.id} status={s} onDelete={() => setToDelete(s.habit)} />
          ))}
        </div>
      )}

      {(paused.length > 0 || archived.length > 0) && !ordering && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowOthers((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            aria-expanded={showOthers}
          >
            <ChevronDown className={cn("size-4 transition-transform", !showOthers && "-rotate-90")} />
            Pausados y archivados ({paused.length + archived.length})
          </button>
          {showOthers && (
            <Card className="mt-3 divide-y divide-border animate-fade-in">
              {[...paused, ...archived].map((h) => (
                <div key={h.id} className="flex items-center gap-3 px-5 py-3">
                  <SectionAvatar section={h} size="sm" className="opacity-60" />
                  <p className="flex-1 truncate text-sm font-medium">{h.name}</p>
                  <Badge>{h.archivedAt ? "Archivado" : "Pausado"}</Badge>
                  <HabitActions habit={h} onDelete={() => setToDelete(h)} />
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`¿Eliminar "${toDelete?.name}"?`}
        description="Se borran el hábito y todo su historial. Si solo querés dejar de verlo, pausalo o archivalo."
        confirmLabel="Eliminar hábito"
        destructive
        onConfirm={async () => {
          if (!toDelete) return;
          await remove.mutateAsync(toDelete.id);
          toast.success("Hábito eliminado");
        }}
      />
    </div>
  );
}
