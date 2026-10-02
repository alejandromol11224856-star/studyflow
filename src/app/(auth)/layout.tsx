import { Flame, Timer } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-10">
        <Link href="/" className="self-start" aria-label="StudyFlow">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-slide-up">{children}</div>
        </div>
        <p className="text-center text-xs text-muted-foreground lg:text-left">© {new Date().getFullYear()} StudyFlow</p>
      </div>
      <BrandPanel />
    </div>
  );
}

/** Panel decorativo con una vista previa estática del producto. */
function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-[#0c0a1d] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div aria-hidden className="absolute -right-32 -top-32 size-[30rem] rounded-full bg-[#5b4ef5] opacity-40 blur-[120px]" />
      <div aria-hidden className="absolute -bottom-40 -left-20 size-[26rem] rounded-full bg-[#2a78d6] opacity-25 blur-[120px]" />
      <div className="relative">
        <p className="text-sm font-semibold text-white/60">Objetivos · hábitos · rachas · XP</p>
        <h2 className="mt-3 max-w-md text-4xl font-extrabold leading-tight tracking-tight">
          Tu progreso, un poco cada día. 🚀
        </h2>
        <p className="mt-3 max-w-md text-[15px] text-white/70">Un poco todos los días termina siendo muchísimo.</p>
      </div>

      <div className="relative mx-auto w-full max-w-md space-y-4">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
          <div className="flex gap-2 text-[13px] font-bold">
            <span className="rounded-full bg-[#f97316]/20 px-3 py-1.5 text-[#fdba74]">🔥 12 días</span>
            <span className="rounded-full bg-[#f59e0b]/20 px-3 py-1.5 text-[#fcd34d]">⭐ Nivel 7</span>
          </div>
          <p className="mt-5 text-sm font-semibold text-white/60">🎯 Objetivo de hoy · Programación</p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight">
            1h 30m <span className="text-xl font-semibold text-white/50">/ 2h</span>
          </p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-3/4 rounded-full bg-linear-to-r from-[#8f84fb] to-[#5b4ef5]" />
          </div>
          <p className="mt-2.5 text-sm font-semibold text-white/70">Faltan 30m. ¡Ya casi! 🏁</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
            <Flame className="size-5 text-[#fb923c]" />
            <p className="mt-3 text-2xl font-extrabold">📖 30 págs</p>
            <p className="text-xs font-semibold text-white/60">Lectura · hoy</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
            <Timer className="size-5 text-[#a29bff]" />
            <p className="mt-3 font-mono text-2xl font-bold">0:25:08</p>
            <p className="text-xs font-semibold text-white/60">Inglés · en curso</p>
          </div>
        </div>
        <div className="flex justify-center">
          <span className="rounded-full bg-linear-to-r from-[#fbbf24] to-[#f59e0b] px-4 py-2 text-sm font-extrabold text-[#1c1300] shadow-lg shadow-amber-500/30">
            ⭐ +20 XP · Sesión completada
          </span>
        </div>
      </div>

      <p className="relative text-sm text-white/50">Programación · Gym · Inglés · Lectura · Meditación · y lo que quieras.</p>
    </div>
  );
}
