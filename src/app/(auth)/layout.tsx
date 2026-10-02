import { Compass, House } from "lucide-react";
import Link from "next/link";
import { GrowthMark } from "@/components/brand/marks";
import { BRAND, Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-10">
        <Link href="/" className="self-start" aria-label="StudyFlow">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-page-in">{children}</div>
        </div>
        <p className="text-center text-xs text-muted-foreground lg:text-left">© {new Date().getFullYear()} StudyFlow</p>
      </div>
      <BrandPanel />
    </div>
  );
}

/** Anillo de muestra (estático) con los colores fijos de la marca. */
function RingPreview() {
  const size = 168;
  const c = size / 2;
  const r = c - 14;
  const circ = 2 * Math.PI * r;
  const pct = 0.74;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
        return (
          <line
            key={i}
            x1={c + (c - 5) * Math.cos(a)}
            y1={c + (c - 5) * Math.sin(a)}
            x2={c + (c - 1) * Math.cos(a)}
            y2={c + (c - 1) * Math.sin(a)}
            stroke="rgb(255 255 255 / 0.18)"
            strokeWidth={i % 3 === 0 ? 2 : 1.25}
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="12" />
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke="#3fbf9c"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        transform={`rotate(-90 ${c} ${c})`}
      />
      <text x={c} y={c + 4} textAnchor="middle" fill="#f4f0e8" fontSize="30" fontWeight="600" style={{ fontFamily: "var(--font-fraunces)" }}>
        2h 14m
      </text>
      <text x={c} y={c + 26} textAnchor="middle" fill="rgb(244 240 232 / 0.6)" fontSize="12.5" fontWeight="500">
        de 3h
      </text>
    </svg>
  );
}

const IDEAS = [
  { icon: House, title: "Hoy", text: "Qué hacer ahora y cuánto avanzaste." },
  { icon: GrowthMark, title: "Progreso", text: "Si estás mejorando, en una frase." },
  { icon: Compass, title: "Métodos", text: "Pomodoro, Active Recall y más, listos para usar." },
];

/** Panel de marca (escritorio): tinta, una frase y una muestra del producto. */
function BrandPanel() {
  return (
    <div className="brand-surface brand-surface-side relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
      <svg aria-hidden viewBox="0 0 600 600" className="pointer-events-none absolute -right-40 -top-24 w-[640px] opacity-[0.16]">
        <path d="M40 420c90 0 110-190 210-190s115 120 195 120c50 0 75-60 90-125" fill="none" stroke={BRAND.paper} strokeWidth="18" strokeLinecap="round" />
        <circle cx="537" cy="226" r="26" fill={BRAND.sun} />
      </svg>

      <div className="relative">
        <p className="eyebrow !text-[#f4f0e8]/55">StudyFlow</p>
        <h2 className="mt-4 max-w-md font-display text-[44px] font-semibold leading-[1.05]">Un poco todos los días termina siendo muchísimo.</h2>
      </div>

      <div className="relative flex items-center gap-8">
        <RingPreview />
        <div>
          <p className="text-sm font-semibold text-[#f4f0e8]/60">Objetivo de hoy</p>
          <p className="mt-1 font-display text-[26px] font-semibold leading-tight">Te faltan 46 minutos.</p>
          <p className="mt-1.5 text-sm text-[#f4f0e8]/60">Programación — Python · 6 días seguidos</p>
        </div>
      </div>

      <ul className="relative grid grid-cols-3 gap-6">
        {IDEAS.map((idea) => (
          <li key={idea.title}>
            <idea.icon className="size-5 text-[#3fbf9c]" />
            <p className="mt-2 text-sm font-semibold">{idea.title}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-[#f4f0e8]/60">{idea.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
