"use client";

import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Bell,
  CalendarCheck,
  ChevronDown,
  Ellipsis,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ChainIllustration } from "@/components/brand/illustrations";
import { StreakMark } from "@/components/brand/marks";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { StatTile } from "@/components/gamification/chips";
import { PageHeader, SectionTitle } from "@/components/layout/page-header";
import { MethodIcon } from "@/components/methods/methods-view";
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
import { Badge, EmptyState, Progress, Skeleton } from "@/components/ui/misc";
import { useDeleteHabit, useHabits, useReorderHabits, useSectionMap, useToday, useUpdateHabit } from "@/hooks/use-data";
import { type HabitStatus, useHabitStatuses } from "@/hooks/use-metrics";
import { frequencyLabel, streakLabel } from "@/lib/domain/habits";
import { formatPercent } from "@/lib/format";
import { methodBySlug } from "@/lib/methods";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { HabitCheckButton, HabitHistory, HabitWeekStrip } from "./habit-visuals";

const HABIT_METHODS = ["two-minute-rule", "habit-stacking", "dont-break-the-chain"] as const;

function HabitActions({ habit, onDelete }: { habit: Habit; onDelete: () => void }) {
  const dialogs = useDialogs();
  const update = useUpdateHabit();
  const archived = Boolean(habit.archivedAt);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
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

function HabitRow({ status, onDelete }: { status: HabitStatus; onDelete: () => void }) {
  const today = useToday();
  const sectionMap = useSectionMap();
  const [open, setOpen] = useState(false);
  const { habit, streak, week, month, weekly, doneToday, checks } = status;
  const section = habit.sectionId ? sectionMap.get(habit.sectionId) : undefined;

  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex items-center gap-3">
        <HabitCheckButton habit={habit} date={today} done={doneToday} />
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-semibold", doneToday && "text-muted-foreground line-through decoration-2 decoration-foreground/20")}>{habit.name}</p>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <span>{weekly ? `${weekly.done} de ${weekly.target} esta semana` : frequencyLabel(habit)}</span>
            {section && <span>· {section.name}</span>}
            {habit.reminderTime && (
              <span className="inline-flex items-center gap-0.5">
                · <Bell className="size-3" aria-hidden /> {habit.reminderTime}
              </span>
            )}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-semibold tabular",
            streak.current > 0 ? "bg-streak-soft text-streak-text" : "bg-muted text-muted-foreground",
          )}
          title={`Racha: ${streakLabel(streak.current, streak.unit)} · mejor ${streakLabel(streak.best, streak.unit)}`}
        >
          <StreakMark className="size-3.5" />
          {streak.current}
          <span className="sr-only"> {streak.unit} seguidos</span>
        </span>
        <HabitActions habit={habit} onDelete={onDelete} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:pl-14">
        <HabitWeekStrip habit={habit} checks={checks} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          Historial
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-4 animate-fade-in sm:pl-14">
          <HabitHistory habit={habit} checks={checks} weeks={16} />
          <dl className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <dt className="text-muted-foreground">Esta semana</dt>
              <dd className="mt-0.5 font-display text-lg font-semibold tabular">{week.expected ? formatPercent(week.ratio) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Este mes</dt>
              <dd className="mt-0.5 font-display text-lg font-semibold tabular">{month.expected ? formatPercent(month.ratio) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Mejor racha</dt>
              <dd className="mt-0.5 font-display text-lg font-semibold tabular">{streakLabel(streak.best, streak.unit)}</dd>
            </div>
          </dl>
        </div>
      )}
    </li>
  );
}

function HabitMethods() {
  return (
    <section>
      <SectionTitle
        title="Para que se sostengan"
        hint="Tres ideas simples que ayudan."
        action={
          <Link href="/methods?tab=habits" className="text-sm font-semibold text-primary-text hover:underline">
            Ver métodos
          </Link>
        }
      />
      <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-3">
        {HABIT_METHODS.map((slug) => {
          const method = methodBySlug(slug);
          if (!method) return null;
          return (
            <li key={slug}>
              <Link href={`/methods/${slug}`} className="group flex items-center gap-3 rounded-2xl py-2.5 transition sm:flex-col sm:items-start sm:gap-2">
                <MethodIcon slug={slug} className="size-10 rounded-xl" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold group-hover:underline">{method.name}</span>
                  <span className="block text-xs text-muted-foreground">{method.tagline}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground sm:hidden" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
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
  const weekExpected = statuses.reduce((a, s) => a + s.week.expected, 0);
  const monthExpected = statuses.reduce((a, s) => a + s.month.expected, 0);
  const weekRatio = statuses.reduce((a, s) => a + s.week.done, 0) / Math.max(1, weekExpected);
  const monthRatio = statuses.reduce((a, s) => a + s.month.done, 0) / Math.max(1, monthExpected);
  const top = statuses.reduce<HabitStatus | null>((a, s) => (!a || s.streak.current > a.streak.current ? s : a), null);
  const allDone = due.length > 0 && doneToday === due.length;

  const description =
    statuses.length === 0
      ? "Lo que querés hacer seguido. Se marcan como hechos; no miden tiempo."
      : due.length === 0
        ? "Hoy no tenés hábitos programados."
        : allDone
          ? "Todos los de hoy, hechos. Un eslabón más."
          : `Te ${due.length - doneToday === 1 ? "falta" : "faltan"} ${due.length - doneToday} para cerrar el día.`;

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return;
    const ids = ordered.map((h) => h.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate([...ids, ...archived.map((h) => h.id)]);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <PageHeader
        eyebrow="Hábitos"
        title="Lo que repetís"
        description={description}
        actions={
          <>
            {ordered.length > 1 && (
              <Button variant={ordering ? "soft" : "outline"} onClick={() => setOrdering((o) => !o)}>
                <ArrowUpDown /> {ordering ? "Listo" : "Ordenar"}
              </Button>
            )}
            <Button variant="gradient" onClick={() => dialogs.openHabitForm()}>
              <Plus /> Nuevo hábito
            </Button>
          </>
        }
      />

      {statuses.length > 0 && !ordering && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
          <div className="col-span-2">
            <p className="text-[13px] font-semibold text-muted-foreground">Hoy</p>
            <p className="mt-1.5 font-display text-[30px] font-semibold leading-none tabular">
              {due.length ? `${doneToday} de ${due.length}` : "—"}
            </p>
            {due.length > 0 && <Progress className="mt-3 max-w-xs" value={doneToday / due.length} tone={allDone ? "success" : "primary"} label="Hábitos de hoy" />}
          </div>
          <StatTile
            icon={<StreakMark />}
            label="Racha más larga"
            value={top && top.streak.current > 0 ? streakLabel(top.streak.current, top.streak.unit) : "—"}
            hint={top && top.streak.current > 0 ? top.habit.name : "Marcá uno hoy para empezar"}
          />
          <StatTile
            icon={<CalendarCheck />}
            label="Constancia"
            value={weekExpected ? formatPercent(weekRatio) : "—"}
            hint={monthExpected ? `Esta semana · ${formatPercent(monthRatio)} en el mes` : "Esta semana"}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : ordered.length === 0 ? (
        <EmptyState
          illustration={<ChainIllustration />}
          title="Creá tu primer hábito"
          description="Meditar, leer, entrenar, tomar agua… algo chico que quieras sostener. Cada día que lo marques suma un eslabón."
          action={
            <Button variant="gradient" size="lg" onClick={() => dialogs.openHabitForm()}>
              <Plus /> Nuevo hábito
            </Button>
          }
        />
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
        <Card>
          <ul className="divide-y divide-border">
            {statuses.map((s) => (
              <HabitRow key={s.habit.id} status={s} onDelete={() => setToDelete(s.habit)} />
            ))}
          </ul>
        </Card>
      )}

      {(paused.length > 0 || archived.length > 0) && !ordering && (
        <div>
          <button
            type="button"
            onClick={() => setShowOthers((v) => !v)}
            className="flex h-10 items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            aria-expanded={showOthers}
          >
            <ChevronDown className={cn("size-4 transition-transform", !showOthers && "-rotate-90")} />
            Pausados y archivados ({paused.length + archived.length})
          </button>
          {showOthers && (
            <Card className="mt-2 divide-y divide-border animate-fade-in">
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

      {!ordering && <HabitMethods />}

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
