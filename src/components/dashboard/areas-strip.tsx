"use client";

import { ArrowRight, Play, Plus } from "lucide-react";
import Link from "next/link";
import { BookIllustration } from "@/components/brand/illustrations";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { SectionTitle } from "@/components/layout/page-header";
import { SectionAvatar } from "@/components/sections/section-visuals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, Progress, Skeleton } from "@/components/ui/misc";
import { useActiveSections } from "@/hooks/use-data";
import { useGoalProgress } from "@/hooks/use-metrics";
import { formatTarget } from "@/lib/domain/metrics";
import { formatDuration } from "@/lib/format";
import { sectionColor } from "@/lib/sections";
import type { Section } from "@/lib/types";

function AreaTile({ section }: { section: Section }) {
  const dialogs = useDialogs();
  const daily = useGoalProgress("daily", section.id, "time");
  const weekly = useGoalProgress("weekly", section.id, "time");
  const goal = daily.target > 0 ? daily : weekly.target > 0 ? weekly : null;
  const color = sectionColor(section.color);

  return (
    <div className="lift relative flex w-[78%] shrink-0 snap-start flex-col rounded-3xl border border-border bg-card p-4 shadow-card sm:w-auto">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/sections/${section.id}`} className="flex min-w-0 items-center gap-3 after:absolute after:inset-0 after:rounded-3xl">
          <SectionAvatar section={section} size="md" />
          <span className="truncate text-[15px] font-semibold">{section.name}</span>
        </Link>
        <Button
          variant="soft"
          size="icon"
          className="relative z-10 shrink-0 rounded-full"
          aria-label={`Empezar una sesión de ${section.name}`}
          onClick={() => dialogs.openStartTimer(section.id)}
        >
          <Play className="fill-current" />
        </Button>
      </div>
      <p className="mt-4 font-display text-[28px] font-semibold leading-none tabular">{formatDuration(daily.progress.done)}</p>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {goal
          ? goal.progress.completed
            ? "Objetivo cumplido"
            : `de ${formatTarget("time", goal.target)} ${daily.target > 0 ? "hoy" : "esta semana"}`
          : `hoy · ${formatDuration(weekly.progress.done)} esta semana`}
      </p>
      {goal && <Progress value={goal.progress.ratio} color={goal.progress.completed ? "var(--success)" : color} className="mt-3 h-1.5" />}
    </div>
  );
}

/** Tus áreas, con el tiempo de hoy y un botón para empezar en un toque. */
export function AreasStrip({ className }: { className?: string }) {
  const { active, isLoading } = useActiveSections();
  const dialogs = useDialogs();

  return (
    <section data-tour="areas" className={className} aria-label="Áreas">
      <SectionTitle
        title="Áreas"
        action={
          <Link href="/sections" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
            Ver todas <ArrowRight className="size-3.5" />
          </Link>
        }
      />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Skeleton className="h-36 rounded-3xl" />
          <Skeleton className="h-36 rounded-3xl" />
        </div>
      ) : active.length === 0 ? (
        <Card>
          <EmptyState
            compact
            illustration={<BookIllustration />}
            title="Creá tu primera área"
            description="Programación, Inglés, Gimnasio, Lectura… lo que quieras hacer crecer, con su color y su objetivo."
            action={
              <Button onClick={() => dialogs.openSectionForm()}>
                <Plus /> Nueva área
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:scroll-px-0 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-3">
          {active.map((s) => (
            <AreaTile key={s.id} section={s} />
          ))}
          <button
            type="button"
            onClick={() => dialogs.openSectionForm()}
            className="flex w-[60%] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border p-4 text-sm font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary-text sm:w-auto"
          >
            <Plus className="size-5" /> Nueva área
          </button>
        </div>
      )}
    </section>
  );
}
