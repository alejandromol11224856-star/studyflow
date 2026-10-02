import { cn } from "@/lib/utils";

/**
 * Ilustraciones propias de StudyFlow (trazo de línea, creadas para el
 * producto). Toman los colores del tema: trazo = currentColor, rellenos con
 * el acento suave, el sol/meta en ámbar y la energía en coral. Así se ven
 * diseñadas tanto en papel (claro) como en tinta (oscuro).
 */

const LINE = { fill: "none", stroke: "currentColor", strokeWidth: 2.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const ACCENT = { ...LINE, stroke: "var(--primary-text)" };

function Frame({ className, label, children }: { className?: string; label?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={cn("h-auto w-40 text-foreground/75", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </svg>
  );
}

/** Crecimiento: un brote con dos hojas y el sol. Primeros pasos, estados vacíos de actividad. */
export function SproutIllustration({ className, label }: { className?: string; label?: string }) {
  return (
    <Frame className={className} label={label}>
      <ellipse cx="80" cy="103" rx="50" ry="6" fill="var(--muted)" />
      <path {...LINE} d="M34 103h92" />
      <path {...LINE} d="M80 103V62" />
      <path d="M80 76c-14 0-24-9-26-23 14 0 24 8 26 23Z" {...ACCENT} fill="var(--primary-soft)" />
      <path d="M80 66c12-2 22-12 24-26-14 0-22 10-24 26Z" {...ACCENT} fill="var(--primary-soft)" />
      <path {...ACCENT} d="M66 61l8 7M93 52l-8 7" strokeWidth={1.5} opacity={0.6} />
      <circle cx="124" cy="28" r="9" fill="var(--xp)" />
      <path {...LINE} d="M124 12v-4M138 28h4M134 18l3-3" strokeWidth={1.75} opacity={0.5} />
    </Frame>
  );
}

/** Objetivo: un camino que sube hasta una bandera. */
export function PathIllustration({ className, label }: { className?: string; label?: string }) {
  return (
    <Frame className={className} label={label}>
      <path d="M10 104c34-6 44-30 70-34s40-24 66-42v76Z" fill="var(--primary-soft)" />
      <path {...LINE} d="M10 104c34-6 44-30 70-34s40-24 66-42" />
      <path {...ACCENT} d="M20 98c26-6 40-24 62-28 18-3 32-16 52-32" strokeDasharray="2 8" strokeWidth={2.5} />
      <circle cx="20" cy="98" r="5" fill="var(--primary-text)" />
      <path {...LINE} d="M138 38V12" />
      <path d="M138 12h18l-5 6 5 6h-18Z" fill="var(--streak)" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round" />
      <circle cx="44" cy="30" r="2" fill="currentColor" opacity={0.4} />
      <circle cx="62" cy="20" r="1.5" fill="currentColor" opacity={0.3} />
    </Frame>
  );
}

/** Hábitos: eslabones encadenados (continuidad), el último recién agregado. */
export function ChainIllustration({ className, label }: { className?: string; label?: string }) {
  return (
    <Frame className={className} label={label}>
      <path {...LINE} d="M14 92h132" opacity={0.35} />
      <rect x="16" y="46" width="46" height="30" rx="15" {...LINE} />
      <rect x="54" y="46" width="46" height="30" rx="15" {...LINE} />
      <rect x="92" y="46" width="46" height="30" rx="15" {...ACCENT} fill="var(--primary-soft)" />
      <path {...ACCENT} d="M106 61l6 6 12-12" strokeWidth={2.75} />
      <circle cx="39" cy="92" r="3" fill="currentColor" opacity={0.5} />
      <circle cx="77" cy="92" r="3" fill="currentColor" opacity={0.5} />
      <circle cx="115" cy="92" r="4" fill="var(--primary-text)" />
      <path {...LINE} d="M124 28l4-8M132 34l8-3M116 26l-1-8" strokeWidth={1.75} opacity={0.45} />
    </Frame>
  );
}

/** Estudio / métodos: un libro abierto con una chispa de idea. */
export function BookIllustration({ className, label }: { className?: string; label?: string }) {
  return (
    <Frame className={className} label={label}>
      <ellipse cx="80" cy="104" rx="52" ry="5" fill="var(--muted)" />
      <path d="M80 44c-14-8-36-9-52-5v56c16-4 38-3 52 6Z" {...LINE} fill="var(--card)" />
      <path d="M80 44c14-8 36-9 52-5v56c-16-4-38-3-52 6Z" {...LINE} fill="var(--primary-soft)" />
      <path {...LINE} d="M80 44v57" />
      <path {...LINE} d="M38 54c10-2 22-1 32 2M38 64c10-2 22-1 32 2M38 74c8-1 16-1 24 1" strokeWidth={1.75} opacity={0.5} />
      <path {...ACCENT} d="M92 56c10-3 22-3 30-1M92 66c10-3 22-3 30-1" strokeWidth={1.75} />
      <path d="M106 14c1 7 4 10 11 11-7 1-10 4-11 11-1-7-4-10-11-11 7-1 10-4 11-11Z" fill="var(--xp)" />
    </Frame>
  );
}

/** Calendario: una grilla que se va llenando (constancia mes a mes). */
export function CalendarIllustration({ className, label }: { className?: string; label?: string }) {
  const cells = [1, 2, 0, 3, 4, 2, 3, 4, 4, 1, 3, 4, 2, 4, 4];
  return (
    <Frame className={className} label={label}>
      <rect x="28" y="22" width="104" height="86" rx="14" {...LINE} fill="var(--card)" />
      <path {...LINE} d="M28 42h104M52 14v14M108 14v14" />
      {cells.map((level, i) => (
        <rect
          key={i}
          x={38 + (i % 5) * 18.5}
          y={50 + Math.floor(i / 5) * 18}
          width="13"
          height="13"
          rx="4"
          fill={level ? `var(--heat-${level})` : "var(--muted)"}
        />
      ))}
    </Frame>
  );
}

/** Verificación: un sobre del que sale el código. */
export function EnvelopeIllustration({ className, label }: { className?: string; label?: string }) {
  return (
    <Frame className={className} label={label}>
      <rect x="44" y="18" width="72" height="50" rx="8" {...ACCENT} fill="var(--card)" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={54 + i * 9.5} y="36" width="6" height="12" rx="3" fill="var(--primary-text)" opacity={0.35 + i * 0.1} />
      ))}
      <path d="M26 56h108v42a8 8 0 0 1-8 8H34a8 8 0 0 1-8-8Z" {...LINE} fill="var(--primary-soft)" />
      <path {...LINE} d="M26 58l54 30 54-30" />
      <circle cx="132" cy="22" r="6" fill="var(--xp)" />
    </Frame>
  );
}

/** Foco (Pomodoro / sesiones): un reloj con el bloque de trabajo y el descanso. */
export function TimerIllustration({ className, label }: { className?: string; label?: string }) {
  return (
    <Frame className={className} label={label}>
      <circle cx="80" cy="66" r="40" {...LINE} fill="var(--card)" />
      <path d="M80 26a40 40 0 1 1-34.6 20" fill="none" stroke="var(--primary-text)" strokeWidth="8" strokeLinecap="round" />
      <path d="M45.4 46A40 40 0 0 1 64 30.4" fill="none" stroke="var(--xp)" strokeWidth="8" strokeLinecap="round" />
      <path {...LINE} d="M80 66V44M80 66l12 8" />
      <path {...LINE} d="M72 14h16M80 14v10" />
      <circle cx="80" cy="66" r="3.5" fill="currentColor" />
    </Frame>
  );
}

/** Nivel / logros: una cima con su bandera. */
export function SummitIllustration({ className, label }: { className?: string; label?: string }) {
  return (
    <Frame className={className} label={label}>
      <path d="M14 104l40-52 18 22 22-38 52 68Z" {...LINE} fill="var(--primary-soft)" />
      <path d="M86 50l8-14 8 11-6 6-4-4Z" {...LINE} fill="var(--card)" strokeWidth={1.75} />
      <path {...LINE} d="M94 36V14" />
      <path d="M94 14h16l-4 5 4 5H94Z" fill="var(--xp)" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round" />
      <path {...ACCENT} d="M30 104c10-14 20-22 30-30" strokeDasharray="2 7" />
      <path d="M128 30c.5 3.5 2 5 5.5 5.5-3.5.5-5 2-5.5 5.5-.5-3.5-2-5-5.5-5.5 3.5-.5 5-2 5.5-5.5Z" fill="var(--xp)" opacity={0.85} />
      <path d="M40 26c.4 2.6 1.5 3.7 4 4-2.5.4-3.6 1.5-4 4-.4-2.5-1.5-3.6-4-4 2.5-.3 3.6-1.4 4-4Z" fill="currentColor" opacity={0.35} />
    </Frame>
  );
}
