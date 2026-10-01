"use client";

import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Ellipsis,
  Flame,
  Layers,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { PageHeader } from "@/components/layout/page-header";
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
import { useDailyTotals, useDeleteSection, useReorderSections, useSections, useUpdateSection } from "@/hooks/use-data";
import { useGoalProgress, useStreaks } from "@/hooks/use-metrics";
import { sumInRange } from "@/lib/domain/stats";
import { formatDuration, formatMinutes } from "@/lib/format";
import { sectionColor } from "@/lib/sections";
import type { Section } from "@/lib/types";
import { cn, pluralize } from "@/lib/utils";
import { SectionAvatar } from "./section-visuals";

function SectionActions({ section, onDelete }: { section: Section; onDelete: () => void }) {
  const dialogs = useDialogs();
  const update = useUpdateSection();
  const archived = Boolean(section.archivedAt);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Acciones de ${section.name}`}
      >
        <Ellipsis className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => dialogs.openSectionForm(section)}>
          <Pencil /> Editar
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => dialogs.openGoalDialog({ sectionId: section.id })}>
          <Plus /> Nuevo objetivo
        </DropdownMenuItem>
        {!archived && (
          <DropdownMenuItem
            onSelect={() =>
              update.mutate(
                { id: section.id, patch: { isActive: !section.isActive } },
                { onSuccess: () => toast.success(section.isActive ? "Sección pausada" : "Sección activada") },
              )
            }
          >
            {section.isActive ? <Pause /> : <Play />} {section.isActive ? "Pausar" : "Activar"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() =>
            update.mutate(
              { id: section.id, patch: { archivedAt: archived ? null : new Date().toISOString() } },
              { onSuccess: () => toast.success(archived ? "Sección restaurada" : "Sección archivada") },
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

function SectionCard({ section, onDelete }: { section: Section; onDelete: () => void }) {
  const totals = useDailyTotals();
  const daily = useGoalProgress("daily", section.id, "time");
  const weekly = useGoalProgress("weekly", section.id, "time");
  const streaks = useStreaks(section.id);
  const all = sumInRange(totals.data ?? [], { from: "0000-01-01", to: "9999-12-31" }, section.id);
  const goal = daily.target ? daily : weekly.target ? weekly : null;

  return (
    <Card className={cn("group relative flex flex-col p-5 transition hover:shadow-elevated", !section.isActive && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <Link href={`/sections/${section.id}`} className="flex min-w-0 items-center gap-3 after:absolute after:inset-0 after:rounded-2xl">
          <SectionAvatar section={section} size="lg" />
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 truncate font-semibold tracking-tight">
              {section.name}
              {!section.isActive && <Badge>Pausada</Badge>}
            </h3>
            <p className="truncate text-xs text-muted-foreground">{section.description || "Sin descripción"}</p>
          </div>
        </Link>
        <div className="relative z-10">
          <SectionActions section={section} onDelete={onDelete} />
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Hoy", value: formatDuration(daily.progress.done) },
          { label: "Semana", value: formatDuration(weekly.progress.done) },
          { label: "Total", value: formatDuration(all.seconds) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-muted/60 px-2 py-2.5">
            <dt className="text-[11px] text-muted-foreground">{s.label}</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Flame className={cn("size-3.5", streaks.current > 0 && "text-primary-text")} />
          Racha: <b className="font-semibold text-foreground">{streaks.current}</b> {pluralize(streaks.current, "día")}
        </span>
        {goal && (
          <span className="text-muted-foreground">
            {goal.progress.completed ? "✓ Objetivo cumplido" : `Objetivo ${formatMinutes(goal.target)}${daily.target ? "/día" : "/sem"}`}
          </span>
        )}
      </div>
      {goal && (
        <Progress
          className="mt-2 h-1.5"
          value={goal.progress.ratio}
          color={goal.progress.completed ? "var(--success)" : sectionColor(section.color)}
        />
      )}
    </Card>
  );
}

export function SectionsView() {
  const { data: sections = [], isLoading } = useSections();
  const dialogs = useDialogs();
  const remove = useDeleteSection();
  const reorder = useReorderSections();
  const [toDelete, setToDelete] = useState<Section | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const current = sections.filter((s) => !s.archivedAt);
  const archived = sections.filter((s) => s.archivedAt);

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= current.length) return;
    const ids = current.map((s) => s.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate([...ids, ...archived.map((s) => s.id)]);
  };

  return (
    <div>
      <PageHeader
        title="Secciones"
        description="Las áreas de tu vida que querés medir. Nombre, ícono, color y objetivos: todo lo definís vos."
        actions={
          <>
            {current.length > 1 && (
              <Button variant={ordering ? "soft" : "outline"} onClick={() => setOrdering((o) => !o)}>
                <ArrowUpDown /> {ordering ? "Listo" : "Ordenar"}
              </Button>
            )}
            <Button onClick={() => dialogs.openSectionForm()}>
              <Plus /> Nueva sección
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : current.length === 0 ? (
        <Card>
          <EmptyState
            icon={Layers}
            title="Creá tu primera sección"
            description="Estudio, Trabajo, Gimnasio, Meditación… cualquier área que quieras mejorar."
            action={
              <Button onClick={() => dialogs.openSectionForm()}>
                <Plus /> Nueva sección
              </Button>
            }
          />
        </Card>
      ) : ordering ? (
        <Card className="divide-y divide-border">
          {current.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <SectionAvatar section={s} size="sm" />
              <p className="flex-1 truncate text-sm font-medium">
                {s.name} {!s.isActive && <Badge>Pausada</Badge>}
              </p>
              <Button variant="ghost" size="icon" aria-label={`Subir ${s.name}`} disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Bajar ${s.name}`} disabled={i === current.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown />
              </Button>
            </div>
          ))}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {current.map((s) => (
            <SectionCard key={s.id} section={s} onDelete={() => setToDelete(s)} />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            aria-expanded={showArchived}
          >
            <ChevronDown className={cn("size-4 transition-transform", !showArchived && "-rotate-90")} />
            Archivadas ({archived.length})
          </button>
          {showArchived && (
            <Card className="mt-3 divide-y divide-border animate-fade-in">
              {archived.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <SectionAvatar section={s} size="sm" className="opacity-60" />
                  <Link href={`/sections/${s.id}`} className="flex-1 truncate text-sm font-medium hover:underline">
                    {s.name}
                  </Link>
                  <SectionActions section={s} onDelete={() => setToDelete(s)} />
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
        description="Se borran la sección y sus objetivos. Tus actividades y hábitos se conservan sin sección. Si solo querés ocultarla, archivala o pausala."
        confirmLabel="Eliminar sección"
        destructive
        onConfirm={async () => {
          if (!toDelete) return;
          await remove.mutateAsync(toDelete.id);
          toast.success("Sección eliminada");
        }}
      />
    </div>
  );
}
