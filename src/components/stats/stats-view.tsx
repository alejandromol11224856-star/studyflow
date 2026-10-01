"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  ChartColumn,
  Clock,
  Flame,
  Gauge,
  ListChecks,
  Table2,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  ChartLegend,
  PERCENT_SCALE,
  StackedBarChart,
  TrendChart,
  countScale,
} from "@/components/charts/charts";
import { buildSectionSeries } from "@/components/charts/series";
import { StatTile } from "@/components/dashboard/stat-cards";
import { PageHeader } from "@/components/layout/page-header";
import { SectionAvatar } from "@/components/sections/section-visuals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, SegmentedControl, Skeleton } from "@/components/ui/misc";
import { useDailyTotals, useGoals, useHabitChecks, useHabits, useSections, useToday, useWeekStart } from "@/hooks/use-data";
import { useStreaks } from "@/hooks/use-metrics";
import {
  type DateKey,
  type DateRange,
  addDaysKey,
  capitalize,
  dateFromKey,
  eachDayKeys,
  formatKey,
  monthRange,
  weekRange,
} from "@/lib/dates";
import { checksByHabit, habitCompletion, isHabitVisible } from "@/lib/domain/habits";
import {
  type Bucket,
  NO_SECTION_KEY,
  type SeriesRow,
  activeDaysInRange,
  bestDayInRange,
  bucketFor,
  bucketedSeries,
  complianceByWeek,
  dailyGoalCompletion,
  firstActivityDate,
  sectionDistribution,
  sumInRange,
  weeklySeries,
} from "@/lib/domain/stats";
import { measuresByDate, streakSeries, totalsByDate } from "@/lib/domain/streaks";
import { formatDuration, formatPercent } from "@/lib/format";
import { sectionColor } from "@/lib/sections";
import { cn, pluralize } from "@/lib/utils";

type RangeKey = "7d" | "30d" | "90d" | "all";

const RANGES: { value: RangeKey; label: string; days?: number }[] = [
  { value: "7d", label: "7 días", days: 7 },
  { value: "30d", label: "30 días", days: 30 },
  { value: "90d", label: "90 días", days: 90 },
  { value: "all", label: "Todo" },
];

function rangesFor(key: RangeKey, today: DateKey, firstDate: DateKey | null): { current: DateRange; previous: DateRange | null } {
  const def = RANGES.find((r) => r.value === key)!;
  if (def.days) {
    const from = addDaysKey(today, -(def.days - 1));
    return { current: { from, to: today }, previous: { from: addDaysKey(from, -def.days), to: addDaysKey(from, -1) } };
  }
  const from = firstDate && firstDate < today ? firstDate : addDaysKey(today, -6);
  return { current: { from, to: today }, previous: null };
}

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const days = countScale((n) => `${n} ${n === 1 ? "día" : "días"}`);

function Delta({ value, suffix = "vs. período anterior" }: { value: number | null; suffix?: string }) {
  if (value === null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5", up ? "text-success" : "text-danger")}>
      {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
      {formatPercent(Math.abs(value))} {suffix}
    </span>
  );
}

export function StatsView() {
  const today = useToday();
  const weekStartsOn = useWeekStart();
  const totals = useDailyTotals();
  const goals = useGoals();
  const habits = useHabits();
  const checks = useHabitChecks();
  const { data: sections = [] } = useSections();
  const streaks = useStreaks();
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const [showTable, setShowTable] = useState(false);

  const data = useMemo(() => totals.data ?? [], [totals.data]);
  const { current, previous } = rangesFor(rangeKey, today, firstActivityDate(data));
  const byDate = useMemo(() => totalsByDate(data), [data]);
  const measures = useMemo(() => measuresByDate(data), [data]);
  const rangeTotals = data.filter((t) => t.date >= current.from && t.date <= current.to);
  const series = buildSectionSeries(sections, rangeTotals);
  const bucket: Bucket = bucketFor(current);
  const rows = bucketedSeries(data, current, bucket, weekStartsOn);

  const total = sumInRange(data, current);
  const prevTotal = previous ? sumInRange(data, previous).seconds : 0;
  const delta = previous && prevTotal > 0 ? (total.seconds - prevTotal) / prevTotal : null;
  const daysCount = eachDayKeys(current.from, current.to).length;
  const activeDays = activeDaysInRange(byDate, current);
  const completion = dailyGoalCompletion(measures, goals.data ?? [], current, today);
  const prevCompletion = previous ? dailyGoalCompletion(measures, goals.data ?? [], previous, today) : null;
  const best = bestDayInRange(byDate, current);
  const distribution = sectionDistribution(data, current);
  const prevDistribution = new Map((previous ? sectionDistribution(data, previous) : []).map((d) => [d.sectionId, d.seconds]));
  const maxShare = distribution[0]?.seconds ?? 0;
  const byId = new Map(sections.map((s) => [s.id, s]));

  // Promedio por día de la semana dentro del rango.
  const weekdaySums = Array.from({ length: 7 }, () => ({ seconds: 0, n: 0 }));
  for (const d of eachDayKeys(current.from, current.to)) {
    const w = dateFromKey(d).getDay();
    weekdaySums[w].seconds += byDate.get(d) ?? 0;
    weekdaySums[w].n += 1;
  }
  const weekdayOrder = weekStartsOn === 1 ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
  const weekdayRows: SeriesRow[] = weekdayOrder.map((w) => {
    const avg = weekdaySums[w].n ? Math.round(weekdaySums[w].seconds / weekdaySums[w].n) : 0;
    return { key: String(w), total: avg, avg };
  });

  const trendWeeks = rangeKey === "7d" || rangeKey === "30d" ? 12 : Math.max(12, Math.ceil(daysCount / 7));
  const trend = weeklySeries(byDate, today, Math.min(trendWeeks, 104), weekStartsOn);
  const compliance = complianceByWeek(measures, goals.data ?? [], current, today, weekStartsOn).filter((w) => w.withGoal > 0);
  const streakRows = streakSeries(streaks.completedDates, current.from, today);

  // Hábitos en el rango
  const byHabit = checksByHabit(checks.data ?? []);
  const habitRows = (habits.data ?? [])
    .filter((h) => isHabitVisible(h) || (byHabit.get(h.id)?.size ?? 0) > 0)
    .map((h) => ({ habit: h, ...habitCompletion(h, byHabit.get(h.id) ?? new Set(), current, today, weekStartsOn) }))
    .filter((r) => r.expected > 0)
    .sort((a, b) => b.ratio - a.ratio);
  const habitsOverall = habitRows.reduce((a, r) => a + r.done, 0) / Math.max(1, habitRows.reduce((a, r) => a + r.expected, 0));

  const xFormatter = (k: string) => {
    if (bucket === "month") return capitalize(formatKey(k, "MMM yy"));
    if (bucket === "week") return formatKey(k, "d MMM");
    if (rangeKey === "7d") return capitalize(formatKey(k, "EEEEEE"));
    return formatKey(k, rangeKey === "30d" ? "d" : "d MMM");
  };
  const tooltipLabel = (k: string) => {
    if (bucket === "month") return capitalize(formatKey(k, "MMMM yyyy"));
    if (bucket === "week") return `Semana del ${formatKey(k, "d 'de' MMMM")}`;
    return capitalize(formatKey(k, "EEEE d 'de' MMMM"));
  };
  const highlightKey = bucket === "month" ? monthRange(today).from : bucket === "week" ? weekRange(today, weekStartsOn).from : today;
  const chartTitle = bucket === "month" ? "Tiempo por mes" : bucket === "week" ? "Tiempo por semana" : "Tiempo por día";

  const loading = totals.isLoading;
  const empty = !loading && data.length === 0;

  return (
    <div>
      <PageHeader
        title="Estadísticas"
        description="En qué se va tu tiempo y cómo evoluciona tu constancia."
        actions={<SegmentedControl value={rangeKey} onChange={setRangeKey} options={RANGES.map((r) => ({ value: r.value, label: r.label }))} />}
      />

      {empty ? (
        <Card>
          <EmptyState icon={ChartColumn} title="Todavía no hay datos" description="Registrá algunas actividades y acá vas a ver gráficos de tu progreso." />
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatTile
              icon={Clock}
              label="Tiempo total"
              loading={loading}
              value={formatDuration(total.seconds)}
              hint={delta !== null ? <Delta value={delta} /> : `${total.count} ${pluralize(total.count, "actividad", "actividades")}`}
            />
            <StatTile
              icon={Gauge}
              label="Promedio diario"
              loading={loading}
              value={formatDuration(total.seconds / daysCount)}
              hint={activeDays ? `${formatDuration(total.seconds / activeDays)} por día activo` : "Sin días activos"}
            />
            <StatTile
              icon={CalendarCheck}
              label="Días activos"
              loading={loading}
              value={`${activeDays}/${daysCount}`}
              hint={`${formatPercent(activeDays / daysCount)} de los días`}
            />
            <StatTile
              icon={Target}
              label="Objetivo diario"
              loading={loading}
              value={completion.withGoal ? formatPercent(completion.ratio) : "—"}
              hint={
                completion.withGoal ? (
                  prevCompletion?.withGoal ? (
                    <span>
                      {completion.met}/{completion.withGoal} días ·{" "}
                      <span className={completion.ratio >= prevCompletion.ratio ? "text-success" : "text-danger"}>
                        {completion.ratio >= prevCompletion.ratio ? "+" : "−"}
                        {Math.round(Math.abs(completion.ratio - prevCompletion.ratio) * 100)} pts
                      </span>
                    </span>
                  ) : (
                    `Cumplido ${completion.met} de ${completion.withGoal} días`
                  )
                ) : (
                  "Sin objetivo en este período"
                )
              }
            />
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>{chartTitle}</CardTitle>
                <CardDescription>Desglosado por sección</CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setShowTable((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-pressed={showTable}
              >
                <Table2 className="size-3.5" /> {showTable ? "Ver gráfico" : "Ver tabla"}
              </button>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <Skeleton className="h-[260px]" />
              ) : showTable ? (
                <DataTable rows={rows} series={series} labelFor={tooltipLabel} />
              ) : (
                <>
                  <StackedBarChart
                    rows={rows}
                    series={series}
                    height={260}
                    highlightKey={highlightKey}
                    xFormatter={xFormatter}
                    tooltipLabel={tooltipLabel}
                  />
                  <ChartLegend series={series} className="mt-3" />
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-5">
              <CardHeader>
                <div>
                  <CardTitle>Por sección</CardTitle>
                  <CardDescription>{previous ? "Reparto del tiempo y cambio vs. el período anterior" : "Reparto del tiempo"}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {distribution.length === 0 ? (
                  <EmptyState compact icon={ChartColumn} title="Sin actividad en este período" />
                ) : (
                  <ul className="space-y-3.5">
                    {distribution.map((d) => {
                      const s = d.sectionId ? byId.get(d.sectionId) : undefined;
                      const prev = prevDistribution.get(d.sectionId) ?? 0;
                      const change = previous ? (prev > 0 ? (d.seconds - prev) / prev : null) : null;
                      return (
                        <li key={d.sectionId ?? NO_SECTION_KEY} className="flex items-center gap-3">
                          <SectionAvatar section={s} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2 text-sm">
                              <span className="truncate font-medium">{s?.name ?? "Sin sección"}</span>
                              <span className="shrink-0">
                                <b className="font-semibold">{formatDuration(d.seconds)}</b>{" "}
                                <span className="text-xs text-muted-foreground tabular">{formatPercent(d.seconds / total.seconds)}</span>
                              </span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full" style={{ width: `${(d.seconds / maxShare) * 100}%`, background: sectionColor(s?.color) }} />
                            </div>
                            {previous && (
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                {change === null ? "Nuevo en este período" : <Delta value={change} suffix="" />}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-7">
              <CardHeader>
                <div>
                  <CardTitle>Cumplimiento de objetivos</CardTitle>
                  <CardDescription>% de días con el objetivo diario general cumplido, por semana</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {compliance.length === 0 ? (
                  <EmptyState compact icon={Target} title="Sin objetivo diario en este período" description="Definí uno en Objetivos para ver tu cumplimiento." />
                ) : (
                  <StackedBarChart
                    rows={compliance.map((w) => ({ key: w.key, total: w.total, pct: w.total }))}
                    series={[{ key: "pct", name: "Cumplimiento", color: "var(--primary-text)" }]}
                    height={220}
                    scale={PERCENT_SCALE}
                    highlightKey={weekRange(today, weekStartsOn).from}
                    xFormatter={(k) => formatKey(k, "d MMM")}
                    tooltipLabel={(k) => {
                      const w = compliance.find((c) => c.key === k);
                      return `Semana del ${formatKey(k, "d 'de' MMMM")}${w ? ` · ${w.met} de ${w.withGoal} días` : ""}`;
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardHeader>
                <div>
                  <CardTitle>Evolución de la racha</CardTitle>
                  <CardDescription>Días cumplidos seguidos, día a día</CardDescription>
                </div>
                <p className="text-right text-xs text-muted-foreground">
                  Actual <b className="text-sm text-foreground">{streaks.current}</b> · Mejor <b className="text-sm text-foreground">{streaks.best}</b>
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                <TrendChart
                  data={streakRows}
                  height={200}
                  name="Racha"
                  step
                  scale={days}
                  xFormatter={(k) => formatKey(k, "d MMM")}
                  tooltipLabel={(k) => capitalize(formatKey(k, "EEEE d 'de' MMMM"))}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-5">
              <CardHeader>
                <div>
                  <CardTitle>Hábitos</CardTitle>
                  <CardDescription>{habitRows.length ? `Cumplimiento general: ${formatPercent(habitsOverall)}` : "Cumplimiento en el período"}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {habitRows.length === 0 ? (
                  <EmptyState compact icon={ListChecks} title="Sin hábitos en este período" />
                ) : (
                  <ul className="space-y-3">
                    {habitRows.map((r) => (
                      <li key={r.habit.id} className="flex items-center gap-3">
                        <SectionAvatar section={r.habit} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2 text-sm">
                            <span className="truncate font-medium">{r.habit.name}</span>
                            <span className="shrink-0 tabular">
                              <b className="font-semibold">{formatPercent(r.ratio)}</b>{" "}
                              <span className="text-xs text-muted-foreground">
                                {r.done}/{r.expected}
                              </span>
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full" style={{ width: `${r.ratio * 100}%`, background: sectionColor(r.habit.color) }} />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardHeader>
                <div>
                  <CardTitle>Tendencia semanal</CardTitle>
                  <CardDescription>Total por semana · últimas {trend.length} semanas</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <TrendChart
                  data={trend}
                  height={220}
                  name="Total semanal"
                  xFormatter={(k) => formatKey(k, "d MMM")}
                  tooltipLabel={(k) => `Semana del ${formatKey(k, "d 'de' MMMM")}`}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-5">
              <CardHeader>
                <div>
                  <CardTitle>Tu semana típica</CardTitle>
                  <CardDescription>Promedio por día de la semana</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <StackedBarChart
                  rows={weekdayRows}
                  series={[{ key: "avg", name: "Promedio", color: "var(--primary-text)" }]}
                  height={220}
                  xFormatter={(k) => WEEKDAY_LABELS[Number(k)]}
                  tooltipLabel={(k) => `Promedio de los ${WEEKDAY_LABELS[Number(k)].toLowerCase()}`}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <Highlight
              icon={Clock}
              label="Mejor día del período"
              value={best ? formatDuration(best.seconds) : "—"}
              hint={best ? capitalize(formatKey(best.date, "EEEE d 'de' MMMM")) : undefined}
            />
            <Highlight
              icon={Flame}
              label="Mejor racha (histórica)"
              value={`${streaks.best} ${pluralize(streaks.best, "día")}`}
              hint={`Racha actual: ${streaks.current} ${pluralize(streaks.current, "día")}`}
            />
            <Highlight
              icon={Target}
              label="Sección principal"
              value={distribution[0] ? (byId.get(distribution[0].sectionId ?? "")?.name ?? "Sin sección") : "—"}
              hint={distribution[0] ? `${formatPercent(distribution[0].seconds / total.seconds)} de tu tiempo` : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Highlight({ icon: Icon, label, value, hint }: { icon: typeof Clock; label: string; value: string; hint?: string }) {
  return (
    <Card className="flex items-start gap-3 p-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-semibold">{value}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  );
}

/** Vista de tabla del gráfico principal (accesible y con valores exactos). */
function DataTable({
  rows,
  series,
  labelFor,
}: {
  rows: SeriesRow[];
  series: { key: string; name: string; color: string }[];
  labelFor: (k: string) => string;
}) {
  const visible = [...rows].reverse().filter((r) => r.total > 0);
  if (visible.length === 0) return <EmptyState compact icon={Table2} title="Sin datos en este período" />;
  return (
    <div className="max-h-[360px] overflow-auto rounded-xl border border-border">
      <table className="w-full min-w-[480px] text-sm">
        <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Fecha</th>
            {series.map((s) => (
              <th key={s.key} className="px-3 py-2 text-right font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-[3px]" style={{ background: s.color }} />
                  {s.name}
                </span>
              </th>
            ))}
            <th className="px-3 py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {visible.map((r) => (
            <tr key={r.key}>
              <td className="whitespace-nowrap px-3 py-2">{labelFor(r.key)}</td>
              {series.map((s) => (
                <td key={s.key} className="px-3 py-2 text-right tabular text-muted-foreground">
                  {r[s.key] ? formatDuration(Number(r[s.key])) : "—"}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-medium tabular">{formatDuration(r.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
