import { cn } from "@/lib/utils";

/** Colores fijos de la marca (no dependen del acento elegido). */
export const BRAND = { pine: "#0f6e5c", pineDeep: "#0a4f42", sun: "#f2b84b", paper: "#fffdf8" };

/**
 * Marca de StudyFlow: una línea que avanza y crece hasta un punto (la meta).
 * Es la idea del producto en un trazo: progreso visible.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill={BRAND.pine} />
      <path
        d="M6.5 21.5c3.4 0 4.3-7.4 8.2-7.4s4.4 4.6 7.4 4.6c1.9 0 2.8-2.3 3.4-4.8"
        fill="none"
        stroke={BRAND.paper}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="25.6" cy="10.2" r="2.6" fill={BRAND.sun} />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && <span className="font-display text-[19px] font-semibold tracking-tight">StudyFlow</span>}
    </span>
  );
}
