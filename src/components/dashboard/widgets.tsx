"use client";

import { ArrowRight, Clock, ListChecks, Plus, Trophy } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { AchievementBadge } from "@/components/achievements/achievement-icon";
import { StreakMark, XpMark } from "@/components/brand/marks";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { GoalRow } from "@/components/goals/goal-row";
import { HabitWeekStrip } from "@/components/habits/habit-visuals";
import { SectionAvatar } from "@/components/sections/section-visuals";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Progress, Skeleton } from "@/components/ui/misc";
import { useDailyTotals, useSections, useToday } from "@/hooks/use-data";
import { useGoalStatuses, useHabitStatuses, useProgression, useStreaks } from "@/hooks/use-metrics";
import { addDaysKey, capitalize, formatKey, monthRange } from "@/lib/dates";
import { levelTitle } from "@/lib/domain/progression";
import { NO_SECTION_KEY, sectionDistribution, sumAll, sumInRange } from "@/lib/domain/stats";
import { formatDuration, formatPercent } from "@/lib/format";
import type { WidgetId, WidgetSpan } from "@/lib/preferences";
import { sectionColor } from "@/lib/sections";
import { cn, pluralize } from "@/lib/utils";
import { DailyGoalCard } from "./daily-goal-card";
import { CalendarCard, RecentActivitiesCard, SectionsCard, TodayActivitiesCard, WeekCard } from "./summary-cards";
import { TimerCard } from "./timer-card";
import { TodayPanel } from "./today-panel";

// ---------------------------------------------------------------------------
// Widgets chicos (un tercio en escritorio, media fila en móvil)
// ---------------------------------------------------------------------------
function MiniCard({
  title,
  icon: Icon,
  href,
  children,
  className,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground sm:text-[13px]">{title}</p>
        <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-3.5" />
        </span>
      </div>
      {children}
    </>
  );
  return href ? (
    <Link href={href} className={cn("lift block rounded-3xl border border-border bg-card p-4 shadow-card", className)}>
      {content}
    </Link>
  ) : (
    <Card className={cn("p-4", className)}>{content}</Card>
  );
}

function StreakWidget({ className }: { className?: string }) {
  const streaks = useStreaks();
  const today = useToday();
  const days = Array.from({ length: 14 }, (_, i) => addDaysKey(today, i - 13));
  return (
    <MiniCard title="Racha" icon={StreakMark} href="/calendar" className={className}>
      {streaks.isLoading ? (
        <Skeleton className="mt-3 h-12" />
      ) : (
        <>
          <p className="mt-2 font-display text-[28px] font-semibold leading-tight">
            {streaks.current} <span className="text-sm font-normal text-muted-foreground">{pluralize(streaks.current, "día")}</span>
          </p>
          <p className="text-xs text-muted-foreground">Mejor: {streaks.best} · {streaks.todayCompleted ? "hoy cumplido" : "hoy pendiente"}</p>
          <div className="mt-3 flex gap-[3px]" aria-label="Últimos 14 días">
            {days.map((d) => (
              <span
                key={d}
                title={`${capitalize(formatKey(d, "EEE d"))}: ${streaks.completedDates.has(d) ? "cumplido" : "no cumplido"}`}
                className={cn(
                  "h-5 flex-1 rounded-[3px]",
                  streaks.completedDates.has(d) ? "bg-streak" : "bg-muted",
                  d === today && "ring-1 ring-foreground/50",
                )}
              />
            ))}
          </div>
        </>
      )}
    </MiniCard>
  );
}

function LevelWidget({ className }: { className?: string }) {
  const { progression } = useProgression();
  return (
    <MiniCard title="Nivel" icon={XpMark} href="/progress" className={className}>
      {!progression ? (
        <Skeleton className="mt-3 h-12" />
      ) : (
        <>
          <p className="mt-2 font-display text-[28px] font-semibold leading-tight">
            {progression.level.level}{" "}
            <span className="text-sm font-normal text-muted-foreground">{levelTitle(progression.level.level)}</span>
          </p>
          <p className="text-xs text-muted-foreground tabular">
            {progression.level.current} / {progression.level.needed} XP
          </p>
          <Progress className="mt-3 h-2" tone="xp" value={progression.level.ratio} label="Progreso al siguiente nivel" />
        </>
      )}
    </MiniCard>
  );
}

function TotalTimeWidget({ className }: { className?: string }) {
  const totals = useDailyTotals();
  const today = useToday();
  const all = sumAll(totals.data ?? []);
  const month = sumInRange(totals.data ?? [], monthRange(today));
  return (
    <MiniCard title="Tiempo total" icon={Clock} href="/stats" className={className}>
      {totals.isLoading ? (
        <Skeleton className="mt-3 h-12" />
      ) : (
        <>
          <p className="mt-2 font-display text-[28px] font-semibold leading-tight">{formatDuration(all.seconds)}</p>
          <p className="text-xs text-muted-foreground">
            {all.count.toLocaleString("es-AR")} {pluralize(all.count, "actividad", "actividades")}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Este mes: <b className="font-medium text-foreground">{formatDuration(month.seconds)}</b>
          </p>
        </>
      )}
    </MiniCard>
  );
}

// ---------------------------------------------------------------------------
// Widgets medianos
// ---------------------------------------------------------------------------
function WidgetHeader({ title, description, href, action }: { title: string; description?: string; href?: string; action?: React.ReactNode }) {
  return (
    <CardHeader>
      <div>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </div>
      {action ??
        (href && (
          <Link href={href} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Ver todo <ArrowRight />
          </Link>
        ))}
    </CardHeader>
  );
}

function HabitsWidget({ className }: { className?: string }) {
  const habits = useHabitStatuses();
  const dialogs = useDialogs();
  return (
    <Card className={className}>
      <WidgetHeader title="Semana de hábitos" description="Tu semana de un vistazo" href="/habits" />
      <CardContent className="pt-3">
        {habits.isLoading ? (
          <Skeleton className="h-24" />
        ) : habits.statuses.length === 0 ? (
          <EmptyState
            compact
            icon={ListChecks}
            title="Todavía no tenés hábitos"
            description="Meditar, leer, entrenar… algo que quieras hacer seguido."
            action={
              <Button size="sm" variant="soft" onClick={() => dialogs.openHabitForm()}>
                <Plus /> Nuevo hábito
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {habits.statuses.slice(0, 6).map((h) => (
              <li key={h.habit.id} className="flex items-center gap-3">
                <SectionAvatar section={h.habit} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{h.habit.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPercent(h.week.ratio)} esta semana
                    {h.streak.current > 0 && ` · racha ${h.streak.current}`}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <HabitWeekStrip habit={h.habit} checks={h.checks} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function GoalsWidget({ className }: { className?: string }) {
  const { statuses, isLoading } = useGoalStatuses();
  const dialogs = useDialogs();
  const longer = statuses.filter((s) => s.goal.period !== "daily");
  return (
    <Card className={className}>
      <WidgetHeader
        title="Objetivos"
        description="Semana y mes"
        action={
          <Button variant="ghost" size="icon-sm" aria-label="Nuevo objetivo" onClick={() => dialogs.openGoalDialog({ sectionId: null, period: "weekly" })}>
            <Plus />
          </Button>
        }
      />
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-20" />
        ) : longer.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Sin objetivos semanales ni mensuales.</p>
        ) : (
          <div className="-mx-2 space-y-0.5">
            {longer.map((s) => (
              <GoalRow key={`${s.goal.sectionId}|${s.goal.period}|${s.goal.metric}`} status={s} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AchievementsWidget({ className }: { className?: string }) {
  const { progression } = useProgression();
  const recent = (progression?.achievements ?? [])
    .filter((a) => a.unlockedAt)
    .sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""))
    .slice(0, 2);
  const next = (progression?.achievements ?? [])
    .filter((a) => !a.earned)
    .sort((a, b) => b.current / b.target - a.current / a.target)
    .slice(0, 2);
  return (
    <Card className={className}>
      <WidgetHeader title="Próximos logros" description={progression ? `${progression.achievements.filter((a) => a.earned).length} de ${progression.achievements.length}` : undefined} href="/achievements" />
      <CardContent className="space-y-3 pt-3">
        {!progression ? (
          <Skeleton className="h-24" />
        ) : (
          <>
            {recent.map((a) => (
              <div key={a.definition.code} className="flex items-center gap-3">
                <AchievementBadge icon={a.definition.icon} earned size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.definition.title}</p>
                  <p className="text-xs text-muted-foreground">Desbloqueado</p>
                </div>
              </div>
            ))}
            {next.map((a) => (
              <div key={a.definition.code} className="flex items-center gap-3">
                <AchievementBadge icon={a.definition.icon} earned={false} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.definition.title}</p>
                  <Progress className="mt-1 h-1.5" value={a.current / a.target} />
                </div>
                <span className="text-xs text-muted-foreground tabular">
                  {a.current}/{a.target}
                </span>
              </div>
            ))}
            {recent.length === 0 && next.length === 0 && <EmptyState compact icon={Trophy} title="Todos los logros desbloqueados" />}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatsWidget({ className }: { className?: string }) {
  const totals = useDailyTotals();
  const today = useToday();
  const { data: sections = [] } = useSections();
  const month = monthRange(today);
  const dist = sectionDistribution(totals.data ?? [], month);
  const total = dist.reduce((a, d) => a + d.seconds, 0);
  const max = dist[0]?.seconds ?? 0;
  const byId = new Map(sections.map((s) => [s.id, s]));
  return (
    <Card className={className}>
      <WidgetHeader title="Estadísticas" description={`${capitalize(formatKey(today, "MMMM"))} · ${formatDuration(total)}`} href="/stats" />
      <CardContent className="pt-3">
        {totals.isLoading ? (
          <Skeleton className="h-24" />
        ) : dist.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Sin actividad este mes.</p>
        ) : (
          <ul className="space-y-3">
            {dist.slice(0, 5).map((d) => {
              const s = d.sectionId ? byId.get(d.sectionId) : undefined;
              return (
                <li key={d.sectionId ?? NO_SECTION_KEY}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{s?.name ?? "Sin área"}</span>
                    <span className="shrink-0 font-medium tabular">
                      {formatDuration(d.seconds)} <span className="text-xs font-normal text-muted-foreground">{formatPercent(d.seconds / total)}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(d.seconds / max) * 100}%`, background: sectionColor(s?.color) }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Registro: id de preferencia -> componente
// ---------------------------------------------------------------------------
export const WIDGET_COMPONENTS: Record<WidgetId, ComponentType<{ className?: string }>> = {
  today: TodayPanel,
  "activities-today": TodayActivitiesCard,
  "daily-goal": DailyGoalCard,
  timer: TimerCard,
  streak: StreakWidget,
  level: LevelWidget,
  "total-time": TotalTimeWidget,
  recent: RecentActivitiesCard,
  weekly: WeekCard,
  habits: HabitsWidget,
  calendar: CalendarCard,
  goals: GoalsWidget,
  sections: SectionsCard,
  achievements: AchievementsWidget,
  stats: StatsWidget,
};

/** Columnas: 2 en móvil, 6 en escritorio. */
export const SPAN_CLASS: Record<WidgetSpan, string> = {
  full: "col-span-2 lg:col-span-6",
  half: "col-span-2 lg:col-span-3",
  third: "col-span-1 lg:col-span-2",
};
