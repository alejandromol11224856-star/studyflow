"use client";

import { ArrowLeft, ArrowRight, Check, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/layout/logo";
import { SectionAvatar } from "@/components/sections/section-visuals";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useCreateSection, useProfile, useSections, useSetGoal, useToday, useUpdatePreferences, useUpdateProfile } from "@/hooks/use-data";
import { formatMinutes } from "@/lib/format";
import { SECTION_SUGGESTIONS, guessSectionIcon, nextSectionColor } from "@/lib/sections";
import { cn } from "@/lib/utils";

const INTENTS = [
  { id: "study", label: "📚 Estudiar mejor", areas: ["Estudio", "Lectura"] },
  { id: "fitness", label: "💪 Entrenar más", areas: ["Gimnasio", "Deporte"] },
  { id: "language", label: "🗣️ Aprender un idioma", areas: ["Idiomas"] },
  { id: "work", label: "💼 Ser más productivo", areas: ["Trabajo", "Proyecto personal"] },
  { id: "wellbeing", label: "🧘 Cuidar mi bienestar", areas: ["Meditación"] },
  { id: "create", label: "🎨 Crear o aprender algo nuevo", areas: ["Programación", "Música", "Escritura"] },
];

const DAILY_OPTIONS = [0, 30, 60, 120, 180, 240];
const STEPS = ["Vos", "Áreas", "Objetivo"];

export function OnboardingFlow() {
  const router = useRouter();
  const today = useToday();
  const { data: profile } = useProfile();
  const { data: existing = [] } = useSections();
  const updateProfile = useUpdateProfile();
  const updatePrefs = useUpdatePreferences();
  const createSection = useCreateSection();
  const setGoal = useSetGoal();

  const [step, setStep] = useState(0);
  // null = todavía no editado: se usa lo que venga del perfil (aunque cargue después).
  const [nameDraft, setName] = useState<string | null>(null);
  const [intentsDraft, setIntentsDraft] = useState<string[] | null>(null);
  const name = nameDraft ?? profile?.displayName ?? "";
  const intents = intentsDraft ?? profile?.preferences.onboarding.intents ?? [];
  const setIntents = (fn: (prev: string[]) => string[]) => setIntentsDraft(fn(intents));
  const [areas, setAreas] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [mainGoalDraft, setMainGoal] = useState<string | null>(null);
  const mainGoal = mainGoalDraft ?? profile?.mainGoal ?? "";
  const [dailyMinutes, setDailyMinutes] = useState(0);
  const [busy, setBusy] = useState(false);

  const existingNames = new Set(existing.filter((s) => !s.archivedAt).map((s) => s.name.toLowerCase()));
  const suggested = [...new Set([...INTENTS.filter((i) => intents.includes(i.id)).flatMap((i) => i.areas), ...SECTION_SUGGESTIONS])].filter(
    (a) => !areas.some((x) => x.toLowerCase() === a.toLowerCase()) && !existingNames.has(a.toLowerCase()),
  );

  const previewColors = (() => {
    const used: string[] = existing.map((s) => s.color);
    return areas.map(() => {
      const c = nextSectionColor(used);
      used.push(c);
      return c;
    });
  })();

  const addArea = (value: string) => {
    const v = value.trim().slice(0, 40);
    if (!v || areas.some((a) => a.toLowerCase() === v.toLowerCase()) || existingNames.has(v.toLowerCase())) return;
    setAreas((prev) => [...prev, v]);
    setDraft("");
  };

  async function skip() {
    await updatePrefs.mutateAsync({ onboarding: { skippedAt: new Date().toISOString() } }).catch(() => undefined);
    router.replace("/dashboard");
  }

  async function finish() {
    setBusy(true);
    try {
      await updateProfile.mutateAsync({
        ...(name.trim() && { displayName: name.trim() }),
        mainGoal: mainGoal.trim() || null,
      });
      const used = existing.map((s) => s.color as string);
      for (const area of areas) {
        const color = nextSectionColor(used);
        used.push(color);
        await createSection.mutateAsync({ name: area, icon: guessSectionIcon(area), color });
      }
      if (dailyMinutes > 0) {
        await setGoal.mutateAsync({ sectionId: null, period: "daily", metric: "time", target: dailyMinutes, effectiveFrom: today });
      }
      await updatePrefs.mutateAsync({ onboarding: { completedAt: new Date().toISOString(), intents } });
      toast.success("¡Listo! Tu StudyFlow está armado 🎉", { description: "Empezá por lo que tenés para hoy." });
      router.replace("/dashboard");
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <Logo />
        <Button variant="ghost" size="sm" onClick={() => void skip()} disabled={busy}>
          Saltar por ahora
        </Button>
      </header>

      <ol className="mt-8 flex gap-2" aria-label="Pasos">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <span className={cn("block h-2 rounded-full transition-colors duration-500", i <= step ? "bg-[image:var(--gradient-primary)]" : "bg-muted")} />
            <span className={cn("mt-1.5 block text-xs", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>{label}</span>
          </li>
        ))}
      </ol>

      <div key={step} className="mt-8 flex-1 animate-slide-up">
        {step === 0 && (
          <>
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">👋 Contanos un poco de vos</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Esto nos ayuda a sugerirte un buen punto de partida.</p>
            <Field label="¿Cómo te llamás?" className="mt-6">
              {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Tu nombre" />}
            </Field>
            <p className="mt-6 text-[13px] font-medium">¿Qué querés conseguir? <span className="font-normal text-muted-foreground">(elegí las que quieras)</span></p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {INTENTS.map((i) => {
                const on = intents.includes(i.id);
                return (
                  <button
                    key={i.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setIntents((prev) => (on ? prev.filter((x) => x !== i.id) : [...prev, i.id]))}
                    className={cn(
                      "flex min-h-14 items-center justify-between rounded-2xl border px-4 py-3 text-left text-[15px] font-semibold transition-all active:scale-[0.98]",
                      on ? "border-primary bg-primary-soft text-primary-text" : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    {i.label}
                    {on && <Check className="size-4" />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">🧩 ¿Qué áreas querés medir?</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Escribí las tuyas o tocá una sugerencia. Podés cambiar todo después.</p>
            <form
              className="mt-6 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addArea(draft);
              }}
            >
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ej: Facultad, Trabajo, Running…" maxLength={40} aria-label="Nueva área" />
              <Button type="submit" variant="outline" size="icon" aria-label="Agregar área" disabled={!draft.trim()}>
                <Plus />
              </Button>
            </form>
            {(areas.length > 0 || existing.length > 0) && (
              <ul className="mt-4 space-y-2">
                {existing
                  .filter((s) => !s.archivedAt)
                  .map((s) => (
                    <li key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                      <SectionAvatar section={s} size="sm" />
                      <span className="flex-1 text-sm font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground">Ya creada</span>
                    </li>
                  ))}
                {areas.map((a, i) => (
                  <li key={a} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 animate-scale-in">
                    <SectionAvatar section={{ icon: guessSectionIcon(a), color: previewColors[i] }} size="sm" />
                    <span className="flex-1 text-sm font-medium">{a}</span>
                    <button
                      type="button"
                      onClick={() => setAreas((prev) => prev.filter((x) => x !== a))}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={`Quitar ${a}`}
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {suggested.length > 0 && (
              <>
                <p className="mt-6 text-xs font-medium text-muted-foreground">Sugerencias</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggested.slice(0, 10).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => addArea(a)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-semibold transition hover:bg-muted active:scale-95"
                    >
                      <Plus className="size-3.5 text-muted-foreground" /> {a}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">🎯 Tu objetivo</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Lo vas a ver todos los días en Hoy, como recordatorio de para qué hacés esto.</p>
            <Field label="Objetivo principal" hint="Opcional. Ej: Aprobar los finales de diciembre, correr 10 km, leer 20 libros este año." className="mt-6">
              {(id) => <Input id={id} value={mainGoal} onChange={(e) => setMainGoal(e.target.value)} maxLength={160} placeholder="¿Qué querés lograr?" />}
            </Field>
            <p className="mt-6 text-[13px] font-medium">Objetivo diario de tiempo <span className="font-normal text-muted-foreground">(opcional)</span></p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAILY_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={dailyMinutes === m}
                  onClick={() => setDailyMinutes(m)}
                  className={cn(
                    "h-12 rounded-2xl border px-5 text-[15px] font-bold transition-all active:scale-95",
                    dailyMinutes === m ? "border-transparent bg-[image:var(--gradient-primary)] text-primary-foreground shadow-md shadow-primary/25" : "border-border bg-card hover:bg-muted",
                  )}
                >
                  {m ? formatMinutes(m) : "Sin meta"}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Después podés sumar metas de veces, páginas o distancia, y hábitos.</p>
          </>
        )}
      </div>

      <footer className="mt-10 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || busy}>
          <ArrowLeft /> Atrás
        </Button>
        {step < STEPS.length - 1 ? (
          <Button variant="gradient" size="lg" onClick={() => setStep((s) => s + 1)}>
            Siguiente <ArrowRight />
          </Button>
        ) : (
          <Button variant="gradient" size="lg" onClick={() => void finish()} loading={busy}>
            Empezar 🚀
          </Button>
        )}
      </footer>
    </div>
  );
}
