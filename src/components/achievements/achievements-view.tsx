"use client";

import { SummitIllustration } from "@/components/brand/illustrations";
import { LevelBadge, StreakMark } from "@/components/brand/marks";
import { CalendarDays, CalendarRange, ChevronDown, Gauge, ListChecks, NotebookPen, Sun } from "lucide-react";
import { useState } from "react";
import { StatTile } from "@/components/gamification/chips";
import { PageHeader, SectionTitle } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState, Progress, SegmentedControl, Skeleton } from "@/components/ui/misc";
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
    <div className="space-y-10">
      <PageHeader
        eyebrow="Tu progreso"
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

/** Mismo bloque de nivel que Progreso: insignia propia + barra de XP. */
function LevelCard() {
  const { progression } = useProgression();
  const [open, setOpen] = useState(false);
  if (!progression) return <Skeleton className="h-40 rounded-3xl" />;
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
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <LevelBadge level={level.level} size={64} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[24px] font-semibold leading-tight">
            Nivel {level.level} <span className="text-muted-foreground">· {levelTitle(level.level)}</span>
          </p>
          <Progress className="mt-3 h-2.5" tone="xp" value={level.ratio} label="XP hacia el siguiente nivel" />
          <div className="mt-2 flex flex-wrap justify-between gap-x-4 text-[13px] text-muted-foreground tabular">
            <span>
              Te faltan <b className="text-foreground">{(level.needed - level.current).toLocaleString("es-AR")} XP</b> para el nivel {level.level + 1}
            </span>
            <span>{xp.total.toLocaleString("es-AR")} XP en total</span>
          </div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-5 sm:grid-cols-3 lg:grid-cols-6">
        {sources.map((s) => (
          <div key={s.label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="font-display text-lg font-semibold tabular">{s.value.toLocaleString("es-AR")}</dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-4 inline-flex h-9 items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} /> ¿Cómo se gana XP?
      </button>
      {open && (
        <ul className="mt-1 grid gap-1.5 text-xs text-muted-foreground animate-fade-in sm:grid-cols-2">
          <li>· 10 XP por hora registrada (máximo 12 h por día).</li>
          <li>· {XP_RULES.activityXp} XP por actividad, hasta {XP_RULES.maxActivitiesPerDay} por día (si el día suma 10 min o una medida real).</li>
          <li>· Objetivo diario general: {XP_RULES.goalXp.daily.global} XP · por área: {XP_RULES.goalXp.daily.section} XP.</li>
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
  if (!progression) return <Skeleton className="h-64 rounded-3xl" />;
  const earned = progression.achievements.filter((a) => a.earned).length;
  return (
    <div className="space-y-10">
      <p className="-mt-4 text-sm text-muted-foreground">
        Desbloqueaste <b className="text-foreground">{earned}</b> de {progression.achievements.length} logros.
      </p>
      {CATEGORIES.map((category) => {
        const list = progression.achievements.filter((a) => a.definition.category === category);
        const done = list.filter((a) => a.earned).length;
        return (
          <section key={category}>
            <SectionTitle title={category} hint={`${done} de ${list.length}`} />
            {/* Una tarjeta por categoría (no una por logro): los logros se separan con aire. */}
            <Card className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
              {list.map((a) => (
                <div key={a.definition.code} className="flex min-w-0 items-start gap-3">
                  <AchievementBadge icon={a.definition.icon} earned={a.earned} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn("truncate text-sm font-semibold", !a.earned && "text-muted-foreground")}>{a.definition.title}</p>
                      {a.definition.xp > 0 && <span className="shrink-0 text-[11px] font-semibold text-xp-text">+{a.definition.xp} XP</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.definition.description}</p>
                    {a.earned ? (
                      <p className="mt-2 text-[11px] font-semibold text-primary-text">
                        {a.unlockedAt ? `Desbloqueado el ${formatKey(a.unlockedAt.slice(0, 10), "d 'de' MMMM yyyy")}` : "Desbloqueado"}
                      </p>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <Progress className="h-1.5" value={Math.min(1, a.current / Math.max(1, a.target))} />
                        <span className="shrink-0 text-[11px] text-muted-foreground tabular">
                          {Math.min(a.current, a.target).toLocaleString("es-AR")}/{a.target.toLocaleString("es-AR")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          </section>
        );
      })}
    </div>
  );
}

function RecordsGrid() {
  const { records } = useRecords();
  const { data: habits = [] } = useHabits();
  if (!records) return <Skeleton className="h-64 rounded-3xl" />;
  const habitName = records.longestHabitStreak ? habits.find((h) => h.id === records.longestHabitStreak!.habitId)?.name : null;
  const day = (key: string) => capitalize(formatKey(key, "EEEE d 'de' MMMM yyyy"));

  const items = [
    {
      icon: <StreakMark />,
      label: "Mayor racha",
      value: records.longestStreak ? `${records.longestStreak.days} días` : null,
      when: records.longestStreak
        ? `Del ${formatKey(records.longestStreak.from, "d 'de' MMM")} al ${formatKey(records.longestStreak.to, "d 'de' MMM yyyy")}`
        : null,
    },
    { icon: <Sun />, label: "Más horas en un día", value: records.bestDay && formatDuration(records.bestDay.seconds), when: records.bestDay && day(records.bestDay.date) },
    {
      icon: <CalendarRange />,
      label: "Más horas en una semana",
      value: records.bestWeek && formatDuration(records.bestWeek.seconds),
      when: records.bestWeek && `Semana del ${formatKey(records.bestWeek.from, "d 'de' MMMM yyyy")}`,
    },
    {
      icon: <CalendarDays />,
      label: "Más horas en un mes",
      value: records.bestMonth && formatDuration(records.bestMonth.seconds),
      when: records.bestMonth && capitalize(formatKey(records.bestMonth.month, "MMMM yyyy")),
    },
    {
      icon: <NotebookPen />,
      label: "Más actividades en un día",
      value: records.mostActivities && `${records.mostActivities.count}`,
      when: records.mostActivities && day(records.mostActivities.date),
    },
    {
      icon: <Gauge />,
      label: "Mejor cumplimiento mensual",
      value: records.bestCompliance && formatPercent(Math.min(1, records.bestCompliance.ratio)),
      when:
        records.bestCompliance &&
        `${capitalize(formatKey(records.bestCompliance.month, "MMMM yyyy"))} · ${records.bestCompliance.met} de ${records.bestCompliance.withGoal} días`,
    },
    {
      icon: <ListChecks />,
      label: "Mayor racha de un hábito",
      value: records.longestHabitStreak && streakLabel(records.longestHabitStreak.days, records.longestHabitStreak.unit),
      when: habitName,
    },
  ];

  if (items.every((i) => !i.value)) {
    return <EmptyState illustration={<SummitIllustration />} title="Tus récords te esperan" description="Registrá actividades y cumplí objetivos: tus mejores marcas aparecen acá." />;
  }

  return (
    <Card className="grid grid-cols-1 gap-x-8 gap-y-8 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
      {items.map((item) => (
        <StatTile key={item.label} icon={item.icon} label={item.label} value={item.value ?? "—"} hint={item.when ?? "Todavía sin datos"} />
      ))}
    </Card>
  );
}
