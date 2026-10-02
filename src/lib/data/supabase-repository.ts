import type { PostgrestError, SupabaseClient, User } from "@supabase/supabase-js";
import { browserTimeZone } from "../dates";
import { AppError } from "../errors";
import { isPlan } from "../plans";
import { parsePreferences } from "../preferences";
import {
  DEFAULT_SECTION_COLOR,
  DEFAULT_SECTION_ICON,
  isSectionColor,
  isSectionIcon,
} from "../sections";
import { getSupabaseBrowserClient } from "../supabase/client";
import type {
  ActiveTimer,
  Activity,
  ActivityUpdate,
  AuthUser,
  Goal,
  GoalMetric,
  Habit,
  HabitCheck,
  HabitUpdate,
  Profile,
  Section,
  SectionUpdate,
  UnlockedAchievement,
} from "../types";
import { normalizeText } from "../utils";
import type { AuthService, Repository } from "./repository";

const PAGE_SIZE = 1000; // límite por defecto de filas de PostgREST

// ---------------------------------------------------------------------------
// Filas de la base de datos (snake_case) y mapeo al dominio (camelCase)
// ---------------------------------------------------------------------------
interface ProfileRow {
  id: string;
  display_name: string | null;
  timezone: string | null;
  week_starts_on: number;
  plan: string;
  main_goal: string | null;
  preferences: unknown;
  created_at: string;
}
interface SectionRow {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
  sort_order: number;
  is_active: boolean | null;
  archived_at: string | null;
  created_at: string;
}
interface ActivityRow {
  id: string;
  section_id: string | null;
  title: string;
  notes: string | null;
  date: string;
  started_at: string | null;
  duration_seconds: number;
  pages: number | null;
  distance_km: number | string | null;
  reps: number | null;
  source: string;
  created_at: string;
}
interface GoalRow {
  id: string;
  section_id: string | null;
  period: Goal["period"];
  metric: GoalMetric;
  target: number | string;
  effective_from: string;
  created_at: string;
}
interface TimerRow {
  section_id: string | null;
  title: string;
  started_at: string;
  segment_started_at: string | null;
  accumulated_seconds: number;
  updated_at: string;
}
interface DailyTotalRow {
  date: string;
  section_id: string | null;
  seconds: number;
  activity_count: number;
  pages: number | null;
  distance_km: number | string | null;
  reps: number | null;
}
interface HabitRow {
  id: string;
  section_id: string | null;
  name: string;
  icon: string;
  color: string;
  frequency: string;
  days_of_week: number[];
  weekly_target: number | null;
  reminder_time: string | null;
  start_date: string;
  is_active: boolean;
  archived_at: string | null;
  sort_order: number;
  created_at: string;
}

const num = (v: number | string | null | undefined) => (v === null || v === undefined ? null : Number(v));

const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  displayName: r.display_name ?? "",
  timezone: r.timezone || "UTC",
  weekStartsOn: r.week_starts_on === 0 ? 0 : 1,
  plan: isPlan(r.plan) ? r.plan : "free",
  mainGoal: r.main_goal ?? null,
  preferences: parsePreferences(r.preferences),
  createdAt: r.created_at,
});

const toSection = (r: SectionRow): Section => ({
  id: r.id,
  name: r.name,
  color: isSectionColor(r.color) ? r.color : DEFAULT_SECTION_COLOR,
  icon: isSectionIcon(r.icon) ? r.icon : DEFAULT_SECTION_ICON,
  description: r.description,
  sortOrder: r.sort_order,
  isActive: r.is_active !== false,
  archivedAt: r.archived_at,
  createdAt: r.created_at,
});

const toActivity = (r: ActivityRow): Activity => ({
  id: r.id,
  sectionId: r.section_id,
  title: r.title,
  notes: r.notes,
  date: r.date,
  startedAt: r.started_at,
  durationSeconds: r.duration_seconds,
  pages: num(r.pages),
  distanceKm: num(r.distance_km),
  reps: num(r.reps),
  source: r.source === "timer" ? "timer" : "manual",
  createdAt: r.created_at,
});

const toGoal = (r: GoalRow): Goal => ({
  id: r.id,
  sectionId: r.section_id,
  period: r.period,
  metric: r.metric ?? "time",
  target: Number(r.target),
  effectiveFrom: r.effective_from,
  createdAt: r.created_at,
});

const toTimer = (r: TimerRow): ActiveTimer => ({
  sectionId: r.section_id,
  title: r.title ?? "",
  startedAt: r.started_at,
  segmentStartedAt: r.segment_started_at,
  accumulatedSeconds: r.accumulated_seconds,
  updatedAt: r.updated_at,
});

const toHabit = (r: HabitRow): Habit => ({
  id: r.id,
  sectionId: r.section_id,
  name: r.name,
  icon: isSectionIcon(r.icon) ? r.icon : "target",
  color: isSectionColor(r.color) ? r.color : "violet",
  frequency: r.frequency === "weekly" ? "weekly" : "daily",
  daysOfWeek: (r.days_of_week ?? [0, 1, 2, 3, 4, 5, 6]).map(Number),
  weeklyTarget: r.weekly_target,
  reminderTime: r.reminder_time ? r.reminder_time.slice(0, 5) : null,
  startDate: r.start_date,
  isActive: r.is_active,
  archivedAt: r.archived_at,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
});

function activityToRow(input: ActivityUpdate) {
  const row: Record<string, unknown> = {};
  if (input.sectionId !== undefined) row.section_id = input.sectionId;
  if (input.title !== undefined) row.title = input.title.trim();
  if (input.notes !== undefined) row.notes = input.notes?.trim() || null;
  if (input.date !== undefined) row.date = input.date;
  if (input.startedAt !== undefined) row.started_at = input.startedAt;
  if (input.durationSeconds !== undefined) row.duration_seconds = Math.round(input.durationSeconds);
  if (input.pages !== undefined) row.pages = input.pages || null;
  if (input.distanceKm !== undefined) row.distance_km = input.distanceKm || null;
  if (input.reps !== undefined) row.reps = input.reps || null;
  if (input.source !== undefined) row.source = input.source;
  return row;
}

function sectionToRow(input: SectionUpdate) {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name.trim();
  if (input.color !== undefined) row.color = input.color;
  if (input.icon !== undefined) row.icon = input.icon;
  if (input.description !== undefined) row.description = input.description?.trim() || null;
  if (input.archivedAt !== undefined) row.archived_at = input.archivedAt;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  if (input.isActive !== undefined) row.is_active = input.isActive;
  return row;
}

function habitToRow(input: HabitUpdate) {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name.trim();
  if (input.icon !== undefined) row.icon = input.icon;
  if (input.color !== undefined) row.color = input.color;
  if (input.sectionId !== undefined) row.section_id = input.sectionId;
  if (input.frequency !== undefined) row.frequency = input.frequency;
  if (input.daysOfWeek !== undefined) row.days_of_week = input.daysOfWeek;
  if (input.weeklyTarget !== undefined) row.weekly_target = input.weeklyTarget;
  if (input.reminderTime !== undefined) row.reminder_time = input.reminderTime;
  if (input.startDate !== undefined) row.start_date = input.startDate;
  if (input.isActive !== undefined) row.is_active = input.isActive;
  if (input.archivedAt !== undefined) row.archived_at = input.archivedAt;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  return row;
}

function unwrap<T>(result: { data: T | null; error: PostgrestError | null }): T {
  if (result.error) throw result.error;
  if (result.data === null) throw new AppError("No se encontró el registro.");
  return result.data;
}

/** Quita caracteres con significado especial en los filtros de PostgREST. */
function sanitizeSearch(term: string) {
  return term.replace(/[%_,()"'\\*.:]/g, " ").replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Repositorio
// ---------------------------------------------------------------------------
export function createSupabaseRepository(supabase: SupabaseClient, user: AuthUser): Repository {
  const userId = user.id;

  /** Lee todas las filas de una consulta paginando de a PAGE_SIZE. */
  async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>) {
    const all: T[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const rows = unwrap(await build(from, from + PAGE_SIZE - 1));
      all.push(...rows);
      if (rows.length < PAGE_SIZE) break;
    }
    return all;
  }

  return {
    async getProfile() {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle<ProfileRow>();
      if (error) throw error;
      if (data) return toProfile(data);
      // Usuario creado antes de aplicar la migración: crear el perfil.
      const created = await supabase
        .from("profiles")
        .insert({ id: userId, display_name: user.email.split("@")[0], timezone: browserTimeZone() })
        .select("*")
        .single<ProfileRow>();
      return toProfile(unwrap(created));
    },

    async updateProfile(patch) {
      const row: Record<string, unknown> = {};
      if (patch.displayName !== undefined) row.display_name = patch.displayName.trim();
      if (patch.timezone !== undefined) row.timezone = patch.timezone;
      if (patch.weekStartsOn !== undefined) row.week_starts_on = patch.weekStartsOn;
      if (patch.mainGoal !== undefined) row.main_goal = patch.mainGoal?.trim() || null;
      if (patch.preferences !== undefined) row.preferences = patch.preferences;
      const result = await supabase.from("profiles").update(row).eq("id", userId).select("*").single<ProfileRow>();
      return toProfile(unwrap(result));
    },

    async listSections() {
      const result = await supabase
        .from("sections")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
        .returns<SectionRow[]>();
      return unwrap(result).map(toSection);
    },

    async createSection(input) {
      const last = await supabase
        .from("sections")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .returns<{ sort_order: number }[]>();
      const sortOrder = (unwrap(last)[0]?.sort_order ?? -1) + 1;
      const result = await supabase
        .from("sections")
        .insert({ ...sectionToRow(input), sort_order: sortOrder })
        .select("*")
        .single<SectionRow>();
      return toSection(unwrap(result));
    },

    async updateSection(id, patch) {
      const result = await supabase.from("sections").update(sectionToRow(patch)).eq("id", id).select("*").single<SectionRow>();
      return toSection(unwrap(result));
    },

    async deleteSection(id) {
      const { error } = await supabase.from("sections").delete().eq("id", id);
      if (error) throw error;
    },

    async reorderSections(ids) {
      const results = await Promise.all(ids.map((id, index) => supabase.from("sections").update({ sort_order: index }).eq("id", id)));
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },

    async listActivities(query) {
      const limit = query.limit ?? 30;
      const offset = query.offset ?? 0;
      let req = supabase
        .from("activities")
        .select("*")
        .order("date", { ascending: false })
        .order("sort_at", { ascending: false })
        .order("id", { ascending: true });
      if (query.from) req = req.gte("date", query.from);
      if (query.to) req = req.lte("date", query.to);
      if (query.sectionId === null) req = req.is("section_id", null);
      else if (query.sectionId) req = req.eq("section_id", query.sectionId);
      // search_text es título + notas en minúsculas y sin acentos (columna generada en SQL).
      const term = query.search ? sanitizeSearch(normalizeText(query.search)) : "";
      if (term) req = req.ilike("search_text", `%${term}%`);
      // Pedimos una fila extra para saber si hay más páginas.
      const rows = unwrap(await req.range(offset, offset + limit).returns<ActivityRow[]>());
      return { items: rows.slice(0, limit).map(toActivity), hasMore: rows.length > limit };
    },

    async exportActivities() {
      const rows = await fetchAll<ActivityRow>((from, to) =>
        supabase
          .from("activities")
          .select("*")
          .order("date", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to)
          .returns<ActivityRow[]>(),
      );
      return rows.map(toActivity);
    },

    async createActivity(input) {
      const result = await supabase
        .from("activities")
        .insert({ ...activityToRow(input), source: input.source ?? "manual" })
        .select("*")
        .single<ActivityRow>();
      return toActivity(unwrap(result));
    },

    async updateActivity(id, patch) {
      const result = await supabase.from("activities").update(activityToRow(patch)).eq("id", id).select("*").single<ActivityRow>();
      return toActivity(unwrap(result));
    },

    async deleteActivity(id) {
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) throw error;
    },

    async getDailyTotals(range) {
      const rows = await fetchAll<DailyTotalRow>((from, to) => {
        let req = supabase
          .from("daily_totals")
          .select("date, section_id, seconds, activity_count, pages, distance_km, reps")
          .order("date", { ascending: true })
          .order("section_id", { ascending: true, nullsFirst: true });
        if (range?.from) req = req.gte("date", range.from);
        if (range?.to) req = req.lte("date", range.to);
        return req.range(from, to).returns<DailyTotalRow[]>();
      });
      return rows.map((r) => ({
        date: r.date,
        sectionId: r.section_id,
        seconds: Number(r.seconds),
        count: Number(r.activity_count),
        pages: Number(r.pages ?? 0),
        distance: Number(r.distance_km ?? 0),
        reps: Number(r.reps ?? 0),
      }));
    },

    async listGoals() {
      const result = await supabase
        .from("goals")
        .select("*")
        .order("effective_from", { ascending: true })
        .order("created_at", { ascending: true })
        .returns<GoalRow[]>();
      return unwrap(result).map(toGoal);
    },

    async setGoal(input) {
      let existing = supabase
        .from("goals")
        .select("id")
        .eq("period", input.period)
        .eq("metric", input.metric)
        .eq("effective_from", input.effectiveFrom);
      existing = input.sectionId ? existing.eq("section_id", input.sectionId) : existing.is("section_id", null);
      const found = await existing.maybeSingle<{ id: string }>();
      if (found.error) throw found.error;

      const target = Math.max(0, Math.round(input.target * 100) / 100);
      const result = found.data
        ? await supabase.from("goals").update({ target }).eq("id", found.data.id).select("*").single<GoalRow>()
        : await supabase
            .from("goals")
            .insert({
              section_id: input.sectionId,
              period: input.period,
              metric: input.metric,
              target,
              effective_from: input.effectiveFrom,
            })
            .select("*")
            .single<GoalRow>();
      return toGoal(unwrap(result));
    },

    async listHabits() {
      const result = await supabase
        .from("habits")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
        .returns<HabitRow[]>();
      return unwrap(result).map(toHabit);
    },

    async createHabit(input) {
      const last = await supabase
        .from("habits")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .returns<{ sort_order: number }[]>();
      const sortOrder = (unwrap(last)[0]?.sort_order ?? -1) + 1;
      const result = await supabase
        .from("habits")
        .insert({ ...habitToRow(input), sort_order: sortOrder })
        .select("*")
        .single<HabitRow>();
      return toHabit(unwrap(result));
    },

    async updateHabit(id, patch) {
      const result = await supabase.from("habits").update(habitToRow(patch)).eq("id", id).select("*").single<HabitRow>();
      return toHabit(unwrap(result));
    },

    async deleteHabit(id) {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
    },

    async reorderHabits(ids) {
      const results = await Promise.all(ids.map((id, index) => supabase.from("habits").update({ sort_order: index }).eq("id", id)));
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },

    async listHabitChecks() {
      const rows = await fetchAll<{ habit_id: string; date: string }>((from, to) =>
        supabase
          .from("habit_checks")
          .select("habit_id, date")
          .order("date", { ascending: true })
          .order("habit_id", { ascending: true })
          .range(from, to)
          .returns<{ habit_id: string; date: string }[]>(),
      );
      return rows.map((r): HabitCheck => ({ habitId: r.habit_id, date: r.date }));
    },

    async setHabitCheck(habitId, date, done) {
      const { error } = done
        ? await supabase
            .from("habit_checks")
            .upsert({ habit_id: habitId, user_id: userId, date }, { onConflict: "habit_id,date", ignoreDuplicates: true })
        : await supabase.from("habit_checks").delete().eq("habit_id", habitId).eq("date", date);
      if (error) throw error;
    },

    async listAchievements() {
      const result = await supabase.from("achievements").select("code, unlocked_at").returns<{ code: string; unlocked_at: string }[]>();
      return unwrap(result).map((r): UnlockedAchievement => ({ code: r.code, unlockedAt: r.unlocked_at }));
    },

    async unlockAchievements(codes) {
      if (!codes.length) return [];
      const result = await supabase
        .from("achievements")
        .upsert(
          codes.map((code) => ({ user_id: userId, code })),
          { onConflict: "user_id,code", ignoreDuplicates: true },
        )
        .select("code, unlocked_at")
        .returns<{ code: string; unlocked_at: string }[]>();
      return unwrap(result).map((r) => ({ code: r.code, unlockedAt: r.unlocked_at }));
    },

    async getTimer() {
      const { data, error } = await supabase.from("active_timers").select("*").eq("user_id", userId).maybeSingle<TimerRow>();
      if (error) throw error;
      return data ? toTimer(data) : null;
    },

    async saveTimer(timer) {
      const result = await supabase
        .from("active_timers")
        .upsert(
          {
            user_id: userId,
            section_id: timer.sectionId,
            title: timer.title.slice(0, 120),
            started_at: timer.startedAt,
            segment_started_at: timer.segmentStartedAt,
            accumulated_seconds: Math.max(0, Math.floor(timer.accumulatedSeconds)),
            updated_at: timer.updatedAt,
          },
          { onConflict: "user_id" },
        )
        .select("*")
        .single<TimerRow>();
      return toTimer(unwrap(result));
    },

    async clearTimer() {
      const { error } = await supabase.from("active_timers").delete().eq("user_id", userId);
      if (error) throw error;
    },

    async finishTimer(input) {
      const { data, error } = await supabase.rpc("finish_timer", {
        p_section_id: input.sectionId,
        p_title: input.title.trim(),
        p_notes: input.notes?.trim() || null,
        p_date: input.date,
        p_started_at: input.startedAt ?? null,
        p_duration_seconds: Math.round(input.durationSeconds),
      });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as ActivityRow | null;
      if (!row) throw new AppError("No se pudo guardar la actividad.");
      const activity = toActivity(row);
      // Medidas extra cargadas al terminar (páginas, km, repeticiones).
      if (input.pages || input.distanceKm || input.reps) {
        const updated = await supabase
          .from("activities")
          .update(activityToRow({ pages: input.pages, distanceKm: input.distanceKm, reps: input.reps }))
          .eq("id", activity.id)
          .select("*")
          .single<ActivityRow>();
        return toActivity(unwrap(updated));
      }
      return activity;
    },
  };
}

// ---------------------------------------------------------------------------
// Autenticación
// ---------------------------------------------------------------------------
const toAuthUser = (u: User | null | undefined): AuthUser | null => (u ? { id: u.id, email: u.email ?? "" } : null);

export function createSupabaseAuthService(): AuthService {
  const supabase = getSupabaseBrowserClient();
  const origin = () => (typeof window !== "undefined" ? window.location.origin : "");

  return {
    async getUser() {
      const { data } = await supabase.auth.getSession();
      return toAuthUser(data.session?.user);
    },

    async signIn(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      const user = toAuthUser(data.user);
      if (!user) throw new AppError("No se pudo iniciar sesión.");
      return user;
    },

    async signUp({ email, password, displayName, timezone }) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim(), timezone },
          // Sin query string: la plantilla del email agrega ?token_hash=...&type=email
          // (ver supabase/templates). Con la plantilla por defecto, Supabase
          // redirige acá con ?code= y /confirm-email lo resuelve igual.
          emailRedirectTo: `${origin()}/confirm-email`,
        },
      });
      if (error) throw error;
      // Con confirmación por email activa, un email ya registrado devuelve un
      // usuario "falso" sin identidades (para no filtrar qué emails existen).
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new AppError("Ya existe una cuenta con ese email.");
      }
      return { sessionCreated: Boolean(data.session) };
    },

    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },

    async sendPasswordReset(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin()}/reset-password`,
      });
      if (error) throw error;
    },

    async resendConfirmation(email) {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: `${origin()}/confirm-email` },
      });
      if (error) throw error;
    },

    async verifyEmailLink(tokenHash, type) {
      // "signup" quedó obsoleto en verifyOtp: el equivalente es "email".
      const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type === "signup" ? "email" : type });
      if (error) throw error;
      const user = toAuthUser(data.user);
      if (!user) throw new AppError("No se pudo abrir la sesión. Iniciá sesión con tu email y contraseña.");
      return user;
    },

    async updatePassword(password) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },

    onChange(callback) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(toAuthUser(session?.user)));
      return () => data.subscription.unsubscribe();
    },

    createRepository(user) {
      return createSupabaseRepository(supabase, user);
    },
  };
}
