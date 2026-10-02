"use client";

import { ArrowRight, CalendarDays, ChartColumn, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AchievementBadge } from "@/components/achievements/achievement-icon";
import { StatTile } from "@/components/gamification/chips";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress, SegmentedControl, Skeleton } from "@/components/ui/misc";
import { useDailyTotals, useGoals, useToday, useWeekStart } from "@/hooks/use-data";
import { useGoalStatuses, useProgression, useStreaks } from "@/hooks/use-metrics";
import { type DateKey, type DateRange, addDaysKey, addMonthsKey, capitalize, diffDays, formatKey, monthRange, weekRange } from "@/lib/dates";
import { levelTitle, xpToNext } from "@/lib/domain/progression";
import { bestDayInRange, dailyGoalCompletion, sumInRange } from "@/lib/domain/stats";
import { formatDuration, formatPercent } from "@/lib/format";
import { cn, pluralize } from "@/lib/utils";

type Period = "week" | "month";

/** El mismo tramo del período anterior ("la semana pasada a esta altura"). */
function previousRange(period: Period, range: DateRange, today: DateKey): DateRange {
  const elapsed = diffDays(today < range.to ? today : range.to, range.from);
  const from = period === "week" ? addDaysKey(range.from, -7) : addMonthsKey(range.from, -1);
  return { from, to: addDaysKey(from, elapsed) };
}

function LevelCard() {
  const { progression } = useProgression();
  if (!progression) return <Skeleton className="h-40 rounded-3xl" />;
  const { level, current, needed, ratio } = progression.level;
  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-xp-soft blur-3xl" />
      <div className="relative flex items-center gap-4">
        <span className="flex size-[72px] shrink-0 items-center justify-center rounded-[26px] bg-[image:var(--gradient-primary)] text-3xl font-extrabold text-primary-foreground shadow-lg shadow-primary/25">
          {level}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-xp-text">⭐ Tu nivel</p>
          <p className="truncate text-xl font-extrabold tracking-tight">
            Nivel {level} · {levelTitle(level)}
          </p>
          <p className="text-sm text-muted-foreground">
            Te faltan <b className="text-foreground tabular">{needed - current} XP</b> para el nivel {level + 1}
          </p>
        </div>
      </div>
      <Progress className="relative mt-4 h-3" tone="xp" value={ratio} label="XP hacia el siguiente nivel" />
      <div className="relative mt-1.5 flex justify-between text-xs font-semibold text-muted-foreground tabular">
        <span>
          {current} / {needed} XP
        </span>
        <span>{progression.xp.total.toLocaleString("es-AR")} XP en total</span>
      </div>
      <p className="relative mt-3 text-xs text-muted-foreground">
        Ganás XP por tiempo dedicado, objetivos cumplidos, hábitos y rachas. Nivel {level + 2} pide {xpToNext(level + 1)} XP.
      </p>
    </Card>
  );
}

function LastDays() {
  const today = useToday();
  const streaks = useStreaks();
  const days = Array.from({ length: 7 }, (_, i) => addDaysKey(today, i - 6));
  const values = days.map((d) => streaks.byDate.get(d) ?? 0);
  const max = Math.max(...values, 1);
  return (
    <Card className="p-5">
      <p className="text-[15px] font-bold">📅 Últimos 7 días</p>
      <div className="mt-4 flex h-32 items-end gap-2" role="img" aria-label="Tiempo registrado en los últimos 7 días">
        {days.map((d, i) => {
          const done = streaks.completedDates.has(d);
          return (
            <div key={d} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <div
                  className={cn(
                    "w-full rounded-xl transition-[height] duration-700",
                    values[i] > 0 ? (done ? "bg-[image:var(--gradient-success)]" : "bg-[image:var(--gradient-primary)]") : "bg-muted",
                  )}
                  style={{ height: `${Math.max(8, (values[i] / max) * 100)}%` }}
                  title={`${capitalize(formatKey(d, "EEEE d"))}: ${formatDuration(values[i])}${done ? " · día cumplido" : ""}`}
                />
              </div>
              <span className={cn("text-[11px] font-bold", d === today ? "text-primary-text" : "text-muted-foreground")}>
                {capitalize(formatKey(d, "EEEEEE"))}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        <span className="mr-1 inline-block size-2 rounded-full bg-success align-middle" /> Día cumplido
      </p>
    </Card>
  );
}

function NextAchievements() {
  const { progression } = useProgression();
  const next = (progression?.achievements ?? [])
    .filter((a) => !a.earned)
    .sort((a, b) => b.current / b.target - a.current / a.target)
    .slice(0, 3);
  const earned = progression?.achievements.filter((a) => a.earned).length ?? 0;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-bold">🏆 Próximos logros</p>
        <span className="text-xs font-bold text-muted-foreground tabular">
          {earned}/{progression?.achievements.length ?? 0}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {!progression ? (
          <Skeleton className="h-24" />
        ) : next.length === 0 ? (
          <p className="text-sm text-muted-foreground">¡Desbloqueaste todos los logros! 🎉</p>
        ) : (
          next.map((a) => (
            <div key={a.definition.code} className="flex items-center gap-3">
              <AchievementBadge icon={a.definition.icon} earned={false} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{a.definition.title}</p>
                <Progress className="mt-1 h-2" tone="xp" value={a.current / a.target} />
              </div>
              <span className="text-xs font-bold text-muted-foreground tabular">
                {a.current}/{a.target}
              </span>
            </div>
          ))
        )}
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
  const [period, setPeriod] = useState<Period>("week");

  const range = period === "week" ? weekRange(today, weekStartsOn) : monthRange(today);
  const prev = previousRange(period, range, today);
  const current = sumInRange(totals.data ?? [], range).seconds;
  const before = sumInRange(totals.data ?? [], prev).seconds;
  const trend = before > 0 ? (current - before) / before : null;
  const compliance = dailyGoalCompletion(streaks.measures, goals.data ?? [], range, today);
  const best = bestDayInRange(streaks.byDate, range);
  // Si todavía no cerró ningún día con objetivo, mostrar cómo va hoy (en vez de "definí uno").
  const { statuses } = useGoalStatuses();
  const todayGlobal = statuses.filter((s) => s.goal.period === "daily" && s.goal.sectionId === null);
  const todayRatio = todayGlobal.length ? Math.min(...todayGlobal.map((s) => s.progress.ratio)) : null;
  const label = period === "week" ? "esta semana" : "este mes";
  const loading = totals.isLoading || goals.isLoading;

  return (
    <div className="space-y-4">
      <PageHeader
        title="📈 Progreso"
        description="Cómo venís, en simple. Cada día suma."
        actions={
          <SegmentedControl
            value={period}
            onChange={setPeriod}
            options={[
              { value: "week", label: "Semana" },
              { value: "month", label: "Mes" },
            ]}
          />
        }
      />

      <LevelCard />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 animate-slide-up lg:grid-cols-4">
          <StatTile
            emoji="⏱️"
            label={`Tiempo ${label}`}
            value={formatDuration(current)}
            trend={trend}
            hint={before > 0 ? `${period === "week" ? "Semana pasada" : "Mes pasado"} a esta altura: ${formatDuration(before)}` : "Primer período: ¡arrancaste!"}
          />
          {compliance.withGoal ? (
            <StatTile
              emoji="🎯"
              label="Objetivo diario"
              value={formatPercent(compliance.ratio)}
              hint={`${compliance.met} de ${compliance.withGoal} ${pluralize(compliance.withGoal, "día")} cumplidos`}
            />
          ) : todayRatio !== null ? (
            <StatTile emoji="🎯" label="Objetivo de hoy" value={formatPercent(todayRatio)} hint="Tu cumplimiento se cuenta al cerrar cada día." />
          ) : (
            <StatTile emoji="🎯" label="Objetivo diario" value="—" hint="Definí un objetivo diario para ver tu cumplimiento." />
          )}
          <StatTile
            emoji="🔥"
            label="Racha actual"
            value={`${streaks.current} ${pluralize(streaks.current, "día")}`}
            hint={`Tu mejor racha: ${streaks.best} ${pluralize(streaks.best, "día")}`}
          />
          <StatTile
            emoji="🏅"
            label={`Mejor día ${label}`}
            value={best ? formatDuration(best.seconds) : "—"}
            hint={best ? capitalize(formatKey(best.date, "EEEE d 'de' MMMM")) : "Todavía no hay registros"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LastDays />
        <NextAchievements />
      </div>

      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[15px] font-bold">¿Querés ver más detalle?</p>
          <p className="text-sm text-muted-foreground">Gráficos por día y por área, cumplimiento, hábitos, récords y más.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/stats" className={buttonVariants({ variant: "gradient" })}>
            <ChartColumn /> Ver estadísticas completas <ArrowRight />
          </Link>
          <Link href="/calendar" className={buttonVariants({ variant: "outline" })}>
            <CalendarDays /> Calendario
          </Link>
          <Link href="/achievements" className={buttonVariants({ variant: "outline" })}>
            <Trophy /> Logros
          </Link>
        </div>
      </Card>
    </div>
  );
}
