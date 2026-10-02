"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface TourStep {
  /** Valor de data-tour del elemento a resaltar (sin target: tarjeta centrada). */
  target?: string;
  emoji: string;
  title: string;
  body: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: "daily-goal",
    emoji: "🎯",
    title: "Tu objetivo diario",
    body: "Acá ves cuánto llevás hoy y cuánto te falta. Tocá «Cambiar» para elegir tu meta: tiempo, páginas, km o repeticiones.",
  },
  {
    target: "timer",
    emoji: "⏱️",
    title: "El temporizador",
    body: "Tocá «Comenzar sesión» cuando empieces. Podés pausarlo y, al terminar, se guarda solo en tu día.",
  },
  {
    target: "areas",
    emoji: "🧩",
    title: "Tus áreas",
    body: "Programación, Gym, Inglés… cada área tiene su ícono, color y objetivo. Tocá ▶ para empezar una sesión de esa área.",
  },
  {
    target: "habits",
    emoji: "🔥",
    title: "Hábitos",
    body: "Lo que querés hacer seguido. Marcalo con un toque y mirá crecer tu racha.",
  },
  {
    target: "progress",
    emoji: "📈",
    title: "Tu progreso",
    body: "Nivel, XP, racha, tu mejor día y cómo vas frente a la semana pasada. Las estadísticas completas también están ahí.",
  },
  { emoji: "🎉", title: "¡Ya estás listo!", body: "Tu progreso comienza hoy." },
];

const PAD = 8;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Primer elemento visible con ese data-tour (puede haber uno en el menú del celular y otro en el de escritorio). */
function findTarget(name: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
  for (const node of nodes) {
    const r = node.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(node).visibility !== "hidden") return node;
  }
  return null;
}

function sameRect(a: Rect | null, b: Rect | null) {
  return a === b || (!!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);
}

// ---------------------------------------------------------------------------
// Bienvenida: "¿Querés que te mostremos cómo funciona?"
// ---------------------------------------------------------------------------
export function WelcomeDialog({
  open,
  name,
  onStart,
  onLater,
}: {
  open: boolean;
  name?: string;
  onStart: () => void;
  onLater: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onLater()}>
      <DialogContent title={`¡Bienvenido a StudyFlow${name ? `, ${name}` : ""}! 👋`} size="sm" hideHeader>
        <div className="pt-2 text-center">
          <div aria-hidden className="mx-auto flex size-20 items-center justify-center rounded-[28px] bg-primary-soft text-[40px] animate-bounce-soft">
            👋
          </div>
          <h2 className="mt-5 text-2xl font-extrabold tracking-tight">
            ¡Bienvenido a StudyFlow{name ? `, ${name}` : ""}!
          </h2>
          <p className="mt-2 text-[15px] text-muted-foreground">¿Querés que te mostremos cómo funciona?</p>
          <p className="mt-1 text-xs text-muted-foreground">Son 5 pasos cortos. Menos de un minuto.</p>
          <div className="mt-7 space-y-2">
            <Button variant="gradient" size="xl" className="w-full" onClick={onStart} autoFocus>
              🚀 Sí, mostrarme
            </Button>
            <Button variant="ghost" size="lg" className="w-full" onClick={onLater}>
              Ahora no
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Tutorial que resalta elementos reales de la interfaz
// ---------------------------------------------------------------------------
export function ProductTour({ open, onFinish, onSkip }: { open: boolean; onFinish: () => void; onSkip: () => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const primaryRef = useRef<HTMLButtonElement>(null);
  const step = TOUR_STEPS[index];
  const last = index === TOUR_STEPS.length - 1;

  const next = useCallback(() => (last ? onFinish() : setIndex((i) => i + 1)), [last, onFinish]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Llevar el elemento a la vista y seguir su posición (scroll, resize, cambios de layout).
  useEffect(() => {
    if (!open) return;
    const el = step.target ? findTarget(step.target) : null;
    if (el) {
      // Solo se desplaza la ventana: scrollIntoView también movería contenedores
      // con overflow oculto (y dejaría tarjetas "corridas").
      const r = el.getBoundingClientRect();
      const fixedAncestor = el.closest("nav, aside");
      if (!fixedAncestor) {
        window.scrollTo({
          top: Math.max(0, window.scrollY + r.top - (window.innerHeight - r.height) / 2),
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
      }
    }
    let frame = 0;
    let current: Rect | null = null;
    const measure = () => {
      const target = step.target ? findTarget(step.target) : null;
      const r = target?.getBoundingClientRect();
      const nextRect = r ? { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 } : null;
      if (!sameRect(current, nextRect)) {
        current = nextRect;
        setRect(nextRect);
      }
      setViewport((v) => (v.w === window.innerWidth && v.h === window.innerHeight ? v : { w: window.innerWidth, h: window.innerHeight }));
      frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [open, step.target]);

  // Teclado y foco.
  useEffect(() => {
    if (!open) return;
    primaryRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, next, back, onSkip]);

  if (!open || typeof document === "undefined") return null;

  // Posición de la tarjeta: debajo o arriba del elemento; en el celular, pegada abajo/arriba.
  const mobile = viewport.w > 0 && viewport.w < 640;
  const cardWidth = Math.min(380, (viewport.w || 400) - 32);
  let cardStyle: React.CSSProperties;
  if (!rect) {
    cardStyle = { left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: cardWidth };
  } else if (mobile) {
    const targetCenter = rect.top + rect.height / 2;
    cardStyle =
      targetCenter > viewport.h * 0.55
        ? { left: 16, right: 16, top: "max(16px, env(safe-area-inset-top))" }
        : { left: 16, right: 16, bottom: "calc(16px + env(safe-area-inset-bottom))" };
  } else {
    const below = rect.top + rect.height + 14;
    const fitsBelow = below + 260 < viewport.h;
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - cardWidth / 2), viewport.w - cardWidth - 16);
    cardStyle = fitsBelow ? { left, top: below, width: cardWidth } : { left, bottom: viewport.h - rect.top + 14, width: cardWidth };
  }

  return createPortal(
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body">
      {/* Fondo atenuado con un "recorte" (máscara SVG) sobre el elemento resaltado. */}
      {rect ? (
        <>
          <svg aria-hidden className="pointer-events-none fixed inset-0 h-full w-full animate-fade-in">
            <defs>
              <mask id="sf-tour-hole">
                <rect width="100%" height="100%" fill="white" />
                <rect x={rect.left} y={rect.top} width={rect.width} height={rect.height} rx={22} fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="#06050c" fillOpacity={0.74} mask="url(#sf-tour-hole)" />
          </svg>
          <div
            aria-hidden
            className="pointer-events-none fixed rounded-[22px] border-[3px] border-primary-text transition-all duration-300 ease-out"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              boxShadow: "0 0 32px 4px color-mix(in srgb, var(--primary) 50%, transparent)",
            }}
          />
        </>
      ) : (
        <div aria-hidden className="fixed inset-0 bg-[#06050c]/75 backdrop-blur-[2px] animate-fade-in" />
      )}

      <div
        key={index}
        className={cn(
          "fixed rounded-[26px] border border-border bg-popover p-5 text-left shadow-elevated animate-float-in",
          !rect && "text-center",
        )}
        style={cardStyle}
      >
        <div className={cn("flex items-center gap-1.5", !rect && "justify-center")} aria-hidden>
          {TOUR_STEPS.map((_, i) => (
            <span key={i} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-primary-text" : "w-1.5 bg-border")} />
          ))}
        </div>
        <p aria-hidden className={cn("mt-4", rect ? "text-3xl" : "text-5xl")}>
          {step.emoji}
        </p>
        <h2 id="tour-title" className={cn("mt-2 font-extrabold tracking-tight", rect ? "text-lg" : "text-2xl")}>
          {step.title}
        </h2>
        <p id="tour-body" className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
          {step.body}
        </p>

        {last ? (
          <Button ref={primaryRef} variant="gradient" size="xl" className="mt-6 w-full" onClick={onFinish}>
            EMPEZAR 🚀
          </Button>
        ) : (
          <div className="mt-5 flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Saltar
            </Button>
            <span className="flex-1 text-center text-xs font-semibold text-muted-foreground tabular">
              {index + 1} de {TOUR_STEPS.length - 1}
            </span>
            {index > 0 && (
              <Button variant="outline" size="icon" aria-label="Paso anterior" onClick={back}>
                <ArrowLeft />
              </Button>
            )}
            <Button ref={primaryRef} variant="gradient" onClick={next}>
              Siguiente <ArrowRight />
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
