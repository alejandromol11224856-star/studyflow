"use client";

import { ArrowRight, SlidersHorizontal, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createElement, useEffect, useState } from "react";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { ProductTour, WelcomeDialog } from "@/components/onboarding/product-tour";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGoals, useHabits, usePreferences, useProfile, useSections, useUpdatePreferences } from "@/hooks/use-data";
import { widgetDefinition } from "@/lib/preferences";
import { CustomizeDashboardDialog } from "./customize-dialog";
import { TodayHero } from "./today-hero";
import { SPAN_CLASS, WIDGET_COMPONENTS } from "./widgets";

/** Invitación a configurar la cuenta si todavía está vacía. */
function SetupCard() {
  const prefs = usePreferences();
  const sections = useSections();
  const habits = useHabits();
  const goals = useGoals();
  const loaded = sections.data && habits.data && goals.data;
  const empty = loaded && !sections.data!.length && !habits.data!.length && !goals.data!.length;
  if (!empty || prefs.onboarding.completedAt || prefs.onboarding.skippedAt) return null;
  return (
    <Card className="relative overflow-hidden p-5 animate-slide-up sm:p-6">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary-soft opacity-80 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-text">
            <Sparkles className="size-3.5" /> Empezá en 1 minuto
          </span>
          <h2 className="mt-3 text-lg font-bold tracking-tight">Armemos tu StudyFlow</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tus áreas, tu objetivo principal y una meta diaria. Todo editable después.</p>
        </div>
        <Link href="/onboarding" className={buttonVariants({ variant: "gradient", size: "lg", className: "shrink-0" })}>
          Empezar <ArrowRight />
        </Link>
      </div>
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

  const save = (key: "tourCompletedAt" | "tourDismissedAt") =>
    updatePrefs.mutate({ onboarding: { [key]: new Date().toISOString() } });

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

export function DashboardView({ startTour = false, action = null }: { startTour?: boolean; action?: string | null }) {
  const router = useRouter();
  const dialogs = useDialogs();
  const { widgets } = usePreferences();
  const [customizing, setCustomizing] = useState(false);
  const visible = widgets.filter((w) => w.visible);

  // Accesos directos (atajos de la app instalada, "Repetir tutorial"): ejecutar y limpiar la URL.
  useEffect(() => {
    if (!startTour && !action) return;
    if (action === "timer") dialogs.openStartTimer();
    else if (action === "log") dialogs.openActivityForm();
    router.replace("/dashboard", { scroll: false });
    // Solo al llegar con esos parámetros.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTour, action]);

  return (
    <div className="space-y-4">
      <TodayHero />
      <SetupCard />

      {visible.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Ocultaste todas las tarjetas de abajo.</p>
          <Button className="mt-4" variant="outline" onClick={() => setCustomizing(true)}>
            <SlidersHorizontal /> Elegir qué ver
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 animate-slide-up [grid-auto-flow:dense] sm:gap-4 lg:grid-cols-6">
          {visible.map((w) =>
            createElement(WIDGET_COMPONENTS[w.id], { key: w.id, className: SPAN_CLASS[widgetDefinition(w.id).span] }),
          )}
        </div>
      )}

      <div className="flex justify-center pt-2">
        <Button variant="ghost" size="sm" onClick={() => setCustomizing(true)}>
          <SlidersHorizontal /> Personalizar esta pantalla
        </Button>
      </div>

      <CustomizeDashboardDialog open={customizing} onOpenChange={setCustomizing} />
      <OnboardingGuide startTour={startTour} />
    </div>
  );
}
