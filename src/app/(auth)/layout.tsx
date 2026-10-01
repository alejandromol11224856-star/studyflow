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
        <p className="text-sm font-medium text-white/60">Tu sistema de disciplina diaria</p>
        <h2 className="mt-3 max-w-md text-4xl font-semibold leading-tight tracking-tight">
          Medí tu tiempo. Cumplí tus objetivos. No cortes la racha.
        </h2>
      </div>

      <div className="relative mx-auto w-full max-w-md space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
          <p className="text-sm text-white/60">Objetivo diario · 3h</p>
          <p className="mt-3 font-mono text-5xl font-semibold tracking-tight">0:45:00</p>
          <p className="mt-1 text-sm text-white/60">restantes para completar tu día</p>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-3/4 rounded-full bg-linear-to-r from-[#8f84fb] to-[#5b4ef5]" />
          </div>
          <div className="mt-2.5 flex justify-between text-sm">
            <span>
              <b>2h 15m</b> <span className="text-white/60">/ 3h</span>
            </span>
            <span className="font-semibold">75%</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
            <Flame className="size-5 text-[#f0a92b]" />
            <p className="mt-3 text-2xl font-semibold">12 días</p>
            <p className="text-xs text-white/60">Racha actual</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
            <Timer className="size-5 text-[#8f84fb]" />
            <p className="mt-3 font-mono text-2xl font-semibold">1:12:08</p>
            <p className="text-xs text-white/60">Estudio · en curso</p>
          </div>
        </div>
      </div>

      <p className="relative text-sm text-white/50">Estudio · Gimnasio · Inglés · Programación · Lectura · y lo que quieras.</p>
    </div>
  );
}
