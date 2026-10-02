"use client";

import { ArrowLeft, ArrowRight, BookOpen, Check, CodeXml, Compass, Dumbbell, GraduationCap, House, Languages, ListChecks, Plus, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SproutIllustration } from "@/components/brand/illustrations";
import { GrowthMark } from "@/components/brand/marks";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateHabit,
  useCreateSection,
  useHabits,
  useProfile,
  useSections,
  useSetGoal,
  useToday,
  useUpdatePreferences,
  useUpdateProfile,
} from "@/hooks/use-data";
import { formatMinutes } from "@/lib/format";
import { guessSectionIcon, nextSectionColor } from "@/lib/sections";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Área que se crea (null = no es un área). */
  area: string | null;
}

const OPTIONS: Option[] = [
  { id: "study", label: "Estudio", icon: GraduationCap, area: "Estudio" },
  { id: "programming", label: "Programación", icon: CodeXml, area: "Programación" },
  { id: "english", label: "Inglés", icon: Languages, area: "Inglés" },
  { id: "gym", label: "Gimnasio", icon: Dumbbell, area: "Gimnasio" },
  { id: "reading", label: "Lectura", icon: BookOpen, area: "Lectura" },
  { id: "habits", label: "Hábitos", icon: ListChecks, area: null },
];

const TIME_OPTIONS = [
  { minutes: 15, hint: "Para arrancar sin presión" },
  { minutes: 30, hint: "Un bloque por día" },
  { minutes: 60, hint: "Un avance que se nota" },
  { minutes: 120, hint: "Dedicación seria" },
  { minutes: 180, hint: "Modo intensivo" },
];

const GOAL_EXAMPLES = ["Aprobar los finales", "Conseguir mi primer trabajo de programador", "Hablar inglés con fluidez", "Entrenar 4 veces por semana", "Leer 20 libros este año"];

const STEPS = 3;

const STARTER_HABIT = "Planificar el día (2 minutos)";

export function OnboardingFlow() {
  const router = useRouter();
  const today = useToday();
  const { data: profile } = useProfile();
  const { data: existing = [] } = useSections();
  const { data: habits = [] } = useHabits();
  const updateProfile = useUpdateProfile();
  const updatePrefs = useUpdatePreferences();
  const createSection = useCreateSection();
  const createHabit = useCreateHabit();
  const setGoal = useSetGoal();

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [other, setOther] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [minutes, setMinutes] = useState<number | null>(60);
  const [mainGoalDraft, setMainGoal] = useState<string | null>(null);
  const mainGoal = mainGoalDraft ?? profile?.mainGoal ?? "";
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ areas: string[]; minutes: number | null; habit: boolean } | null>(null);

  const firstName = (profile?.displayName ?? "").split(" ")[0];
  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function skip() {
    await updatePrefs.mutateAsync({ onboarding: { skippedAt: new Date().toISOString() } }).catch(() => undefined);
    router.replace("/dashboard");
  }

  async function finish() {
    setBusy(true);
    try {
      const existingNames = new Set(existing.filter((s) => !s.archivedAt).map((s) => s.name.toLowerCase()));
      const areas = [
        ...OPTIONS.filter((o) => selected.includes(o.id) && o.area).map((o) => o.area!),
        ...(showOther && other.trim() ? [other.trim().slice(0, 40)] : []),
      ].filter((a, i, all) => !existingNames.has(a.toLowerCase()) && all.findIndex((x) => x.toLowerCase() === a.toLowerCase()) === i);

      const used = existing.map((s) => s.color as string);
      for (const area of areas) {
        const color = nextSectionColor(used);
        used.push(color);
        await createSection.mutateAsync({ name: area, icon: guessSectionIcon(area), color });
      }
      const wantsHabit = selected.includes("habits");
      // Si repetís la configuración, no duplicar el hábito inicial.
      const hasStarter = habits.some((h) => !h.archivedAt && h.name.toLowerCase() === STARTER_HABIT.toLowerCase());
      if (wantsHabit && !hasStarter) {
        // Un primer hábito chico, con la regla de los 2 minutos.
        await createHabit.mutateAsync({
          name: STARTER_HABIT,
          icon: "check",
          color: nextSectionColor(used),
          sectionId: null,
          frequency: "daily",
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          weeklyTarget: 3,
          reminderTime: null,
          startDate: today,
        });
      }
      if (minutes) {
        await setGoal.mutateAsync({ sectionId: null, period: "daily", metric: "time", target: minutes, effectiveFrom: today });
      }
      if (mainGoal.trim() !== (profile?.mainGoal ?? "")) await updateProfile.mutateAsync({ mainGoal: mainGoal.trim() || null });
      await updatePrefs.mutateAsync({ onboarding: { completedAt: new Date().toISOString(), intents: selected } });
      setCreated({ areas, minutes, habit: wantsHabit });
    } catch {
      // El aviso de error lo muestra el gestor global.
    } finally {
      setBusy(false);
    }
  }

  async function start(withTour: boolean) {
    if (!withTour) await updatePrefs.mutateAsync({ onboarding: { tourDismissedAt: new Date().toISOString() } }).catch(() => undefined);
    router.replace(withTour ? "/dashboard?tour=1" : "/dashboard");
  }

  if (created) {
    const ideas: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }[] = [
      { icon: House, title: "Hoy", text: "Qué hacer ahora y cuánto avanzaste. Es tu pantalla de todos los días." },
      { icon: GrowthMark, title: "Progreso", text: "Si estás mejorando, tu nivel y tus récords." },
      { icon: Compass, title: "Métodos", text: "Pomodoro, Active Recall y técnicas para tus hábitos." },
    ];
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header>
          <Logo />
        </header>
        <div className="flex flex-1 flex-col justify-center py-10 animate-page-in">
          <SproutIllustration className="w-36" />
          <h1 className="mt-5 font-display text-[38px] font-semibold leading-[1.05]">Listo{firstName ? `, ${firstName}` : ""}.</h1>
          <p className="mt-3 text-[17px] leading-relaxed text-muted-foreground">
            {created.areas.length ? `Creamos tus áreas: ${created.areas.join(", ")}. ` : ""}
            {created.minutes ? `Tu meta diaria: ${formatMinutes(created.minutes)}. ` : ""}
            {created.habit ? "Y un primer hábito chico para empezar. " : ""}
            Todo se puede cambiar cuando quieras.
          </p>
          <ul className="mt-8 space-y-4">
            {ideas.map((idea) => (
              <li key={idea.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-text">
                  <idea.icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{idea.title}</p>
                  <p className="text-[15px] text-muted-foreground">{idea.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <Button variant="gradient" size="xl" className="w-full" onClick={() => void start(false)}>
            Empezar <ArrowRight />
          </Button>
          <Button variant="ghost" size="lg" className="w-full" onClick={() => void start(true)}>
            Ver un recorrido rápido
          </Button>
        </div>
      </div>
    );
  }

  const canContinue = step === 0 ? selected.length > 0 || Boolean(showOther && other.trim()) : true;

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <Logo />
        <Button variant="ghost" size="sm" onClick={() => void skip()} disabled={busy}>
          Saltar por ahora
        </Button>
      </header>

      <div className="mt-8 flex gap-2" role="progressbar" aria-label="Pasos" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1}>
        {Array.from({ length: STEPS }, (_, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-500", i <= step ? "bg-primary" : "bg-muted")} />
        ))}
      </div>

      <div key={step} className="mt-10 flex-1 animate-page-in">
        {step === 0 && (
          <>
            <p className="eyebrow">{firstName ? `Hola, ${firstName}` : "Para empezar"}</p>
            <h1 className="mt-2 font-display text-[34px] font-semibold leading-[1.08]">¿Qué querés mejorar?</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">Elegí una o varias. Cada una se convierte en un área para medir tu progreso.</p>
            <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {OPTIONS.map((o) => {
                const on = selected.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(o.id)}
                    className={cn(
                      "relative flex flex-col items-start gap-3 rounded-3xl border p-4 text-left transition-all active:scale-[0.98]",
                      on ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-foreground/20",
                    )}
                  >
                    <o.icon className={cn("size-6", on ? "text-primary-text" : "text-muted-foreground")} />
                    <span className="text-[15px] font-semibold">{o.label}</span>
                    {on && (
                      <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={showOther}
                onClick={() => setShowOther((v) => !v)}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-3xl border border-dashed p-4 text-left transition-all active:scale-[0.98]",
                  showOther ? "border-primary bg-primary-soft" : "border-border hover:border-foreground/20",
                )}
              >
                <Plus className={cn("size-6", showOther ? "text-primary-text" : "text-muted-foreground")} />
                <span className="text-[15px] font-semibold">Otro</span>
              </button>
            </div>
            {showOther && (
              <Input
                className="mt-3"
                autoFocus
                value={other}
                onChange={(e) => setOther(e.target.value)}
                maxLength={40}
                placeholder="Ej: Facultad, Trabajo, Guitarra…"
                aria-label="Otra área"
              />
            )}
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="font-display text-[34px] font-semibold leading-[1.08]">¿Cuánto tiempo querés dedicarle por día?</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">Va a ser tu meta diaria. Mejor empezar con algo que puedas sostener.</p>
            <div className="mt-7 space-y-2.5" role="radiogroup" aria-label="Tiempo por día">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.minutes}
                  type="button"
                  role="radio"
                  aria-checked={minutes === t.minutes}
                  onClick={() => setMinutes(t.minutes)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all active:scale-[0.99]",
                    minutes === t.minutes ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-foreground/20",
                  )}
                >
                  <span className="font-display text-[22px] font-semibold">{formatMinutes(t.minutes)}</span>
                  <span className="text-sm text-muted-foreground">{t.hint}</span>
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={minutes === null}
                onClick={() => setMinutes(null)}
                className={cn(
                  "w-full rounded-2xl px-5 py-3 text-left text-[15px] font-semibold transition",
                  minutes === null ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Prefiero no fijarlo por ahora
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-display text-[34px] font-semibold leading-[1.08]">¿Cuál es tu objetivo?</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">Lo vas a ver en Hoy, como recordatorio de para qué hacés esto. Es opcional.</p>
            <Input
              className="mt-7 h-14 text-[17px]"
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
              maxLength={160}
              placeholder="¿Qué querés lograr?"
              aria-label="Tu objetivo"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {GOAL_EXAMPLES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setMainGoal(g)}
                  className="rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium transition hover:border-foreground/20 active:scale-95"
                >
                  {g}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="mt-10 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || busy}>
          <ArrowLeft /> Atrás
        </Button>
        {step < STEPS - 1 ? (
          <Button variant="gradient" size="lg" onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
            Siguiente <ArrowRight />
          </Button>
        ) : (
          <Button variant="gradient" size="lg" onClick={() => void finish()} loading={busy}>
            Crear mi StudyFlow
          </Button>
        )}
      </footer>
    </div>
  );
}
