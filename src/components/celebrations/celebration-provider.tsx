"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { SummitIllustration } from "@/components/brand/illustrations";
import { LevelBadge, XpMark } from "@/components/brand/marks";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/hooks/use-data";
import { rewardMessage } from "@/lib/domain/motivation";

export interface Celebration {
  title: string;
  description?: string;
  /** major: con una lluvia breve de papelitos (si está activado) · minor: solo el aviso. */
  tone: "major" | "minor";
}

interface CelebrationContextValue {
  celebrate: (celebration: Celebration) => void;
  /** Aviso flotante "+20 XP · Sesión completada". */
  showXp: (amount: number, reason: string) => void;
  /** Pantalla "Subiste de nivel" (con papelitos si está activado). */
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

// Colores de la marca: acento, sol, coral y papel. Pocos papelitos, breves.
const CONFETTI_COLORS = ["var(--primary)", "var(--xp)", "var(--streak)", "var(--primary-text)", "#f4f0e8"];

function makeConfetti(): Piece[] {
  return Array.from({ length: 36 }, (_, id) => ({
    id,
    left: 10 + Math.random() * 80,
    delay: Math.random() * 0.25,
    duration: 1.5 + Math.random() * 0.9,
    color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
    rotate: Math.random() * 360,
    size: 6 + Math.random() * 5,
  }));
}

function Confetti({ pieces }: { pieces: Piece[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden>
      <style>{`@keyframes sf-fall { 0% { transform: translateY(-8vh) rotate(0deg); opacity: 1 } 100% { transform: translateY(70vh) rotate(540deg); opacity: 0 } }`}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.42,
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

/** Píldora de XP: tinta, chispa ámbar y un número que se nota. */
function XpPillLayer({ pill }: { pill: XpPill | null }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-[65] flex justify-center px-4 lg:bottom-8"
    >
      {pill && (
        <div
          key={pill.key}
          className="inline-flex max-w-full items-center gap-2.5 rounded-full bg-ink py-2 pl-2.5 pr-4 text-sm text-background shadow-elevated animate-float-in"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-xp text-[#1c1300]">
            <XpMark className="size-3.5" />
          </span>
          <span className="font-display text-[17px] font-semibold tabular">+{pill.amount} XP</span>
          <span className="truncate font-medium opacity-75">{pill.reason}</span>
        </div>
      )}
    </div>
  );
}

function LevelUpDialog({ level, onClose }: { level: { level: number; title: string; line: string } | null; onClose: () => void }) {
  return (
    <DialogPrimitive.Root open={Boolean(level)} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-[70] bg-[#0b0f0d]/55 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[75] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 outline-none">
          {level && (
            <div className="relative overflow-hidden rounded-[30px] border border-border bg-card px-6 pb-6 pt-7 text-center shadow-elevated animate-float-in">
              <SummitIllustration className="mx-auto w-36" />
              <div className="-mt-6 flex justify-center">
                <LevelBadge level={level.level} size={68} className="animate-pop" />
              </div>
              <DialogPrimitive.Title className="eyebrow mt-4 !text-xp-text">Subiste de nivel</DialogPrimitive.Title>
              <p className="mt-1.5 font-display text-[30px] font-semibold leading-tight">
                Nivel {level.level} · {level.title}
              </p>
              <DialogPrimitive.Description className="mt-2 text-[15px] text-muted-foreground">{level.line}</DialogPrimitive.Description>
              <DialogPrimitive.Close asChild>
                <Button variant="ink" size="xl" className="mt-6 w-full">
                  Seguir
                </Button>
              </DialogPrimitive.Close>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * Punto único para celebrar: avisos, +XP, subida de nivel y, solo en
 * momentos importantes, una lluvia breve de papelitos (como máximo una cada
 * pocos segundos, nunca con "reducir movimiento" o con celebraciones sutiles).
 */
export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const { celebrations } = usePreferences();
  const [confetti, setConfetti] = useState<Piece[] | null>(null);
  const [pill, setPill] = useState<XpPill | null>(null);
  const [level, setLevel] = useState<{ level: number; title: string; line: string } | null>(null);
  const lastConfetti = useRef(0);

  const burst = useCallback(() => {
    if (celebrations !== "full") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || Date.now() - lastConfetti.current < 6000) return;
    lastConfetti.current = Date.now();
    setConfetti(makeConfetti());
  }, [celebrations]);

  const celebrate = useCallback(
    (c: Celebration) => {
      toast.success(c.title, { description: c.description, duration: c.tone === "major" ? 6500 : 4500 });
      if (c.tone === "major") burst();
    },
    [burst],
  );

  const showXp = useCallback((amount: number, reason: string) => {
    if (amount <= 0) return;
    // Si llegan varios seguidos (sesión + logro), se suman en un solo aviso con el primer motivo.
    setPill((prev) =>
      prev && Date.now() - prev.key < 2500 ? { key: Date.now(), amount: prev.amount + amount, reason: prev.reason } : { key: Date.now(), amount, reason },
    );
  }, []);

  const levelUp = useCallback(
    (lvl: number, title: string) => {
      setLevel({ level: lvl, title, line: rewardMessage("level", lvl) });
      burst();
    },
    [burst],
  );

  useEffect(() => {
    if (!confetti) return;
    const id = window.setTimeout(() => setConfetti(null), 3000);
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
