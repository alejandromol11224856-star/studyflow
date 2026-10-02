"use client";

import { ArrowRight, CalendarCheck, Target } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AchievementBadge } from "@/components/achievements/achievement-icon";
import { SummitIllustration } from "@/components/brand/illustrations";
import { LevelBadge, StreakMark } from "@/components/brand/marks";
import { StatTile, TrendBadge } from "@/components/gamification/chips";
import { SectionTitle } from "@/components/layout/page-header";
import { SectionAvatar } from "@/components/sections/section-visuals";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, Progress, SegmentedControl, Skeleton } from "@/components/ui/misc";
import { useDailyTotals, useGoals, useSectionMap, useToday, useWeekStart } from "@/hooks/use-data";
import { useGoalStatuses, useProgression, useRecords, useStreaks } from "@/hooks/use-metrics";
import {
  type DateKey,
  type DateRange,
  addDaysKey,
  addMonthsKey,
  capitalize,
  diffDays,
  eachDayKeys,
  formatKey,
  monthRange,
  weekRange,
} from "@/lib/dates";
import { progressVerdict } from "@/lib/domain/insights";
import { levelTitle } from "@/lib/domain/progression";
import { activeDaysInRange, dailyGoalCompletion, monthlySeries, sectionDistribution, sumInRange, weeklySeries } from "@/lib/domain/stats";
import { formatDuration, formatPercent } from "@/lib/format";
import { sectionColor } from "@/lib/sections";
import { cn, pluralize } from "@/lib/utils";

type Period = "week" | "month";

/** El mismo tramo del período anterior ("la semana pasada a esta altura"). */
function previousRange(period: Period, range: DateRange, today: DateKey): DateRange {
  const elapsed = diffDays(today < range.to ? today : range.to, range.from);
  const from = period === "week" ? addDaysKey(range.from, -7) : addMonthsKey(range.from, -1);
  return { from, to: addDaysKey(from, elapsed) };
}

/** Barras de las últimas semanas/meses con el período actual resaltado y el promedio. */
function TrendChart({
  rows,
  labelFor,
  currentLabel,
}: {
  rows: { key: DateKey; total: number }[];
  labelFor: (key: DateKey) => string;
  currentLabel: string;
}) {
  const max = Math.max(...rows.map((r) => r.total), 1);
  const past = rows.slice(0, -1);
  const avg = past.length ? past.reduce((a, r) => a + r.total, 0) / past.length : 0;
  const summary = rows.map((r) => `${labelFor(r.key)}: ${formatDuration(r.total)}`).join(", ");
  return (
    <div role="img" aria-label={`Tiempo por período: ${summary}`}>
      {/* Leyenda arriba (no sobre las barras): así nunca se pisa con los valores. */}
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] font-semibold text-muted-foreground" aria-hidden>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-primary" />
          {currentLabel} · <span className="font-display text-sm text-foreground tabular">{formatDuration(rows[rows.length - 1].total)}</span>
        </span>
        {avg > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-muted-foreground/60" />
            Promedio · <span className="font-display text-sm text-foreground tabular">{formatDuration(avg)}</span>
          </span>
        )}
      </div>
      <div className="relative flex h-40 items-end gap-2 sm:gap-3">
        {avg > 0 && (
          <div className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-muted-foreground/50" style={{ bottom: `${(avg / max) * 100}%` }} />
        )}
        {rows.map((r, i) => {
          const current = i === rows.length - 1;
          return (
            <div key={r.key} className="flex h-full flex-1 flex-col justify-end">
              <div
                className={cn("w-full rounded-t-[10px] rounded-b-[4px] transition-[height] duration-700", current ? "bg-primary" : "bg-primary/20")}
                style={{ height: `${Math.max(r.total ? 4 : 2, (r.total / max) * 100)}%` }}
                title={`${labelFor(r.key)}: ${formatDuration(r.total)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3">
        {rows.map((r, i) => (
          <span key={r.key} className={cn("flex-1 text-center text-[11px] font-semibold", i === rows.length - 1 ? "text-foreground" : "text-muted-foreground")}>
            {labelFor(r.key)}
          </span>
        ))}
      </div>
    </div>
  );
}

function LevelBlock() {
  const { progression } = useProgression();
  if (!progression) return <Skeleton className="h-36 rounded-3xl" />;
  const { level, current, needed, ratio } = progression.level;
  return (
    <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
      <LevelBadge level={level} size={64} />
      <div className="min-w-0 flex-1">
        <p className="font-display text-[24px] font-semibold leading-tight">
          Nivel {level} <span className="text-muted-foreground">· {levelTitle(level)}</span>
        </p>
        <Progress className="mt-3 h-2.5" tone="xp" value={ratio} label="XP hacia el siguiente nivel" />
        <div className="mt-2 flex flex-wrap justify-between gap-x-4 text-[13px] text-muted-foreground tabular">
          <span>
            Te faltan <b className="text-foreground">{needed - current} XP</b> para el nivel {level + 1}
          </span>
          <span>{progression.xp.total.toLocaleString("es-AR")} XP en total</span>
        </div>
      </div>
    </Card>
  );
}

export function ProgressView() {
  const today = useToday();
  const weekStartsOn = useWeekStart();
  const totals = useDailyTotals();
  const goals = useGoals();
  const streaks = useStreaks();
  const sectionMap = useSectionMap();
  const { records } = useRecords();
  const { progression } = useProgression();
  const { statuses } = useGoalStatuses();
  const [period, setPeriod] = useState<Period>("week");

  const range = period === "week" ? weekRange(today, weekStartsOn) : monthRange(today);
  const prev = previousRange(period, range, today);
  const current = sumInRange(totals.data ?? [], range).seconds;
  const before = sumInRange(totals.data ?? [], prev).seconds;
  const daysLeft = Math.max(0, diffDays(range.to, today));
  const verdict = progressVerdict({ period, current, previous: before, daysLeft });
  const thisPeriod = period === "week" ? "esta semana" : "este mes";

  const pastRange = { from: range.from, to: today < range.to ? today : range.to };
  const elapsedDays = eachDayKeys(pastRange.from, pastRange.to).length;
  const activeDays = activeDaysInRange(streaks.byDate, pastRange);
  const compliance = dailyGoalCompletion(streaks.measures, goals.data ?? [], range, today);
  const todayGlobal = statuses.filter((s) => s.goal.period === "daily" && s.goal.sectionId === null);
  const todayRatio = todayGlobal.length ? Math.min(...todayGlobal.map((s) => s.progress.ratio)) : null;

  const trendRows =
    period === "week" ? weeklySeries(streaks.byDate, today, 8, weekStartsOn) : monthlySeries(totals.data ?? [], today, 6);
  const labelFor = (key: DateKey) => (period === "week" ? formatKey(key, "d/M") : capitalize(formatKey(key, "MMM")));

  const distribution = sectionDistribution(totals.data ?? [], range);
  const prevDistribution = new Map(sectionDistribution(totals.data ?? [], prev).map((d) => [d.sectionId, d.seconds]));
  const maxArea = distribution[0]?.seconds ?? 0;

  const next = (progression?.achievements ?? [])
    .filter((a) => !a.earned)
    .sort((a, b) => b.current / b.target - a.current / a.target)
    .slice(0, 3);

  const loading = totals.isLoading || goals.isLoading;

  return (
    <div className="space-y-10 pb-4">
      <header className="animate-page-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">Progreso · {thisPeriod}</p>
          <SegmentedControl
            value={period}
            onChange={setPeriod}
            options={[
              { value: "week", label: "Semana" },
              { value: "month", label: "Mes" },
            ]}
          />
        </div>
        {loading ? (
          <Skeleton className="mt-4 h-24 max-w-xl" />
        ) : (
          <>
            <h1 className="mt-4 font-display text-[34px] font-semibold leading-[1.08] sm:text-[44px]">{verdict.headline}</h1>
            <p className="mt-3 flex max-w-2xl flex-wrap items-center gap-x-2 gap-y-1 text-[17px] leading-relaxed text-muted-foreground">
              {verdict.detail} <TrendBadge trend={verdict.trend} />
            </p>
          </>
        )}
      </header>

      <section aria-label="Tendencia">
        <SectionTitle title={period === "week" ? "Últimas 8 semanas" : "Últimos 6 meses"} hint="Tiempo registrado por período" />
        <Card className="p-5 sm:p-6">
          {loading ? <Skeleton className="h-44" /> : <TrendChart rows={trendRows} labelFor={labelFor} currentLabel={capitalize(thisPeriod)} />}
        </Card>
      </section>

      <section aria-label="Lo esencial">
        <SectionTitle title="Lo esencial" hint={capitalize(thisPeriod)} />
        <Card className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-3 sm:p-6">
          <StatTile
            icon={<CalendarCheck />}
            label="Constancia"
            value={`${activeDays}/${elapsedDays}`}
            hint={`${pluralize(activeDays, "día")} con actividad`}
          />
          {compliance.withGoal ? (
            <StatTile
              icon={<Target />}
              label="Objetivo diario"
              value={formatPercent(compliance.ratio)}
              hint={`${compliance.met} de ${compliance.withGoal} ${pluralize(compliance.withGoal, "día")} cumplidos`}
            />
          ) : (
            <StatTile
              icon={<Target />}
              label="Objetivo de hoy"
              value={todayRatio !== null ? formatPercent(todayRatio) : "—"}
              hint={todayRatio !== null ? "El cumplimiento se cuenta al cerrar cada día" : "Definí una meta diaria para medirlo"}
            />
          )}
          <StatTile
            icon={<StreakMark />}
            label="Racha"
            value={`${streaks.current} ${pluralize(streaks.current, "día")}`}
            hint={`Tu mejor racha: ${streaks.best} ${pluralize(streaks.best, "día")}`}
          />
        </Card>
      </section>

      <section aria-label="Nivel">
        <SectionTitle title="Nivel" hint="Ganás XP con tiempo dedicado, objetivos, hábitos y constancia" />
        <LevelBlock />
      </section>

      <section aria-label="Por área">
        <SectionTitle title="Por área" hint={`${capitalize(thisPeriod)}, comparado con ${period === "week" ? "la semana pasada" : "el mes pasado"}`} />
        <Card className="p-2 sm:p-3">
          {distribution.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Todavía no hay tiempo registrado {thisPeriod}.</p>
          ) : (
            <ul>
              {distribution.map((d) => {
                const s = d.sectionId ? sectionMap.get(d.sectionId) : undefined;
                const prevSeconds = prevDistribution.get(d.sectionId) ?? 0;
                return (
                  <li key={d.sectionId ?? "none"} className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
                    <SectionAvatar section={s ?? null} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[15px] font-semibold">{s?.name ?? "Sin área"}</p>
                        <p className="flex shrink-0 items-center gap-2 text-sm font-semibold tabular">
                          <TrendBadge trend={prevSeconds > 0 ? (d.seconds - prevSeconds) / prevSeconds : null} />
                          {formatDuration(d.seconds)}
                        </p>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${(d.seconds / maxArea) * 100}%`, background: sectionColor(s?.color) }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8">
        <section aria-label="Récords">
          <SectionTitle title="Récords" />
          <Card className="divide-y divide-border">
            {!records ? (
              <Skeleton className="m-4 h-32" />
            ) : !records.bestDay ? (
              <EmptyState compact illustration={<SummitIllustration />} title="Tus récords te esperan" description="Aparecen solos a medida que registrás." />
            ) : (
              [
                { label: "Mejor día", value: formatDuration(records.bestDay.seconds), hint: capitalize(formatKey(records.bestDay.date, "EEEE d 'de' MMMM")) },
                records.bestWeek && { label: "Mejor semana", value: formatDuration(records.bestWeek.seconds), hint: `Desde el ${formatKey(records.bestWeek.from, "d 'de' MMMM")}` },
                records.longestStreak && {
                  label: "Racha más larga",
                  value: `${records.longestStreak.days} ${pluralize(records.longestStreak.days, "día")}`,
                  hint: `${formatKey(records.longestStreak.from, "d MMM")} – ${formatKey(records.longestStreak.to, "d MMM")}`,
                },
                records.bestCompliance && {
                  label: "Mejor mes cumpliendo",
                  value: formatPercent(records.bestCompliance.ratio),
                  hint: capitalize(formatKey(records.bestCompliance.month, "MMMM yyyy")),
                },
              ]
                .filter((r): r is { label: string; value: string; hint: string } => Boolean(r))
                .map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold">{r.label}</p>
                      <p className="truncate text-[13px] text-muted-foreground">{r.hint}</p>
                    </div>
                    <p className="shrink-0 font-display text-[22px] font-semibold tabular">{r.value}</p>
                  </div>
                ))
            )}
          </Card>
        </section>

        <section aria-label="Próximos logros">
          <SectionTitle
            title="Próximos logros"
            action={
              <Link href="/achievements" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
                Ver todos <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          <Card className="space-y-4 p-5">
            {!progression ? (
              <Skeleton className="h-32" />
            ) : next.length === 0 ? (
              <p className="text-sm text-muted-foreground">Desbloqueaste todos los logros.</p>
            ) : (
              next.map((a) => (
                <div key={a.definition.code} className="flex items-center gap-3">
                  <AchievementBadge icon={a.definition.icon} earned={false} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{a.definition.title}</p>
                    <Progress className="mt-1.5 h-1.5" tone="xp" value={a.current / a.target} />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground tabular">
                    {a.current}/{a.target}
                  </span>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/stats" className={buttonVariants({ variant: "outline" })}>
          Ver estadísticas completas <ArrowRight />
        </Link>
        <Link href="/calendar" className={buttonVariants({ variant: "ghost" })}>
          Calendario
        </Link>
      </div>
    </div>
  );
}
