"use client";

import { TimerIllustration } from "@/components/brand/illustrations";
import { Play, Plus, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useDailyTotals, useInfiniteActivities, useSections, useToday, useWeekStart } from "@/hooks/use-data";
import { useDebounced } from "@/hooks/use-debounced";
import { type DateKey, type DateRange, addDaysKey, addMonthsKey, monthRange, relativeDayLabel, weekRange } from "@/lib/dates";
import { NO_SECTION_KEY, sumInRange } from "@/lib/domain/stats";
import { formatDuration } from "@/lib/format";
import type { Activity } from "@/lib/types";
import { cn, pluralize } from "@/lib/utils";
import { ActivityItem } from "./activity-item";

type RangeKey = "all" | "today" | "week" | "7d" | "30d" | "month" | "last-month";

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "all", label: "Todo el tiempo" },
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "month", label: "Este mes" },
  { value: "last-month", label: "Mes pasado" },
];

function resolveRange(key: RangeKey, today: DateKey, weekStartsOn: 0 | 1): Partial<DateRange> {
  switch (key) {
    case "today":
      return { from: today, to: today };
    case "week":
      return weekRange(today, weekStartsOn);
    case "7d":
      return { from: addDaysKey(today, -6), to: today };
    case "30d":
      return { from: addDaysKey(today, -29), to: today };
    case "month":
      return monthRange(today);
    case "last-month":
      return monthRange(addMonthsKey(monthRange(today).from, -1));
    default:
      return {};
  }
}

export function ActivitiesView({ initialSection }: { initialSection?: string }) {
  const today = useToday();
  const weekStartsOn = useWeekStart();
  const dialogs = useDialogs();
  const { data: sections = [] } = useSections();
  const totals = useDailyTotals();
  const [search, setSearch] = useState("");
  const [section, setSection] = useState<string>(initialSection ?? "all");
  const [rangeKey, setRangeKey] = useState<RangeKey>("all");
  const debouncedSearch = useDebounced(search.trim(), 300);

  const range = resolveRange(rangeKey, today, weekStartsOn);
  const sectionFilter = section === "all" ? undefined : section === NO_SECTION_KEY ? null : section;
  const query = useInfiniteActivities({ ...range, sectionId: sectionFilter, search: debouncedSearch || undefined });

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const groups = useMemo(() => {
    const map = new Map<DateKey, Activity[]>();
    for (const a of items) map.set(a.date, [...(map.get(a.date) ?? []), a]);
    return [...map.entries()];
  }, [items]);

  // Sin búsqueda de texto, el total exacto sale de los agregados diarios.
  const summary = !debouncedSearch
    ? sumInRange(totals.data ?? [], { from: range.from ?? "0000-01-01", to: range.to ?? "9999-12-31" }, sectionFilter)
    : null;
  const filtered = Boolean(debouncedSearch) || section !== "all" || rangeKey !== "all";
  const activeSections = sections.filter((s) => !s.archivedAt);
  const archivedSections = sections.filter((s) => s.archivedAt);

  return (
    <div>
      <PageHeader
        title="Historial"
        description="Todo lo que registraste, día por día."
        actions={
          <Button onClick={() => dialogs.openActivityForm()}>
            <Plus /> Registrar actividad
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_200px_200px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o notas…"
            className="pl-10"
            aria-label="Buscar actividades"
            type="search"
          />
        </div>
        <Select value={section} onChange={(e) => setSection(e.target.value)} aria-label="Filtrar por área">
          <option value="all">Todas las áreas</option>
          {activeSections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          {archivedSections.length > 0 && (
            <optgroup label="Archivadas">
              {archivedSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          )}
          <option value={NO_SECTION_KEY}>Sin área</option>
        </Select>
        <Select value={rangeKey} onChange={(e) => setRangeKey(e.target.value as RangeKey)} aria-label="Rango de fechas">
          {RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {summary && summary.count > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{summary.count}</span> {pluralize(summary.count, "actividad", "actividades")} ·{" "}
          <span className="font-medium text-foreground">{formatDuration(summary.seconds)}</span> en total
        </p>
      )}

      {query.isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </Card>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card>
          {filtered ? (
            <EmptyState
              icon={SearchX}
              title="Sin resultados"
              description="No hay actividades que coincidan con los filtros. Probá con otros."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setSection("all");
                    setRangeKey("all");
                  }}
                >
                  Limpiar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              illustration={<TimerIllustration />}
              title="No tenés actividades todavía"
              description="Empezá con una sesión de 10 minutos. Tu primera racha empieza hoy."
              action={
                <>
                  <Button variant="gradient" size="lg" onClick={() => dialogs.openStartTimer()}>
                    <Play className="fill-current" /> Empezar
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => dialogs.openActivityForm()}>
                    <Plus /> Registrar actividad
                  </Button>
                </>
              }
            />
          )}
        </Card>
      ) : (
        <div className={cn("space-y-4 transition-opacity", query.isFetching && !query.isFetchingNextPage && "opacity-60")}>
          {groups.map(([date, list]) => (
            <Card key={date} className="px-5 py-2">
              <div className="flex items-center justify-between border-b border-border py-3">
                <h2 className="text-sm font-semibold">{relativeDayLabel(date, today)}</h2>
                <span className="text-xs text-muted-foreground">
                  {list.length} · <span className="font-medium text-foreground">{formatDuration(list.reduce((a, x) => a + x.durationSeconds, 0))}</span>
                </span>
              </div>
              <div className="divide-y divide-border">
                {list.map((a) => (
                  <ActivityItem key={a.id} activity={a} />
                ))}
              </div>
            </Card>
          ))}
          {query.hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => query.fetchNextPage()} loading={query.isFetchingNextPage}>
                Cargar más
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
