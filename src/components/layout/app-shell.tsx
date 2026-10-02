"use client";

import { HardDrive, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CelebrationProvider } from "@/components/celebrations/celebration-provider";
import { ProgressWatcher } from "@/components/celebrations/progress-watcher";
import { DialogsProvider } from "@/components/dialogs/dialogs-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { Skeleton } from "@/components/ui/misc";
import { usePreferences, useProfile } from "@/hooks/use-data";
import { useTimerState } from "@/hooks/use-timer";
import { ACCENT_STORAGE_KEY } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { TimerDocumentTitle } from "./goal-watcher";
import { LogoMark } from "./logo";
import { MobileHeader, MobileTabBar, Sidebar } from "./navigation";
import { ReminderScheduler } from "./reminder-scheduler";
import { TimerMiniBar } from "./timer-widgets";

const BANNER_KEY = "studyflow:local-banner-dismissed";

function LocalModeBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(BANNER_KEY) === "1";
    } catch {
      return false;
    }
  });
  if (dismissed) return null;
  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm animate-fade-in">
      <HardDrive className="mt-0.5 size-4 shrink-0 text-warning" />
      <p className="flex-1 text-foreground/80">
        <span className="font-medium text-foreground">Modo local.</span> Tus datos se guardan solo en este navegador.
        Conectá Supabase (ver README) para sincronizarlos en la nube entre tus dispositivos.
      </p>
      <button
        type="button"
        aria-label="Ocultar aviso"
        className="-m-1 rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
        onClick={() => {
          setDismissed(true);
          try {
            window.localStorage.setItem(BANNER_KEY, "1");
          } catch {
            /* sin almacenamiento */
          }
        }}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="min-h-dvh lg:pl-64">
      <div className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card/70 p-5 lg:block">
        <LogoMark />
        <div className="mt-8 space-y-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-56" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    </div>
  );
}

/** Aplica el color de acento elegido (y lo guarda para el próximo arranque sin parpadeo). */
function AccentSync() {
  const { data: profile } = useProfile();
  const { accent } = usePreferences();
  useEffect(() => {
    if (!profile) return;
    document.documentElement.dataset.accent = accent;
    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
    } catch {
      /* sin almacenamiento */
    }
  }, [profile, accent]);
  return null;
}

/** Protección de rutas del lado cliente: redirige a /login si no hay sesión. */
export function AuthGate({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  if (status !== "authenticated") return <>{fallback}</>;
  return (
    <>
      <AccentSync />
      {children}
    </>
  );
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const { mode } = useAuth();
  const { timer } = useTimerState();
  const pathname = usePathname();
  return (
    <div className="min-h-dvh lg:pl-64">
      <Sidebar />
      <MobileHeader />
      <main
        className={cn(
          "mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:px-8 lg:pb-14 lg:pt-8",
          timer ? "pb-[calc(10.5rem+env(safe-area-inset-bottom))]" : "pb-[calc(7rem+env(safe-area-inset-bottom))]",
        )}
      >
        {mode === "local" && <LocalModeBanner />}
        {/* Transición suave entre páginas (se reinicia con cada ruta). */}
        <div key={pathname} className="animate-page-in">
          {children}
        </div>
      </main>
      <TimerMiniBar />
      <MobileTabBar />
      <ProgressWatcher />
      <ReminderScheduler />
      <TimerDocumentTitle />
    </div>
  );
}

/** Estructura de la app autenticada. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate fallback={<ShellSkeleton />}>
      <CelebrationProvider>
        <DialogsProvider>
          <ShellContent>{children}</ShellContent>
        </DialogsProvider>
      </CelebrationProvider>
    </AuthGate>
  );
}
