"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/hooks/use-data";

export interface Celebration {
  title: string;
  description?: string;
  /** major: confeti (si está activado) · minor: solo el aviso. */
  tone: "major" | "minor";
}

interface CelebrationContextValue {
  celebrate: (celebration: Celebration) => void;
  /** Aviso flotante "+20 XP · Sesión completada". */
  showXp: (amount: number, reason: string) => void;
  /** Pantalla "¡Subiste de nivel!" (con confeti si está activado). */
  levelUp: (level: number, title: string) => void;
}

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
  size: number;
}

const CONFETTI_COLORS = ["var(--sec-blue)", "var(--sec-orange)", "var(--sec-aqua)", "var(--sec-yellow)", "var(--sec-magenta)", "var(--primary-text)"];

function makeConfetti(): Piece[] {
  return Array.from({ length: 70 }, (_, id) => ({
    id,
    left: Math.random() * 100,
    delay: Math.random() * 0.35,
    duration: 1.8 + Math.random() * 1.3,
    color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
    rotate: Math.random() * 360,
    size: 6 + Math.random() * 6,
  }));
}

function Confetti({ pieces }: { pieces: Piece[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden>
      <style>{`@keyframes sf-fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1 } 100% { transform: translateY(105vh) rotate(720deg); opacity: 0.2 } }`}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.45,
            background: p.color,
            rotate: `${p.rotate}deg`,
            animation: `sf-fall ${p.duration}s cubic-bezier(.25,.6,.4,1) ${p.delay}s both`,
          }}
        />
      ))}
    </div>
  );
}

interface XpPill {
  key: number;
  amount: number;
  reason: string;
}

function XpPillLayer({ pill }: { pill: XpPill | null }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-[65] flex justify-center px-4 lg:bottom-8"
    >
      {pill && (
        <div
          key={pill.key}
          className="inline-flex max-w-full items-center gap-2 rounded-full bg-[image:var(--gradient-xp)] px-4 py-2.5 text-sm font-extrabold text-[#1c1300] shadow-lg shadow-amber-500/30 animate-float-in"
        >
          <span aria-hidden>⭐</span>
          <span className="tabular">+{pill.amount} XP</span>
          <span className="truncate font-semibold opacity-80">· {pill.reason}</span>
        </div>
      )}
    </div>
  );
}

function LevelUpDialog({ level, onClose }: { level: { level: number; title: string } | null; onClose: () => void }) {
  return (
    <DialogPrimitive.Root open={Boolean(level)} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-[70] bg-[#0b0a12]/60 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[75] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 outline-none">
          {level && (
            <div className="relative overflow-hidden rounded-[32px] border border-border bg-card px-6 pb-6 pt-8 text-center shadow-elevated animate-float-in">
              <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-primary-soft blur-3xl" />
              <div className="relative">
                <DialogPrimitive.Title className="text-sm font-extrabold uppercase tracking-[0.18em] text-xp-text">
                  🎉 ¡Subiste de nivel!
                </DialogPrimitive.Title>
                <div className="mx-auto mt-6 flex size-28 items-center justify-center rounded-[36px] bg-[image:var(--gradient-primary)] text-5xl font-extrabold text-primary-foreground shadow-xl shadow-primary/30 animate-pop">
                  {level.level}
                </div>
                <p className="mt-5 text-2xl font-bold tracking-tight">
                  Nivel {level.level} · {level.title}
                </p>
                <DialogPrimitive.Description className="mt-2 text-[15px] text-muted-foreground">
                  La constancia rinde. Cada sesión suma, y se nota. 💪
                </DialogPrimitive.Description>
                <DialogPrimitive.Close asChild>
                  <Button variant="gradient" size="xl" className="mt-7 w-full">
                    ¡Vamos! 🚀
                  </Button>
                </DialogPrimitive.Close>
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * Punto único para celebrar: avisos, +XP, subida de nivel y, solo en momentos
 * importantes, confeti (como máximo uno cada pocos segundos, nunca con
 * "reducir movimiento" activado o si el usuario eligió celebraciones sutiles).
 */
export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const { celebrations } = usePreferences();
  const [confetti, setConfetti] = useState<Piece[] | null>(null);
  const [pill, setPill] = useState<XpPill | null>(null);
  const [level, setLevel] = useState<{ level: number; title: string } | null>(null);
  const lastConfetti = useRef(0);

  const burst = useCallback(() => {
    if (celebrations !== "full") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || Date.now() - lastConfetti.current < 5000) return;
    lastConfetti.current = Date.now();
    setConfetti(makeConfetti());
  }, [celebrations]);

  const celebrate = useCallback(
    (c: Celebration) => {
      toast.success(c.title, { description: c.description, duration: c.tone === "major" ? 7000 : 4500 });
      if (c.tone === "major") burst();
    },
    [burst],
  );

  const showXp = useCallback((amount: number, reason: string) => {
    if (amount <= 0) return;
    // Si llegan varios seguidos (sesión + logro), se suman en un solo aviso con el primer motivo.
    setPill((prev) =>
      prev && Date.now() - prev.key < 2500
        ? { key: Date.now(), amount: prev.amount + amount, reason: prev.reason }
        : { key: Date.now(), amount, reason },
    );
  }, []);

  const levelUp = useCallback(
    (lvl: number, title: string) => {
      setLevel({ level: lvl, title });
      burst();
    },
    [burst],
  );

  useEffect(() => {
    if (!confetti) return;
    const id = window.setTimeout(() => setConfetti(null), 3500);
    return () => window.clearTimeout(id);
  }, [confetti]);

  useEffect(() => {
    if (!pill) return;
    const id = window.setTimeout(() => setPill(null), 2800);
    return () => window.clearTimeout(id);
  }, [pill]);

  const value = useMemo(() => ({ celebrate, showXp, levelUp }), [celebrate, showXp, levelUp]);
  return (
    <CelebrationContext.Provider value={value}>
      {children}
      <XpPillLayer pill={pill} />
      <LevelUpDialog level={level} onClose={() => setLevel(null)} />
      {confetti && <Confetti pieces={confetti} />}
    </CelebrationContext.Provider>
  );
}

export function useCelebrations() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error("useCelebrations debe usarse dentro de <CelebrationProvider>");
  return ctx;
}
