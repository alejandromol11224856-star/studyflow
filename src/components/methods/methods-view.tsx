"use client";

import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  BrainCircuit,
  CalendarRange,
  Check,
  Clock,
  Hourglass,
  LampDesk,
  Layers,
  Link2,
  type LucideIcon,
  MapPin,
  MessageCircleQuestionMark,
  Play,
  Plus,
  Presentation,
  Repeat2,
  Shuffle,
  Sprout,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BookIllustration, ChainIllustration, TimerIllustration } from "@/components/brand/illustrations";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/misc";
import { METHODS, type Method, type MethodKind } from "@/lib/methods";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  pomodoro: Timer,
  "deep-work": BrainCircuit,
  "time-blocking": CalendarRange,
  "active-recall": MessageCircleQuestionMark,
  "spaced-repetition": Repeat2,
  feynman: Presentation,
  interleaving: Shuffle,
  leitner: Boxes,
  "habit-stacking": Layers,
  "two-minute-rule": Hourglass,
  "implementation-intentions": MapPin,
  "environment-design": LampDesk,
  "minimum-viable-habit": Sprout,
  "dont-break-the-chain": Link2,
};

export function MethodIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Sprout;
  return (
    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-text", className)}>
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

/** La acción de cada método: empezar una sesión con ese plan o crear un hábito. */
export function MethodAction({ method, size = "lg", className }: { method: Method; size?: "lg" | "xl"; className?: string }) {
  const dialogs = useDialogs();
  if (method.session) {
    const { methodId, title, label } = method.session;
    return (
      <Button variant="gradient" size={size} className={className} onClick={() => dialogs.openStartTimer(undefined, { methodId, title })}>
        <Play className="fill-current" /> {label}
      </Button>
    );
  }
  if (method.habit) {
    const { name } = method.habit;
    return (
      <Button variant="gradient" size={size} className={className} onClick={() => dialogs.openHabitForm(undefined, { name })}>
        <Plus /> Crear un hábito con este método
      </Button>
    );
  }
  return null;
}

function MethodCard({ method }: { method: Method }) {
  return (
    <Link
      href={`/methods/${method.slug}`}
      className="lift group flex flex-col rounded-3xl border border-border bg-card p-5 shadow-card focus-visible:outline-2"
    >
      <MethodIcon slug={method.slug} />
      <h3 className="mt-4 font-display text-[21px] font-semibold leading-tight">{method.name}</h3>
      <p className="mt-1 text-[15px] text-muted-foreground">{method.tagline}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-5 text-[13px] font-semibold">
        {method.duration ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5" /> {method.duration}
          </span>
        ) : (
          <span className="text-muted-foreground">Para construir hábitos</span>
        )}
        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </Link>
  );
}

export function MethodsView({ initialKind = "study" }: { initialKind?: MethodKind }) {
  const [kind, setKind] = useState<MethodKind>(initialKind);
  const pomodoro = METHODS.find((m) => m.slug === "pomodoro")!;
  const list = METHODS.filter((m) => m.kind === kind && (kind === "habit" || m.slug !== "pomodoro"));

  return (
    <div className="space-y-10 pb-4">
      <PageHeader
        eyebrow="Métodos"
        title="Mejores sistemas, mejores resultados."
        description="Técnicas probadas para estudiar con foco y para sostener hábitos. Cada una termina en algo concreto para hacer hoy."
        actions={
          <SegmentedControl
            value={kind}
            onChange={setKind}
            options={[
              { value: "study", label: "Estudio" },
              { value: "habit", label: "Hábitos" },
            ]}
          />
        }
      />

      {kind === "study" ? (
        <Card className="flex flex-col items-center gap-6 overflow-clip p-6 sm:flex-row sm:p-8">
          <TimerIllustration className="w-40 shrink-0 sm:w-48" />
          <div className="flex-1 text-center sm:text-left">
            <p className="eyebrow">Para empezar</p>
            <h2 className="mt-2 font-display text-[28px] font-semibold leading-tight">Pomodoro: 25 minutos de foco, 5 de descanso.</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              El método más simple para arrancar cuando cuesta. StudyFlow te avisa cuando termina cada bloque.
            </p>
            <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row">
              <MethodAction method={pomodoro} />
              <Link href="/methods/pomodoro" className="px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                Cómo funciona
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col items-center gap-6 overflow-clip p-6 sm:flex-row sm:p-8">
          <ChainIllustration className="w-40 shrink-0 sm:w-48" />
          <div className="flex-1 text-center sm:text-left">
            <p className="eyebrow">La idea central</p>
            <h2 className="mt-2 font-display text-[28px] font-semibold leading-tight">Un hábito es un sistema, no fuerza de voluntad.</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Hacelo chico, decidí cuándo y dónde, y que sea fácil de empezar. Estos métodos te ayudan a armarlo.
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((m) => (
          <MethodCard key={m.slug} method={m} />
        ))}
      </div>
    </div>
  );
}

export function MethodDetail({ method }: { method: Method }) {
  const related = METHODS.filter((m) => m.kind === method.kind && m.slug !== method.slug).slice(0, 3);
  return (
    <article className="max-w-3xl pb-6">
      <Link href="/methods" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Métodos
      </Link>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <MethodIcon slug={method.slug} className="size-14 rounded-[20px] [&_svg]:size-6" />
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{method.kind === "study" ? "Método de estudio" : "Método para hábitos"}</p>
          <h1 className="mt-2 font-display text-[36px] font-semibold leading-[1.08] sm:text-[44px]">{method.name}</h1>
          <p className="mt-2 text-[18px] text-muted-foreground">{method.tagline}</p>
          {method.duration && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[13px] font-semibold">
              <Clock className="size-3.5" /> {method.duration}
            </p>
          )}
        </div>
      </header>

      <div className="mt-6">
        <MethodAction method={method} size="xl" className="w-full sm:w-auto" />
      </div>

      <div className="mt-12 space-y-10">
        <section>
          <h2 className="font-display text-[24px] font-semibold">Qué es</h2>
          <p className="mt-2 text-[17px] leading-relaxed text-foreground/85">{method.what}</p>
        </section>

        <section>
          <h2 className="font-display text-[24px] font-semibold">Cómo funciona</h2>
          <ol className="mt-4 space-y-4">
            {method.how.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-semibold text-background">
                  {i + 1}
                </span>
                <p className="pt-1 text-[16px] leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="font-display text-[24px] font-semibold">Cuándo usarlo</h2>
          <ul className="mt-3 space-y-2.5">
            {method.when.map((w, i) => (
              <li key={i} className="flex gap-3 text-[16px]">
                <Check className="mt-1 size-4 shrink-0 text-primary-text" strokeWidth={3} />
                {w}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-[24px] font-semibold">Un ejemplo</h2>
          <Card className="mt-3 flex gap-4 p-5 sm:p-6">
            <BookIllustration className="hidden w-24 shrink-0 sm:block" />
            <div>
              <p className="text-[15px] font-semibold text-muted-foreground">{method.example.context}</p>
              <p className="mt-1.5 font-display text-[21px] font-medium leading-snug">{method.example.text}</p>
            </div>
          </Card>
        </section>

        {method.origin && <p className="text-[13px] text-muted-foreground">{method.origin}</p>}

        <div className="flex flex-col items-center gap-3 rounded-3xl bg-primary-soft px-6 py-8 text-center">
          <p className="font-display text-[22px] font-semibold">¿Lo probás hoy?</p>
          <MethodAction method={method} />
        </div>

        {related.length > 0 && (
          <section>
            <h2 className="font-display text-[22px] font-semibold">También te puede servir</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {related.map((m) => (
                <Link key={m.slug} href={`/methods/${m.slug}`} className="lift flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-card">
                  <MethodIcon slug={m.slug} className="size-9 rounded-xl [&_svg]:size-4" />
                  <span className="truncate text-[15px] font-semibold">{m.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
