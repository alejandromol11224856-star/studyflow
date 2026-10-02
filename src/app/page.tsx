import { CalendarDays, Compass, House, ListChecks, type LucideIcon, Shapes, Smartphone } from "lucide-react";
import Link from "next/link";
import { PathIllustration, SproutIllustration, TimerIllustration } from "@/components/brand/illustrations";
import { GrowthMark, LevelBadge, StreakMark, XpMark } from "@/components/brand/marks";
import { LandingCta } from "@/components/landing/landing-cta";
import { BRAND, Logo } from "@/components/layout/logo";
import { ThemeToggleButton } from "@/components/layout/theme-toggle";
import { DayRing } from "@/components/ui/day-ring";

type Icon = LucideIcon | React.ComponentType<{ className?: string }>;

const STEPS = [
  {
    art: SproutIllustration,
    title: "Elegí qué querés mejorar",
    text: "Estudio, programación, inglés, gimnasio… En tres preguntas queda armado tu día.",
  },
  {
    art: TimerIllustration,
    title: "Hacé un bloque por día",
    text: "Un Pomodoro, una sesión de Deep Work o un hábito de dos minutos. El tiempo se registra solo.",
  },
  {
    art: PathIllustration,
    title: "Mirá cómo avanzás",
    text: "Semana contra semana, mes contra mes. Una respuesta honesta a «¿estoy mejorando?».",
  },
];

const FEATURES: { icon: Icon; title: string; text: string }[] = [
  { icon: House, title: "Hoy, claro", text: "Qué toca hoy, cuánto te falta y con qué seguir. Sin ruido." },
  { icon: GrowthMark, title: "Progreso honesto", text: "Tendencias, constancia, récords y comparaciones que se entienden de un vistazo." },
  { icon: Compass, title: "Métodos que funcionan", text: "Pomodoro, Deep Work, Active Recall, Feynman… explicados y listos para empezar." },
  { icon: ListChecks, title: "Hábitos en cadena", text: "Marcalos en un toque. Racha, historial de semanas, pausar o archivar." },
  { icon: CalendarDays, title: "Calendario de constancia", text: "Cada día con su color: tiempo, objetivos, hábitos y rachas en un mismo mapa." },
  { icon: Shapes, title: "Áreas a tu medida", text: "Las creás vos, con su ícono, color y objetivo. Tiempo, páginas, kilómetros o veces." },
];

const METHOD_NAMES = ["Pomodoro", "Deep Work", "Time Blocking", "Active Recall", "Repetición espaciada", "Feynman", "Interleaving", "Leitner"];

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggleButton />
            <LandingCta variant="header" />
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-5 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
          <div>
            <p className="eyebrow">Estudio · hábitos · constancia</p>
            <h1 className="mt-4 font-display text-[44px] font-semibold leading-[1.02] sm:text-[64px]">
              Un poco todos los días termina siendo <span className="text-primary-text">muchísimo.</span>
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
              StudyFlow te muestra qué hacer hoy, mide tu tiempo y tus hábitos, y te dice con claridad si estás mejorando.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LandingCta variant="hero" />
            </div>
            <p className="mt-4 text-[13px] text-muted-foreground">Gratis · sin tarjeta · en la compu y en el celular</p>
          </div>
          <HeroPreview />
        </section>

        {/* Cómo funciona */}
        <section className="border-y border-border bg-subtle/60">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="eyebrow">Cómo funciona</p>
            <h2 className="mt-3 max-w-xl font-display text-[34px] font-semibold leading-tight sm:text-[40px]">Tres pasos. Después, solo aparecer.</h2>
            <ol className="mt-12 grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8">
              {STEPS.map((step, i) => (
                <li key={step.title}>
                  <step.art className="w-36" />
                  <p className="mt-5 font-display text-sm font-semibold text-muted-foreground tabular">0{i + 1}</p>
                  <h3 className="mt-1 font-display text-[22px] font-semibold">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Qué incluye */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <p className="eyebrow">Qué incluye</p>
              <h2 className="mt-3 font-display text-[34px] font-semibold leading-tight sm:text-[40px]">Todo lo necesario. Nada que distraiga.</h2>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
                Ganás XP por constancia, no por cargar actividades de más. Subís de nivel cumpliendo lo que te propusiste.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <LevelBadge level={7} size={44} />
                <div>
                  <p className="text-sm font-semibold">Nivel 7 · Ritmo</p>
                  <p className="inline-flex items-center gap-1 text-[13px] font-semibold text-xp-text">
                    <XpMark className="size-3.5" /> +25 XP por cumplir tu objetivo del día
                  </p>
                </div>
              </div>
            </div>
            <ul className="grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
                    <f.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Métodos */}
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <p className="eyebrow">Métodos incluidos</p>
          <p className="mt-4 font-display text-[26px] font-semibold leading-snug text-foreground/85 sm:text-[34px]">
            {METHOD_NAMES.map((name, i) => (
              <span key={name}>
                {name}
                {i < METHOD_NAMES.length - 1 && <span className="mx-2.5 text-primary-text/60" aria-hidden>·</span>}
              </span>
            ))}
          </p>
          <p className="mt-4 max-w-xl text-[15px] text-muted-foreground">
            Y seis técnicas para que los hábitos se sostengan: la regla de los dos minutos, habit stacking, no cortar la cadena y más.
          </p>
        </section>

        {/* Cierre */}
        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="relative overflow-hidden rounded-[32px] px-6 py-16 text-center text-[#f4f0e8] sm:px-12" style={{ background: "#0f1714" }}>
            <svg aria-hidden viewBox="0 0 600 600" className="pointer-events-none absolute -right-48 -top-40 w-[560px] opacity-[0.14]">
              <path d="M40 420c90 0 110-190 210-190s115 120 195 120c50 0 75-60 90-125" fill="none" stroke={BRAND.paper} strokeWidth="18" strokeLinecap="round" />
              <circle cx="537" cy="226" r="26" fill={BRAND.sun} />
            </svg>
            <Smartphone className="relative mx-auto size-7 text-[#3fbf9c]" aria-hidden />
            <h2 className="relative mx-auto mt-4 max-w-lg font-display text-[34px] font-semibold leading-tight">Pensada para usarla todos los días.</h2>
            <p className="relative mx-auto mt-3 max-w-md text-[#f4f0e8]/70">
              Funciona en la computadora y en el celular. Agregala a tu pantalla de inicio y usala como una app.
            </p>
            <div className="relative mt-8 flex justify-center">
              <LandingCta variant="dark" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} StudyFlow · Un poco todos los días.</p>
          <Link href="/login" className="hover:text-foreground">
            Iniciar sesión
          </Link>
        </div>
      </footer>
    </div>
  );
}

/** Vista previa estática de la pantalla Hoy (no usa datos reales). */
function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="rounded-[32px] border border-border bg-card p-6 shadow-elevated sm:p-7">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Martes 14</p>
          <div className="flex gap-1.5">
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-streak-soft px-2.5 text-xs font-semibold text-streak-text">
              <StreakMark className="size-3.5" /> 6 días
            </span>
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-xp-soft px-2.5 text-xs font-semibold text-xp-text">
              <XpMark className="size-3" /> Nivel 7
            </span>
          </div>
        </div>
        <p className="mt-4 font-display text-[28px] font-semibold leading-tight">Buenas tardes, Sofi.</p>
        <p className="mt-1 text-sm text-muted-foreground">Ya hiciste más de la mitad. Lo que sigue es más fácil.</p>

        <div className="mt-6 flex items-center gap-5">
          <DayRing value={0.74} size={128} stroke={10} label="Progreso de ejemplo">
            <span className="font-display text-[22px] font-semibold leading-none tabular">2h 14m</span>
            <span className="mt-1 text-[11px] text-muted-foreground">de 3h</span>
          </DayRing>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-muted-foreground">Objetivo de hoy</p>
            <p className="mt-1 font-display text-xl font-semibold leading-tight">Te faltan 46 minutos.</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 text-background">
          <span className="flex size-9 items-center justify-center rounded-xl bg-background/15 font-display text-sm font-semibold">25</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Pomodoro · Programación</p>
            <p className="text-xs opacity-70">Bloque 2 de 4 · descanso en 12 min</p>
          </div>
          <span className="font-display text-lg font-semibold tabular">12:48</span>
        </div>
      </div>
    </div>
  );
}
