"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { usePreferences } from "@/hooks/use-data";

export interface Celebration {
  title: string;
  description?: string;
  /** major: confeti (si está activado) · minor: solo el aviso. */
  tone: "major" | "minor";
}

interface CelebrationContextValue {
  celebrate: (celebration: Celebration) => void;
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
  return Array.from({ length: 60 }, (_, id) => ({
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
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
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

/**
 * Punto único para celebrar logros: muestra un aviso y, solo en momentos
 * importantes, confeti (como máximo uno cada pocos segundos, nunca con
 * "reducir movimiento" activado o si el usuario eligió celebraciones sutiles).
 */
export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const { celebrations } = usePreferences();
  const [confetti, setConfetti] = useState<Piece[] | null>(null);
  const lastConfetti = useRef(0);

  const celebrate = useCallback(
    (c: Celebration) => {
      toast.success(c.title, { description: c.description, duration: c.tone === "major" ? 7000 : 4500 });
      if (c.tone !== "major" || celebrations !== "full") return;
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduced || Date.now() - lastConfetti.current < 5000) return;
      lastConfetti.current = Date.now();
      setConfetti(makeConfetti());
    },
    [celebrations],
  );

  useEffect(() => {
    if (!confetti) return;
    const id = window.setTimeout(() => setConfetti(null), 3500);
    return () => window.clearTimeout(id);
  }, [confetti]);

  const value = useMemo(() => ({ celebrate }), [celebrate]);
  return (
    <CelebrationContext.Provider value={value}>
      {children}
      {confetti && <Confetti pieces={confetti} />}
    </CelebrationContext.Provider>
  );
}

export function useCelebrations() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error("useCelebrations debe usarse dentro de <CelebrationProvider>");
  return ctx;
}
