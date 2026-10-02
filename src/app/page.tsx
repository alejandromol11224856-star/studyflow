import { ChartColumn, Layers, ListChecks, type LucideIcon, Smartphone, Target, Timer, Trophy } from "lucide-react";
import Link from "next/link";
import { LandingCta } from "@/components/landing/landing-cta";
import { Logo } from "@/components/layout/logo";
import { ThemeToggleButton } from "@/components/layout/theme-toggle";

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Target,
    title: "Objetivos que se miden solos",
    text: "Tiempo, veces, páginas, distancia o repeticiones. Diarios, semanales o mensuales, con cuenta regresiva en vivo.",
  },
  {
    icon: ListChecks,
    title: "Hábitos con racha",
    text: "Todos los días o N veces por semana. Marcalos en un toque y mirá tu cumplimiento semanal y mensual.",
  },
  {
    icon: Timer,
    title: "Temporizador sincronizado",
    text: "Iniciá en la PC, pausá en el celular. El tiempo se registra solo al terminar.",
  },
  {
    icon: Layers,
    title: "Áreas 100% tuyas",
    text: "Estudio, Trabajo, Gimnasio, Meditación… creás las áreas que quieras, con su ícono, color y metas.",
  },
  {
    icon: Trophy,
    title: "Nivel, logros y récords",
    text: "Ganás XP por constancia (no por cargar actividades de más), desbloqueás logros y superás tus récords.",
  },
  {
    icon: ChartColumn,
    title: "Estadísticas claras",
    text: "Tiempo por día y por área, cumplimiento de objetivos, evolución de la racha y comparación con períodos anteriores.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggleButton />
            <LandingCta variant="header" />
          </div>
        </div>
      </header>

      <main>
        <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 text-center sm:pt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[28rem] w-[48rem] -translate-x-1/2 rounded-full bg-primary-soft opacity-80 blur-3xl"
          />
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-card">
            <span className="size-1.5 rounded-full bg-success" /> Objetivos, hábitos y constancia
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            Tu disciplina,{" "}
            <span className="bg-linear-to-r from-primary to-[#8f84fb] bg-clip-text text-transparent">medida cada día.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Cada día, una respuesta clara a “¿qué tengo que hacer hoy?”. Objetivos, hábitos, temporizador, rachas y
            estadísticas para estudiar, entrenar, trabajar o aprender lo que quieras.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LandingCta variant="hero" />
          </div>

          <HeroPreview />
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-[#0c0a1d] px-6 py-14 text-center text-white sm:px-12">
            <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full bg-[#5b4ef5] opacity-40 blur-[100px]" />
            <Smartphone className="relative mx-auto size-8 text-[#8f84fb]" />
            <h2 className="relative mt-4 text-3xl font-semibold tracking-tight">Pensada para usarla todos los días</h2>
            <p className="relative mx-auto mt-3 max-w-lg text-white/70">
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
          <p>© {new Date().getFullYear()} StudyFlow. Hecho para mantener la disciplina.</p>
          <Link href="/login" className="hover:text-foreground">
            Iniciar sesión
          </Link>
        </div>
      </footer>
    </div>
  );
}

/** Vista previa estática del dashboard (no usa datos reales). */
function HeroPreview() {
  const bars = [
    [40, 20, 0],
    [55, 15, 20],
    [30, 30, 10],
    [70, 10, 25],
    [60, 25, 0],
    [20, 0, 35],
    [45, 20, 10],
  ];
  return (
    <div className="relative mx-auto mt-14 max-w-4xl text-left" aria-hidden>
      <div className="rounded-[28px] border border-border bg-card/70 p-3 shadow-elevated backdrop-blur sm:p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div className="rounded-2xl border border-border bg-card p-5 sm:col-span-3">
            <p className="text-xs text-muted-foreground">Objetivo diario · 3h</p>
            <p className="mt-2 text-4xl font-semibold tabular tracking-tight sm:text-5xl">0:45:00</p>
            <p className="mt-1 text-xs text-muted-foreground">restantes para completar tu día</p>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-3/4 rounded-full bg-linear-to-r from-primary/60 to-primary" />
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span>
                <b>2h 15m</b> <span className="text-muted-foreground">/ 3h</span>
              </span>
              <b>75%</b>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 sm:col-span-2">
            <p className="text-xs text-muted-foreground">Esta semana</p>
            <div className="mt-4 flex h-28 items-end justify-between gap-2">
              {bars.map((stack, i) => (
                <div key={i} className="flex w-full max-w-5 flex-col-reverse gap-0.5">
                  {stack.map((h, j) =>
                    h ? (
                      <div
                        key={j}
                        className={j === stack.findLastIndex((v) => v > 0) ? "rounded-t-[4px]" : ""}
                        style={{ height: h, background: ["var(--sec-blue)", "var(--sec-orange)", "var(--sec-aqua)"][j] }}
                      />
                    ) : null,
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                <span key={d} className="w-full max-w-5 text-center">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
