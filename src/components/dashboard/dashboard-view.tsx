"use client";

import { ArrowRight, Plus, SlidersHorizontal, Sparkles } from "lucide-react";
import Link from "next/link";
import { createElement, useState } from "react";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClock } from "@/hooks/use-clock";
import { useGoals, useHabits, usePreferences, useProfile, useSections, useTimeZone, useToday } from "@/hooks/use-data";
import { capitalize, formatKey, timeInTimeZone } from "@/lib/dates";
import { widgetDefinition } from "@/lib/preferences";
import { CustomizeDashboardDialog } from "./customize-dialog";
import { SPAN_CLASS, WIDGET_COMPONENTS } from "./widgets";

function greetingFor(hour: number) {
  if (hour < 6) return "Buenas noches";
  if (hour < 13) return "Buen día";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-text">
            <Sparkles className="size-3.5" /> Bienvenido a StudyFlow
          </span>
          <h2 className="mt-3 text-lg font-semibold tracking-tight">Armemos tu sistema en un minuto</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tus áreas, tu objetivo principal y una meta diaria. Todo editable después.</p>
        </div>
        <Link href="/onboarding" className={buttonVariants({ className: "shrink-0" })}>
          Empezar <ArrowRight />
        </Link>
      </div>
    </Card>
  );
}

export function DashboardView() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const timeZone = useTimeZone();
  const today = useToday();
  const now = useClock(60_000);
  const dialogs = useDialogs();
  const { widgets } = usePreferences();
  const [customizing, setCustomizing] = useState(false);

  const hour = Number(timeInTimeZone(new Date(now).toISOString(), timeZone).slice(0, 2));
  const firstName = (profile?.displayName || user?.email.split("@")[0] || "").split(" ")[0];
  const visible = widgets.filter((w) => w.visible);

  return (
    <div className="space-y-4">
      <PageHeader
        className="mb-2 animate-fade-in"
        title={`${greetingFor(hour)}${firstName ? `, ${firstName}` : ""}`}
        description={capitalize(formatKey(today, "EEEE d 'de' MMMM"))}
        actions={
          <>
            <Button variant="outline" onClick={() => setCustomizing(true)} aria-label="Personalizar Hoy">
              <SlidersHorizontal /> <span className="hidden sm:inline">Personalizar</span>
            </Button>
            <Button className="hidden lg:inline-flex" onClick={() => dialogs.openActivityForm()}>
              <Plus /> Registrar actividad
            </Button>
          </>
        }
      />

      <SetupCard />

      {visible.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Ocultaste todos los widgets.</p>
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

      <CustomizeDashboardDialog open={customizing} onOpenChange={setCustomizing} />
    </div>
  );
}
