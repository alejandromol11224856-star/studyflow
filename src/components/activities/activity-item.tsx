"use client";

import { Ellipsis, Pencil, Timer, Trash } from "lucide-react";
import { toast } from "sonner";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { SectionAvatar } from "@/components/sections/section-visuals";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreateActivity, useDeleteActivity, useSectionMap, useTimeZone } from "@/hooks/use-data";
import { timeInTimeZone } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import { formatActivityMeasures } from "@/components/ui/measures-input";
import type { Activity } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Borrado con opción de deshacer desde el toast. */
export function useDeleteWithUndo() {
  const remove = useDeleteActivity();
  const create = useCreateActivity();
  return async (activity: Activity) => {
    try {
      await remove.mutateAsync(activity);
      toast("Actividad eliminada", {
        description: activity.title,
        duration: 8000,
        action: {
          label: "Deshacer",
          onClick: () =>
            create.mutate(
              {
                sectionId: activity.sectionId,
                title: activity.title,
                notes: activity.notes,
                date: activity.date,
                startedAt: activity.startedAt,
                durationSeconds: activity.durationSeconds,
                pages: activity.pages,
                distanceKm: activity.distanceKm,
                reps: activity.reps,
                source: activity.source,
              },
              { onSuccess: () => toast.success("Actividad restaurada") },
            ),
        },
      });
    } catch {
      // El aviso de error lo muestra el MutationCache global.
    }
  };
}

export function ActivityItem({ activity, className }: { activity: Activity; className?: string }) {
  const sectionMap = useSectionMap();
  const timeZone = useTimeZone();
  const dialogs = useDialogs();
  const deleteWithUndo = useDeleteWithUndo();
  const section = activity.sectionId ? sectionMap.get(activity.sectionId) : undefined;
  const time = activity.startedAt ? timeInTimeZone(activity.startedAt, timeZone) : null;
  const measures = formatActivityMeasures(activity);

  return (
    <div className={cn("group flex items-start gap-3 py-3", className)}>
      <SectionAvatar section={section} size="sm" className="mt-0.5" />
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => dialogs.openActivityForm({ activity })}
        aria-label={`Editar ${activity.title}`}
      >
        <p className="truncate text-sm font-medium">{activity.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          <span>{section?.name ?? "Sin sección"}</span>
          {time && (
            <>
              <span aria-hidden>·</span>
              <span className="tabular">{time}</span>
            </>
          )}
          {activity.source === "timer" && (
            <span className="inline-flex items-center gap-0.5" title="Registrado con el temporizador">
              <span aria-hidden>·</span>
              <Timer className="size-3" /> temporizador
            </span>
          )}
        </p>
        {measures && activity.durationSeconds > 0 && <p className="mt-0.5 text-xs font-medium text-muted-foreground">{measures}</p>}
        {activity.notes && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/90">{activity.notes}</p>}
      </button>
      <span className="mt-0.5 shrink-0 text-sm font-semibold tabular">
        {activity.durationSeconds > 0 ? formatDuration(activity.durationSeconds) : measures}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Acciones"
        >
          <Ellipsis className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => dialogs.openActivityForm({ activity })}>
            <Pencil /> Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => void deleteWithUndo(activity)}>
            <Trash /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
