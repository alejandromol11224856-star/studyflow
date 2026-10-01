"use client";

import { CalendarDays, CalendarRange, ChevronDown, Flame, Gauge, ListChecks, NotebookPen, Sun, Trophy } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState, Progress, SegmentedControl, Skeleton } from "@/components/ui/misc";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useHabits } from "@/hooks/use-data";
import { useProgression, useRecords } from "@/hooks/use-metrics";
import { capitalize, formatKey } from "@/lib/dates";
import { streakLabel } from "@/lib/domain/habits";
import { type AchievementCategory, XP_RULES, levelTitle } from "@/lib/domain/progression";
import { formatDuration, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AchievementBadge } from "./achievement-icon";

const CATEGORIES: AchievementCategory[] = ["Constancia", "Tiempo", "Actividades", "Objetivos", "Hábitos", "Nivel"];

export function AchievementsView() {
  const [tab, setTab] = useState<"achievements" | "records">("achievements");
  return (
    <div className="space-y-5">
      <PageHeader
        title="Logros"
        description="Tu nivel, tus logros y tus récords personales."
        actions={
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: "achievements", label: "Logros" },
              { value: "records", label: "Récords" },
            ]}
          />
        }
      />
      <LevelCard />
      {tab === "achievements" ? <AchievementsGrid /> : <RecordsGrid />}
    </div>
  );
}

function LevelCard() {
  const { progression } = useProgression();
  const [open, setOpen] = useState(false);
  if (!progression) return <Skeleton className="h-40" />;
  const { level, xp } = progression;
  const sources = [
    { label: "Tiempo", value: xp.time },
    { label: "Actividades", value: xp.activities },
    { label: "Objetivos", value: xp.goals },
    { label: "Hábitos", value: xp.habits },
    { label: "Rachas", value: xp.streaks },
    { label: "Logros", value: xp.achievements },
  ];
  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary-soft opacity-70 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <ProgressRing value={level.ratio} size={96} stroke={8} label={`Progreso al nivel ${level.level + 1}`}>
          <span className="text-center leading-none">
            <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">Nivel</span>
            <span className="block text-3xl font-semibold">{level.level}</span>
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold tracking-tight">{levelTitle(level.level)}</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular">{level.current}</span> / {level.needed} XP para el nivel {level.level + 1} ·{" "}
            {xp.total.toLocaleString("es-AR")} XP en total
          </p>
          <Progress className="mt-3 h-2.5" value={level.ratio} label="Progreso de nivel" />
          <ul className="mt-4 flex flex-wrap gap-2">
            {sources.map((s) => (
              <li key={s.label} className="rounded-lg bg-muted px-2.5 py-1 text-xs">
                <span className="text-muted-foreground">{s.label}</span> <b className="font-semibold tabular">{s.value.toLocaleString("es-AR")}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="relative mt-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} /> ¿Cómo se gana XP?
      </button>
      {open && (
        <ul className="relative mt-2 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2 animate-fade-in">
          <li>· 10 XP por hora registrada (máximo 12 h por día).</li>
          <li>· {XP_RULES.activityXp} XP por actividad, hasta {XP_RULES.maxActivitiesPerDay} por día (si el día suma 10 min o una medida real).</li>
          <li>· Objetivo diario general: {XP_RULES.goalXp.daily.global} XP · por sección: {XP_RULES.goalXp.daily.section} XP.</li>
          <li>· Objetivo semanal: {XP_RULES.goalXp.weekly.global} XP · mensual: {XP_RULES.goalXp.monthly.global} XP.</li>
          <li>· {XP_RULES.habitXp} XP por hábito completado (hasta {XP_RULES.maxHabitChecksPerDay} por día).</li>
          <li>· Cada día cumplido suma más cuanto más larga es tu racha (hasta 14 XP).</li>
          <li className="sm:col-span-2">
            Partir el tiempo en muchas actividades chicas no da más XP: se cuenta el total del día. Si borrás una actividad,
            también se descuenta su XP.
          </li>
        </ul>
      )}
    </Card>
  );
}

function AchievementsGrid() {
  const { progression } = useProgression();
  if (!progression) return <Skeleton className="h-64" />;
  const earned = progression.achievements.filter((a) => a.earned).length;
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Desbloqueaste <b className="text-foreground">{earned}</b> de {progression.achievements.length} logros.
      </p>
      {CATEGORIES.map((category) => {
        const list = progression.achievements.filter((a) => a.definition.category === category);
        return (
          <section key={category}>
            <h2 className="mb-3 text-sm font-semibold">{category}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((a) => (
                <Card key={a.definition.code} className={cn("flex items-start gap-3 p-4", !a.earned && "bg-subtle")}>
                  <AchievementBadge icon={a.definition.icon} earned={a.earned} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn("text-sm font-semibold", !a.earned && "text-muted-foreground")}>{a.definition.title}</p>
                      {a.definition.xp > 0 && <span className="shrink-0 text-[11px] text-muted-foreground">+{a.definition.xp} XP</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.definition.description}</p>
                    {a.earned ? (
                      <p className="mt-2 text-[11px] font-medium text-primary-text">
                        {a.unlockedAt ? `Desbloqueado el ${formatKey(a.unlockedAt.slice(0, 10), "d 'de' MMMM yyyy")}` : "Desbloqueado"}
                      </p>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <Progress className="h-1.5" value={a.current / a.target} />
                        <span className="shrink-0 text-[11px] text-muted-foreground tabular">
                          {a.current.toLocaleString("es-AR")}/{a.target.toLocaleString("es-AR")}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function RecordsGrid() {
  const { records } = useRecords();
  const { data: habits = [] } = useHabits();
  if (!records) return <Skeleton className="h-64" />;
  const habitName = records.longestHabitStreak ? habits.find((h) => h.id === records.longestHabitStreak!.habitId)?.name : null;
  const day = (key: string) => capitalize(formatKey(key, "EEEE d 'de' MMMM yyyy"));

  const items = [
    {
      icon: Flame,
      label: "Mayor racha",
      value: records.longestStreak ? `${records.longestStreak.days} días` : null,
      when: records.longestStreak
        ? `Del ${formatKey(records.longestStreak.from, "d 'de' MMM")} al ${formatKey(records.longestStreak.to, "d 'de' MMM yyyy")}`
        : null,
    },
    { icon: Sun, label: "Más horas en un día", value: records.bestDay && formatDuration(records.bestDay.seconds), when: records.bestDay && day(records.bestDay.date) },
    {
      icon: CalendarRange,
      label: "Más horas en una semana",
      value: records.bestWeek && formatDuration(records.bestWeek.seconds),
      when: records.bestWeek && `Semana del ${formatKey(records.bestWeek.from, "d 'de' MMMM yyyy")}`,
    },
    {
      icon: CalendarDays,
      label: "Más horas en un mes",
      value: records.bestMonth && formatDuration(records.bestMonth.seconds),
      when: records.bestMonth && capitalize(formatKey(records.bestMonth.month, "MMMM yyyy")),
    },
    {
      icon: NotebookPen,
      label: "Más actividades en un día",
      value: records.mostActivities && `${records.mostActivities.count}`,
      when: records.mostActivities && day(records.mostActivities.date),
    },
    {
      icon: Gauge,
      label: "Mejor cumplimiento mensual",
      value: records.bestCompliance && formatPercent(records.bestCompliance.ratio),
      when:
        records.bestCompliance &&
        `${capitalize(formatKey(records.bestCompliance.month, "MMMM yyyy"))} · ${records.bestCompliance.met} de ${records.bestCompliance.withGoal} días`,
    },
    {
      icon: ListChecks,
      label: "Mayor racha de un hábito",
      value: records.longestHabitStreak && streakLabel(records.longestHabitStreak.days, records.longestHabitStreak.unit),
      when: habitName,
    },
  ];

  if (items.every((i) => !i.value)) {
    return (
      <Card>
        <EmptyState icon={Trophy} title="Todavía no hay récords" description="Registrá actividades y cumplí objetivos: tus mejores marcas aparecen acá." />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary-text">
              <item.icon className="size-3.5" />
            </span>
            {item.label}
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight">{item.value ?? "—"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.when ?? "Todavía sin datos"}</p>
        </Card>
      ))}
    </div>
  );
}
