"use client";

import { FolderPlus, ListChecks, NotebookPen, Play, Target, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTimerState } from "@/hooks/use-timer";
import { formatClock } from "@/lib/format";
import type { Habit, Section } from "@/lib/types";
import { type ActivityFormOptions, ActivityFormDialog } from "./activity-form-dialog";
import { type GoalDialogOptions, GoalDialog } from "./goal-dialog";
import { HabitFormDialog } from "./habit-form-dialog";
import { SectionFormDialog } from "./section-form-dialog";
import { FinishTimerDialog, StartTimerDialog } from "./timer-dialogs";

interface DialogsContextValue {
  openActivityForm: (options?: ActivityFormOptions) => void;
  openStartTimer: (sectionId?: string | null) => void;
  openFinishTimer: () => void;
  openSectionForm: (section?: Section) => void;
  openGoalDialog: (options: GoalDialogOptions) => void;
  openHabitForm: (habit?: Habit) => void;
  openQuickAdd: () => void;
}

const DialogsContext = createContext<DialogsContextValue | null>(null);

type State =
  | { type: "activity"; options: ActivityFormOptions }
  | { type: "start-timer"; sectionId?: string | null }
  | { type: "finish-timer" }
  | { type: "section"; section?: Section }
  | { type: "goal"; options: GoalDialogOptions }
  | { type: "habit"; habit?: Habit }
  | { type: "quick-add" }
  | null;

/**
 * Centraliza los diálogos globales para poder abrirlos desde cualquier lugar
 * (Hoy, barra móvil, calendario…) sin duplicar estado.
 */
export function DialogsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<State>(null);
  // Se conserva el último estado para que el contenido no "desaparezca"
  // durante la animación de cierre.
  const [last, setLast] = useState<Exclude<State, null>>({ type: "quick-add" });

  const open = useCallback((next: Exclude<State, null>) => {
    setLast(next);
    setState(next);
  }, []);
  const close = useCallback(() => setState(null), []);

  const value = useMemo<DialogsContextValue>(
    () => ({
      openActivityForm: (options = {}) => open({ type: "activity", options }),
      openStartTimer: (sectionId) => open({ type: "start-timer", sectionId }),
      openFinishTimer: () => open({ type: "finish-timer" }),
      openSectionForm: (section) => open({ type: "section", section }),
      openGoalDialog: (options) => open({ type: "goal", options }),
      openHabitForm: (habit) => open({ type: "habit", habit }),
      openQuickAdd: () => open({ type: "quick-add" }),
    }),
    [open],
  );

  const isOpen = (type: Exclude<State, null>["type"]) => state?.type === type;
  const onOpenChange = (o: boolean) => !o && close();

  return (
    <DialogsContext.Provider value={value}>
      {children}
      <ActivityFormDialog
        open={isOpen("activity")}
        onOpenChange={onOpenChange}
        options={last.type === "activity" ? last.options : {}}
      />
      <StartTimerDialog
        open={isOpen("start-timer")}
        onOpenChange={onOpenChange}
        sectionId={last.type === "start-timer" ? last.sectionId : undefined}
      />
      <FinishTimerDialog open={isOpen("finish-timer")} onOpenChange={onOpenChange} />
      <SectionFormDialog
        open={isOpen("section")}
        onOpenChange={onOpenChange}
        section={last.type === "section" ? last.section : undefined}
        onCreated={(s) => router.push(`/sections/${s.id}`)}
      />
      <GoalDialog
        open={isOpen("goal")}
        onOpenChange={onOpenChange}
        options={last.type === "goal" ? last.options : { sectionId: null }}
      />
      <HabitFormDialog open={isOpen("habit")} onOpenChange={onOpenChange} habit={last.type === "habit" ? last.habit : undefined} />
      <QuickAddDialog open={isOpen("quick-add")} onOpenChange={onOpenChange} actions={value} />
    </DialogsContext.Provider>
  );
}

export function useDialogs() {
  const ctx = useContext(DialogsContext);
  if (!ctx) throw new Error("useDialogs debe usarse dentro de <DialogsProvider>");
  return ctx;
}

function QuickAddDialog({
  open,
  onOpenChange,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: DialogsContextValue;
}) {
  const { timer, elapsed, running } = useTimerState();
  const items = [
    timer
      ? {
          icon: Timer,
          title: running ? "Temporizador en curso" : "Temporizador en pausa",
          description: `${formatClock(elapsed)} · Tocá para guardar la sesión`,
          onClick: actions.openFinishTimer,
          accent: true,
        }
      : {
          icon: Play,
          title: "Iniciar temporizador",
          description: "Medí el tiempo mientras trabajás",
          onClick: () => actions.openStartTimer(),
          accent: true,
        },
    {
      icon: NotebookPen,
      title: "Registrar actividad",
      description: "Tiempo, páginas, km o repeticiones",
      onClick: () => actions.openActivityForm(),
    },
    {
      icon: Target,
      title: "Nuevo objetivo",
      description: "Diario, semanal o mensual",
      onClick: () => actions.openGoalDialog({ sectionId: null }),
    },
    {
      icon: ListChecks,
      title: "Nuevo hábito",
      description: "Algo para marcar como hecho",
      onClick: () => actions.openHabitForm(),
    },
    {
      icon: FolderPlus,
      title: "Nueva área",
      description: "Un área que quieras medir",
      onClick: () => actions.openSectionForm(),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="¿Qué querés hacer?" size="sm">
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={item.onClick}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-border bg-card p-3 text-left transition hover:bg-muted active:scale-[0.99]"
            >
              <span
                className={
                  item.accent
                    ? "flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"
                    : "flex size-11 items-center justify-center rounded-xl bg-muted text-foreground"
                }
              >
                <item.icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{item.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
