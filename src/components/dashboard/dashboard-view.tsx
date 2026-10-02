"use client";

import { ArrowRight, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createElement, useEffect, useState } from "react";
import { SproutIllustration } from "@/components/brand/illustrations";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { ProductTour, WelcomeDialog } from "@/components/onboarding/product-tour";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGoals, useHabits, usePreferences, useProfile, useSections, useUpdatePreferences } from "@/hooks/use-data";
import { HOY_NATIVE_WIDGETS, widgetDefinition } from "@/lib/preferences";
import { AreasStrip } from "./areas-strip";
import { ContinueCard } from "./continue-card";
import { CustomizeDashboardDialog } from "./customize-dialog";
import { DayHeader, DayProgress } from "./today-hero";
import { TodayPanel } from "./today-panel";
import { SPAN_CLASS, WIDGET_COMPONENTS } from "./widgets";

/** Invitación a la configuración inicial si la cuenta todavía está vacía. */
function SetupCard() {
  const prefs = usePreferences();
  const sections = useSections();
  const habits = useHabits();
  const goals = useGoals();
  const loaded = sections.data && habits.data && goals.data;
  const empty = loaded && !sections.data!.length && !habits.data!.length && !goals.data!.length;
  if (!empty || prefs.onboarding.completedAt || prefs.onboarding.skippedAt) return null;
  return (
    <Card className="flex flex-col items-center gap-4 p-6 text-center animate-slide-up sm:flex-row sm:text-left">
      <SproutIllustration className="w-28 shrink-0" />
      <div className="flex-1">
        <h2 className="font-display text-[22px] font-semibold">Armemos tu StudyFlow</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">Tres preguntas y queda listo: qué querés mejorar, cuánto tiempo y para qué.</p>
      </div>
      <Link href="/onboarding" className={buttonVariants({ variant: "gradient", size: "lg", className: "shrink-0" })}>
        Empezar <ArrowRight />
      </Link>
    </Card>
  );
}

/**
 * Bienvenida + tutorial interactivo. Se ofrece una vez; se puede repetir desde
 * Ajustes (llega con ?tour=1).
 */
function OnboardingGuide({ startTour }: { startTour: boolean }) {
  const { data: profile } = useProfile();
  const prefs = usePreferences();
  const updatePrefs = useUpdatePreferences();
  const [tourOpen, setTourOpen] = useState(false);
  const [welcomeClosed, setWelcomeClosed] = useState(false);
  // Se fija al montar: después se limpia ?tour=1 de la URL y la prop pasa a false.
  const [requested] = useState(startTour);

  const answered = Boolean(prefs.onboarding.tourCompletedAt || prefs.onboarding.tourDismissedAt);
  const welcomeOpen = Boolean(profile) && !answered && !welcomeClosed && !tourOpen && !requested;

  // Abrir el tutorial después de montar (así los elementos a resaltar ya existen).
  useEffect(() => {
    if (!requested) return;
    const id = window.setTimeout(() => setTourOpen(true), 450);
    return () => window.clearTimeout(id);
  }, [requested]);

  const save = (key: "tourCompletedAt" | "tourDismissedAt") => updatePrefs.mutate({ onboarding: { [key]: new Date().toISOString() } });

  return (
    <>
      <WelcomeDialog
        open={welcomeOpen}
        name={profile?.displayName.split(" ")[0]}
        onStart={() => {
          setWelcomeClosed(true);
          window.setTimeout(() => setTourOpen(true), 320);
        }}
        onLater={() => {
          setWelcomeClosed(true);
          save("tourDismissedAt");
        }}
      />
      <ProductTour
        open={tourOpen}
        onFinish={() => {
          setTourOpen(false);
          save("tourCompletedAt");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onSkip={() => {
          setTourOpen(false);
          if (!answered) save("tourDismissedAt");
        }}
      />
    </>
  );
}

/**
 * Hoy: el corazón de StudyFlow. Arriba, cómo vas y qué hacer ahora; después,
 * lo que te toca hoy y tus áreas. Nada más, salvo las tarjetas que agregues.
 */
export function DashboardView({ startTour = false, action = null }: { startTour?: boolean; action?: string | null }) {
  const router = useRouter();
  const dialogs = useDialogs();
  const { widgets } = usePreferences();
  const [customizing, setCustomizing] = useState(false);
  const extras = widgets.filter((w) => w.visible && !HOY_NATIVE_WIDGETS.has(w.id));

  // Accesos directos (atajos de la app instalada, "Repetir tutorial"): ejecutar y limpiar la URL.
  useEffect(() => {
    if (!startTour && !action) return;
    if (action === "timer") dialogs.openStartTimer();
    else if (action === "pomodoro") dialogs.openStartTimer(undefined, { methodId: "pomodoro" });
    else if (action === "log") dialogs.openActivityForm();
    router.replace("/dashboard", { scroll: false });
    // Solo al llegar con esos parámetros.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTour, action]);

  return (
    <div className="space-y-10 pb-4">
      <DayHeader />

      <div className="-mt-2 space-y-4">
        <SetupCard />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
          <DayProgress />
          <ContinueCard />
        </div>
      </div>

      <TodayPanel />
      <AreasStrip />

      {extras.length > 0 && (
        <div className="grid grid-cols-2 gap-3 [grid-auto-flow:dense] sm:gap-4 lg:grid-cols-6">
          {extras.map((w) => createElement(WIDGET_COMPONENTS[w.id], { key: w.id, className: SPAN_CLASS[widgetDefinition(w.id).span] }))}
        </div>
      )}

      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => setCustomizing(true)}>
          <SlidersHorizontal /> Personalizar Hoy
        </Button>
      </div>

      <CustomizeDashboardDialog open={customizing} onOpenChange={setCustomizing} />
      <OnboardingGuide startTour={startTour} />
    </div>
  );
}
