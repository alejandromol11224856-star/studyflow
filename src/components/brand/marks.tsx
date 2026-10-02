import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Marcas propias de StudyFlow. Cada una representa lo que significa:
 * constancia = eslabones encadenados, XP = chispa, nivel = insignia.
 * Usan currentColor para adaptarse al tema y al acento.
 */

type MarkProps = SVGProps<SVGSVGElement> & { className?: string };

/** Constancia (racha): dos eslabones encadenados. */
export function StreakMark({ className, ...props }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={cn("size-4", className)} aria-hidden {...props}>
      <rect x="2.5" y="7.5" width="12" height="9" rx="4.5" />
      <rect x="9.5" y="7.5" width="12" height="9" rx="4.5" />
    </svg>
  );
}

/** Experiencia (XP): chispa de cuatro puntas. */
export function XpMark({ className, ...props }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn("size-4", className)} aria-hidden {...props}>
      <path d="M12 2.5c.7 4.9 3 7.2 8 8-5 .8-7.3 3.1-8 8-.7-4.9-3-7.2-8-8 5-.8 7.3-3.1 8-8Z" />
      <circle cx="19.5" cy="4.5" r="1.4" opacity={0.7} />
    </svg>
  );
}

/** Progreso: una línea que crece hacia un punto (la misma idea del logo). */
export function GrowthMark({ className, ...props }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={cn("size-4", className)} aria-hidden {...props}>
      <path d="M3 18c3.2 0 4-6 7.2-6s3.8 3.6 6.2 3.6c1.6 0 2.4-2 3-4.1" />
      <circle cx="20.2" cy="7.8" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Insignia de nivel: hexágono redondeado con el número en la tipografía de la marca. */
export function LevelBadge({ level, size = 44, className }: { level: number; size?: number; className?: string }) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" className="absolute inset-0 size-full" aria-hidden>
        <path
          d="M21 3.7a6 6 0 0 1 6 0l13.6 7.9a6 6 0 0 1 3 5.2v15.4a6 6 0 0 1-3 5.2L27 45.3a6 6 0 0 1-6 0L7.4 37.4a6 6 0 0 1-3-5.2V16.8a6 6 0 0 1 3-5.2Z"
          fill="var(--primary)"
        />
        <path
          d="M21 3.7a6 6 0 0 1 6 0l13.6 7.9a6 6 0 0 1 3 5.2v15.4a6 6 0 0 1-3 5.2L27 45.3a6 6 0 0 1-6 0L7.4 37.4a6 6 0 0 1-3-5.2V16.8a6 6 0 0 1 3-5.2Z"
          fill="none"
          stroke="white"
          strokeOpacity={0.22}
          strokeWidth={1.5}
          transform="translate(24 24) scale(0.82) translate(-24 -24)"
        />
      </svg>
      <span className="relative font-display font-semibold text-primary-foreground" style={{ fontSize: size * 0.42 }}>
        {level}
      </span>
    </span>
  );
}
