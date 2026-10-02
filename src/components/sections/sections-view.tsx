"use client";

import { SproutIllustration } from "@/components/brand/illustrations";
import { StreakMark } from "@/components/brand/marks";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
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
                { onSuccess: () => toast.success(section.isActive ? "Área pausada" : "Área activada") },
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
              { onSuccess: () => toast.success(archived ? "Área restaurada" : "Área archivada") },
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
    <Card className={cn("group relative flex flex-col p-5 transition hover:shadow-elevated sm:p-6", !section.isActive && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <Link href={`/sections/${section.id}`} className="flex min-w-0 items-center gap-3 after:absolute after:inset-0 after:rounded-3xl">
          <SectionAvatar section={section} size="lg" />
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="truncate">{section.name}</span>
              {!section.isActive && <Badge>Pausada</Badge>}
            </h3>
            {/* La descripción solo si existe: sin textos de relleno. */}
            {section.description && <p className="truncate text-xs text-muted-foreground">{section.description}</p>}
          </div>
        </Link>
        <div className="relative z-10 -mr-2">
          <SectionActions section={section} onDelete={onDelete} />
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3">
        {[
          { label: "Hoy", value: formatDuration(daily.progress.done) },
          { label: "Semana", value: formatDuration(weekly.progress.done) },
          { label: "Total", value: formatDuration(all.seconds) },
        ].map((s) => (
          <div key={s.label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="mt-0.5 truncate font-display text-xl font-semibold tabular" title={s.value}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 text-xs">
        <span className={cn("inline-flex items-center gap-1.5 font-semibold", streaks.current > 0 ? "text-streak-text" : "text-muted-foreground")}>
          <StreakMark className="size-4" />
          {streaks.current > 0 ? `${streaks.current} ${pluralize(streaks.current, "día")} ${pluralize(streaks.current, "seguido")}` : "Sin racha todavía"}
        </span>
        {goal && (
          <span className={cn("inline-flex items-center gap-1 truncate", goal.progress.completed ? "font-semibold text-success" : "text-muted-foreground")}>
            {goal.progress.completed ? (
              <>
                <Check className="size-3.5" aria-hidden /> Objetivo cumplido
              </>
            ) : (
              `Objetivo ${formatMinutes(goal.target)}${daily.target ? " por día" : " por semana"}`
            )}
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
    <div className="space-y-10">
      <PageHeader
        eyebrow="Lo que medís"
        title="Áreas"
        description="Las áreas de tu vida que querés medir. Nombre, ícono, color y objetivos: todo lo definís vos."
        actions={
          <>
            {current.length > 1 && (
              <Button variant={ordering ? "soft" : "outline"} onClick={() => setOrdering((o) => !o)}>
                <ArrowUpDown /> {ordering ? "Listo" : "Ordenar"}
              </Button>
            )}
            <Button variant="gradient" onClick={() => dialogs.openSectionForm()}>
              <Plus /> Nueva área
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
        <EmptyState
          illustration={<SproutIllustration />}
          title="Creá tu primera área"
          description="Programación, Gym, Inglés, Lectura… cualquier área que quieras mejorar, con su ícono, color y objetivo."
          action={
            <Button variant="gradient" size="lg" onClick={() => dialogs.openSectionForm()}>
              <Plus /> Nueva área
            </Button>
          }
        />
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
        <div>
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="flex h-10 items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            aria-expanded={showArchived}
          >
            <ChevronDown className={cn("size-4 transition-transform", !showArchived && "-rotate-90")} />
            Archivadas ({archived.length})
          </button>
          {showArchived && (
            <Card className="mt-2 divide-y divide-border animate-fade-in">
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
        description="Se borran el área y sus objetivos. Tus actividades y hábitos se conservan sin área. Si solo querés ocultarla, archivala o pausala."
        confirmLabel="Eliminar área"
        destructive
        onConfirm={async () => {
          if (!toDelete) return;
          await remove.mutateAsync(toDelete.id);
          toast.success("Área eliminada");
        }}
      />
    </div>
  );
}
