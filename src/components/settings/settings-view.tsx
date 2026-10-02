"use client";

import { Bell, Check, Cloud, Crown, Download, HardDrive, LogOut, RotateCcw, Target } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { PageHeader } from "@/components/layout/page-header";
import { ThemeSwitcher } from "@/components/layout/theme-toggle";
import { useSignOut } from "@/components/layout/user-menu";
import { useAuth } from "@/components/providers/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { Badge, SegmentedControl, Skeleton } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { useProfile, useSections, useUpdatePreferences, useUpdateProfile } from "@/hooks/use-data";
import { useGoalStatuses } from "@/hooks/use-metrics";
import { type WeekStart, browserTimeZone, isValidTimeZone, listTimeZones } from "@/lib/dates";
import { goalSummary } from "@/lib/domain/goals";
import { getErrorMessage } from "@/lib/errors";
import { type PermissionState, notificationPermission, requestNotificationPermission } from "@/lib/notifications";
import { PLANS, getPlan } from "@/lib/plans";
import { ACCENTS } from "@/lib/preferences";
import type { Activity, Profile, Section } from "@/lib/types";
import { cn } from "@/lib/utils";
import { fieldErrors, resetPasswordSchema } from "@/lib/validation";

const SECTIONS = [
  { id: "perfil", label: "👤 Perfil" },
  { id: "tutorial", label: "🧭 Tutorial" },
  { id: "apariencia", label: "🎨 Tema y color" },
  { id: "idioma", label: "🌎 Idioma" },
  { id: "objetivos", label: "🎯 Objetivos" },
  { id: "notificaciones", label: "🔔 Notificaciones" },
  { id: "datos", label: "💾 Datos" },
  { id: "cuenta", label: "🔐 Cuenta" },
];

export function SettingsView() {
  const { data: profile, isLoading } = useProfile();
  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader title="⚙️ Ajustes" description="Tu perfil, el tutorial, apariencia, objetivos, notificaciones y datos." />
      {/* Accesos rápidos: en el celular evitan scrollear toda la página. */}
      <nav aria-label="Apartados de ajustes" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="shrink-0 rounded-full border border-border bg-card px-3.5 py-2 text-[13px] font-semibold shadow-card transition hover:bg-muted active:scale-95"
          >
            {s.label}
          </a>
        ))}
      </nav>
      {isLoading || !profile ? <Skeleton className="h-64" /> : <ProfileCard key={profile.id} profile={profile} />}
      <TutorialCard />
      <AppearanceCard />
      <LanguageCard />
      <GoalsCard />
      <RemindersCard />
      <PlanCard />
      <DataCard />
      <AccountCard />
    </div>
  );
}

function SettingsCard({
  id,
  emoji,
  title,
  description,
  children,
}: {
  id?: string;
  emoji?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-20 lg:scroll-mt-6">
      <CardHeader>
        <div className="flex items-start gap-3">
          {emoji && (
            <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-xl">
              {emoji}
            </span>
          )}
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription className="text-sm">{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function TutorialCard() {
  return (
    <SettingsCard id="tutorial" emoji="🧭" title="Tutorial" description="Volvé a ver cómo funciona StudyFlow, paso a paso.">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/dashboard?tour=1" className={buttonVariants({ variant: "gradient" })}>
          🚀 Repetir tutorial
        </Link>
        <Link href="/onboarding" className={buttonVariants({ variant: "outline" })}>
          <RotateCcw /> Repetir configuración inicial
        </Link>
      </div>
    </SettingsCard>
  );
}

function LanguageCard() {
  return (
    <SettingsCard id="idioma" emoji="🌎" title="Idioma">
      <Field label="Idioma de la app" hint="Por ahora StudyFlow está disponible solo en español.">
        {(id, d) => (
          <Select id={id} aria-describedby={d} value="es-AR" disabled onChange={() => undefined}>
            <option value="es-AR">Español (Argentina)</option>
          </Select>
        )}
      </Field>
    </SettingsCard>
  );
}

function GoalsCard() {
  const dialogs = useDialogs();
  const { statuses, isLoading } = useGoalStatuses();
  const global = statuses.filter((s) => s.goal.sectionId === null);
  return (
    <SettingsCard id="objetivos" emoji="🎯" title="Objetivos" description="Tus metas generales. Las de cada área se editan en esa área.">
      {isLoading ? (
        <Skeleton className="h-16" />
      ) : global.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no tenés objetivos generales.</p>
      ) : (
        <ul className="space-y-1.5">
          {global.map((s) => (
            <li key={`${s.goal.period}|${s.goal.metric}`} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-3.5 py-2.5 text-sm">
              <span className="font-semibold">{goalSummary(s.goal)}</span>
              <button
                type="button"
                className="text-xs font-bold text-primary-text hover:underline"
                onClick={() => dialogs.openGoalDialog({ sectionId: null, period: s.goal.period, metric: s.goal.metric, lock: true })}
              >
                Cambiar
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button variant="soft" onClick={() => dialogs.openGoalDialog({ sectionId: null })}>
          <Target /> Nuevo objetivo
        </Button>
        <Link href="/goals" className={buttonVariants({ variant: "outline" })}>
          Ver todos los objetivos
        </Link>
      </div>
    </SettingsCard>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  const update = useUpdateProfile();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [mainGoal, setMainGoal] = useState(profile.mainGoal ?? "");
  const [timezone, setTimezone] = useState(profile.timezone);
  const [weekStartsOn, setWeekStartsOn] = useState<WeekStart>(profile.weekStartsOn);
  const zones = listTimeZones();
  const detected = browserTimeZone();
  const dirty =
    displayName !== profile.displayName ||
    mainGoal !== (profile.mainGoal ?? "") ||
    timezone !== profile.timezone ||
    weekStartsOn !== profile.weekStartsOn;

  return (
    <SettingsCard id="perfil" emoji="👤" title="Perfil" description="La zona horaria define cuándo empieza tu día (y se reinician los objetivos).">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!displayName.trim()) return toast.error("El nombre no puede estar vacío.");
          if (!isValidTimeZone(timezone)) return toast.error("Zona horaria inválida.");
          update.mutate(
            { displayName: displayName.trim(), mainGoal: mainGoal.trim() || null, timezone, weekStartsOn },
            { onSuccess: () => toast.success("Perfil actualizado") },
          );
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre">
            {(id) => <Input id={id} value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} />}
          </Field>
          <Field label="Objetivo principal" hint="Se muestra en Hoy.">
            {(id) => (
              <Input id={id} value={mainGoal} onChange={(e) => setMainGoal(e.target.value)} maxLength={160} placeholder="Ej: Recibirme este año" />
            )}
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Zona horaria"
            hint={
              timezone !== detected ? (
                <button type="button" className="text-primary-text hover:underline" onClick={() => setTimezone(detected)}>
                  Usar la de este dispositivo ({detected})
                </button>
              ) : (
                "Detectada en este dispositivo"
              )
            }
          >
            {(id) => (
              <Select id={id} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                {!zones.includes(timezone) && <option value={timezone}>{timezone}</option>}
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="La semana empieza el">
            {(id) => (
              <Select id={id} value={weekStartsOn} onChange={(e) => setWeekStartsOn(Number(e.target.value) as WeekStart)}>
                <option value={1}>Lunes</option>
                <option value={0}>Domingo</option>
              </Select>
            )}
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={update.isPending} disabled={!dirty}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </SettingsCard>
  );
}

function AppearanceCard() {
  const { data: profile } = useProfile();
  const update = useUpdatePreferences();
  const accent = profile?.preferences.accent ?? "violet";
  const celebrations = profile?.preferences.celebrations ?? "full";
  return (
    <SettingsCard id="apariencia" emoji="🎨" title="Tema y color" description="Claro u oscuro, color principal y celebraciones. Todos los colores mantienen buen contraste.">
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-[13px] font-medium">Tema</p>
          <ThemeSwitcher showLabels className="w-full sm:w-auto" />
        </div>
        <div>
          <p className="mb-2 text-[13px] font-medium">Color principal</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color principal">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={accent === a.id}
                onClick={() => update.mutate({ accent: a.id })}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition-all",
                  accent === a.id ? "border-foreground/40 bg-muted font-medium" : "border-border hover:bg-muted",
                )}
              >
                <span className="flex size-5 items-center justify-center rounded-full" style={{ background: a.swatch }}>
                  {accent === a.id && <Check className="size-3 text-white" strokeWidth={3} />}
                </span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[13px] font-medium">Celebraciones</p>
          <SegmentedControl
            value={celebrations}
            onChange={(v) => update.mutate({ celebrations: v })}
            options={[
              { value: "full", label: "Con confeti" },
              { value: "subtle", label: "Solo avisos" },
            ]}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            El confeti aparece solo en momentos importantes: objetivo cumplido, nivel nuevo o un logro.
          </p>
        </div>
      </div>
    </SettingsCard>
  );
}

function RemindersCard() {
  const { data: profile } = useProfile();
  const update = useUpdatePreferences();
  const [permission, setPermission] = useState<PermissionState>(() => notificationPermission());
  const reminders = profile?.preferences.reminders ?? { enabled: true, dailyGoalTime: null };

  return (
    <SettingsCard id="notificaciones" emoji="🔔" title="Notificaciones y recordatorios" description="Avisos de hábitos (a la hora que elijas en cada uno) y de tu objetivo diario.">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Activar recordatorios</p>
            <p className="text-xs text-muted-foreground">Cada recordatorio se envía una sola vez por día.</p>
          </div>
          <Switch checked={reminders.enabled} onChange={(enabled) => update.mutate({ reminders: { enabled } })} label="Activar recordatorios" />
        </div>
        <Field label="Recordarme el objetivo diario a las" hint="Solo si todavía no lo cumpliste. Dejalo vacío para no recibirlo.">
          {(id) => (
            <Input
              id={id}
              type="time"
              className="sm:w-40"
              disabled={!reminders.enabled}
              value={reminders.dailyGoalTime ?? ""}
              onChange={(e) => update.mutate({ reminders: { dailyGoalTime: e.target.value || null } })}
            />
          )}
        </Field>
        <div className="flex flex-col gap-3 rounded-xl bg-muted/60 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Bell className="mt-0.5 size-4 shrink-0" />
            {permission === "granted"
              ? "Notificaciones del navegador activadas: te avisamos aunque StudyFlow esté en segundo plano (con la app abierta)."
              : permission === "unsupported"
                ? "Este navegador no soporta notificaciones: los recordatorios se muestran dentro de la app."
                : "Sin permiso de notificaciones: los recordatorios se muestran dentro de la app."}
          </p>
          {permission === "default" && (
            <Button size="sm" variant="outline" onClick={async () => setPermission(await requestNotificationPermission())}>
              Permitir notificaciones
            </Button>
          )}
        </div>
      </div>
    </SettingsCard>
  );
}

function PlanCard() {
  const { data: profile } = useProfile();
  const plan = getPlan(profile?.plan);
  return (
    <SettingsCard id="plan" emoji="👑" title="Plan">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
          <Crown className="size-5" />
        </span>
        <div>
          <p className="flex items-center gap-2 font-semibold">
            Plan {plan.name} <Badge tone="primary">Actual</Badge>
          </p>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">Sin límites de áreas, hábitos ni objetivos.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.values(PLANS)
          .filter((p) => p.id !== plan.id)
          .map((p) => (
            <Badge key={p.id}>{p.name} · próximamente</Badge>
          ))}
      </div>
    </SettingsCard>
  );
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsv(activities: Activity[], sections: Section[]) {
  const names = new Map(sections.map((s) => [s.id, s.name]));
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ["fecha", "inicio", "seccion", "titulo", "duracion_minutos", "paginas", "distancia_km", "repeticiones", "notas", "origen"];
  const lines = activities.map((a) =>
    [
      a.date,
      a.startedAt ?? "",
      a.sectionId ? (names.get(a.sectionId) ?? "") : "",
      a.title,
      (a.durationSeconds / 60).toFixed(1),
      a.pages ?? "",
      a.distanceKm ?? "",
      a.reps ?? "",
      a.notes ?? "",
      a.source,
    ]
      .map(esc)
      .join(","),
  );
  // BOM para que Excel abra bien los acentos.
  return `﻿${[header.join(","), ...lines].join("\n")}`;
}

function DataCard() {
  const { repo, mode } = useAuth();
  const { data: sections = [] } = useSections();
  const [busy, setBusy] = useState<"csv" | "json" | null>(null);

  async function exportData(kind: "csv" | "json") {
    if (!repo) return;
    setBusy(kind);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const activities = await repo.exportActivities();
      if (kind === "csv") {
        download(`studyflow-actividades-${stamp}.csv`, toCsv(activities, sections), "text/csv;charset=utf-8");
      } else {
        const [goals, profile, habits, habitChecks, achievements] = await Promise.all([
          repo.listGoals(),
          repo.getProfile(),
          repo.listHabits(),
          repo.listHabitChecks(),
          repo.listAchievements(),
        ]);
        download(
          `studyflow-backup-${stamp}.json`,
          JSON.stringify(
            { exportedAt: new Date().toISOString(), version: 2, profile, sections, goals, habits, habitChecks, achievements, activities },
            null,
            2,
          ),
          "application/json",
        );
      }
      toast.success(`Exportaste ${activities.length} actividades`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  return (
    <SettingsCard id="datos" emoji="💾" title="Tus datos y exportación" description="Descargá todo lo que registraste cuando quieras.">
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-muted/60 p-3 text-sm">
        {mode === "supabase" ? <Cloud className="size-4 shrink-0 text-success" /> : <HardDrive className="size-4 shrink-0 text-warning" />}
        <span>
          {mode === "supabase"
            ? "Sincronizado en la nube (Supabase). Tus datos están disponibles en todos tus dispositivos."
            : "Modo local: los datos viven en este navegador. Exportalos como respaldo."}
        </span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" onClick={() => exportData("csv")} loading={busy === "csv"}>
          <Download /> Actividades (CSV / Excel)
        </Button>
        <Button variant="outline" onClick={() => exportData("json")} loading={busy === "json"}>
          <Download /> Respaldo completo (JSON)
        </Button>
      </div>
    </SettingsCard>
  );
}

function AccountCard() {
  const { user, updatePassword } = useAuth();
  const signOut = useSignOut();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = resetPasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSaving(true);
    try {
      await updatePassword(parsed.data.password);
      setPassword("");
      setConfirm("");
      toast.success("Contraseña actualizada");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsCard id="cuenta" emoji="🔐" title="Cuenta" description={user?.email}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nueva contraseña" error={errors.password}>
            {(id, d) => (
              <Input id={id} type="password" autoComplete="new-password" aria-describedby={d} value={password} onChange={(e) => setPassword(e.target.value)} />
            )}
          </Field>
          <Field label="Repetir contraseña" error={errors.confirm}>
            {(id, d) => (
              <Input id={id} type="password" autoComplete="new-password" aria-describedby={d} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            )}
          </Field>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="danger-ghost" onClick={() => void signOut()}>
            <LogOut /> Cerrar sesión
          </Button>
          <Button type="submit" variant="outline" loading={saving} disabled={!password}>
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </SettingsCard>
  );
}
