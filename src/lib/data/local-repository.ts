/**
 * Implementación "modo local": todo se guarda en localStorage del navegador.
 * Se usa automáticamente cuando no hay credenciales de Supabase configuradas.
 * Replica las reglas del esquema SQL (validaciones, límites de plan, borrado
 * en cascada) para que el comportamiento sea idéntico al de producción.
 */
import { browserTimeZone } from "../dates";
import { AppError } from "../errors";
import { canCreateHabit, canCreateSection } from "../plans";
import { DEFAULT_PREFERENCES, parsePreferences } from "../preferences";
import type {
  ActiveTimer,
  Activity,
  AuthUser,
  DailyTotal,
  Goal,
  Habit,
  HabitCheck,
  Profile,
  Section,
  UnlockedAchievement,
} from "../types";
import { normalizeText, uid } from "../utils";
import type { AuthService, Repository } from "./repository";

const USERS_KEY = "studyflow:local:users";
const SESSION_KEY = "studyflow:local:session";
const AUTH_EVENT = "studyflow:local-auth";
const dataKey = (userId: string) => `studyflow:local:data:${userId}`;

interface LocalUser {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

interface LocalData {
  version: 2;
  profile: Profile;
  sections: Section[];
  activities: Activity[];
  goals: Goal[];
  habits: Habit[];
  habitChecks: HabitCheck[];
  achievements: UnlockedAchievement[];
  timer: ActiveTimer | null;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

async function hashPassword(password: string, salt: string) {
  const input = `${salt}:${password}`;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // crypto.subtle no existe fuera de contextos seguros (p. ej. IP de LAN sin https).
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `fnv-${(h >>> 0).toString(16)}`;
}

function now() {
  return new Date().toISOString();
}

/**
 * Migra datos guardados por versiones anteriores (equivalente local de la
 * migración SQL v2): objetivos con target_minutes -> metric/target, secciones
 * activables, medidas en actividades, hábitos y logros.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrate(raw: any): LocalData {
  const profile = raw.profile ?? {};
  return {
    version: 2,
    profile: {
      ...profile,
      plan: profile.plan === "premium" || profile.plan === "pro" ? profile.plan : "free",
      mainGoal: profile.mainGoal ?? null,
      preferences: parsePreferences(profile.preferences),
    },
    sections: (raw.sections ?? []).map((s: Section) => ({ ...s, isActive: s.isActive !== false })),
    activities: (raw.activities ?? []).map((a: Activity) => ({
      ...a,
      pages: a.pages ?? null,
      distanceKm: a.distanceKm ?? null,
      reps: a.reps ?? null,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    goals: (raw.goals ?? []).map((g: any) => ({
      id: g.id,
      sectionId: g.sectionId ?? null,
      period: g.period,
      metric: g.metric ?? "time",
      target: g.target ?? g.targetMinutes ?? 0,
      effectiveFrom: g.effectiveFrom,
      createdAt: g.createdAt,
    })),
    habits: raw.habits ?? [],
    habitChecks: raw.habitChecks ?? [],
    achievements: raw.achievements ?? [],
    timer: raw.timer ?? null,
  };
}

function validateActivity(a: Pick<Activity, "title" | "durationSeconds" | "notes" | "pages" | "distanceKm" | "reps">) {
  if (!a.title.trim() || a.title.trim().length > 120) throw new AppError("El título debe tener entre 1 y 120 caracteres.");
  if (!(a.durationSeconds >= 0 && a.durationSeconds <= 86400)) throw new AppError("La duración debe estar entre 0 y 24 horas.");
  if (!(a.durationSeconds > 0 || (a.pages ?? 0) > 0 || (a.distanceKm ?? 0) > 0 || (a.reps ?? 0) > 0)) {
    throw new AppError("Registrá tiempo o alguna medida (páginas, distancia o repeticiones).");
  }
  if (a.notes && a.notes.length > 2000) throw new AppError("Las notas no pueden superar los 2000 caracteres.");
}

function sortKey(a: Activity) {
  return a.startedAt ?? a.createdAt;
}

const cleanMeasure = (v: number | null | undefined) => (v && v > 0 ? v : null);

export function createLocalRepository(user: AuthUser): Repository {
  const key = dataKey(user.id);

  const load = (): LocalData => {
    const existing = readJson<{ version?: number } | null>(key, null);
    if (existing) {
      if (existing.version === 2) return existing as LocalData;
      const migrated = migrate(existing);
      writeJson(key, migrated);
      return migrated;
    }
    const fresh: LocalData = {
      version: 2,
      profile: {
        id: user.id,
        displayName: user.email.split("@")[0],
        timezone: browserTimeZone(),
        weekStartsOn: 1,
        plan: "free",
        mainGoal: null,
        preferences: DEFAULT_PREFERENCES,
        createdAt: now(),
      },
      sections: [],
      activities: [],
      goals: [],
      habits: [],
      habitChecks: [],
      achievements: [],
      timer: null,
    };
    writeJson(key, fresh);
    return fresh;
  };

  const mutate = <T>(fn: (data: LocalData) => T): T => {
    const data = load();
    const result = fn(data);
    writeJson(key, data);
    return result;
  };

  const assertSection = (data: LocalData, sectionId: string | null | undefined) => {
    if (sectionId && !data.sections.some((s) => s.id === sectionId)) throw new AppError("La sección no existe.");
  };

  const reorder = <T extends { id: string; sortOrder: number }>(items: T[], ids: string[]) =>
    items.map((item) => {
      const index = ids.indexOf(item.id);
      return index >= 0 ? { ...item, sortOrder: index } : item;
    });

  const repo: Repository = {
    async getProfile() {
      return load().profile;
    },

    async updateProfile(patch) {
      return mutate((d) => {
        d.profile = {
          ...d.profile,
          ...(patch.displayName !== undefined && { displayName: patch.displayName.trim().slice(0, 60) }),
          ...(patch.timezone !== undefined && { timezone: patch.timezone }),
          ...(patch.weekStartsOn !== undefined && { weekStartsOn: patch.weekStartsOn }),
          ...(patch.mainGoal !== undefined && { mainGoal: patch.mainGoal?.trim().slice(0, 160) || null }),
          ...(patch.preferences !== undefined && { preferences: parsePreferences(patch.preferences) }),
        };
        return d.profile;
      });
    },

    async listSections() {
      return [...load().sections].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
    },

    async createSection(input) {
      return mutate((d) => {
        const active = d.sections.filter((s) => !s.archivedAt).length;
        if (!canCreateSection(d.profile.plan, active)) throw new AppError("Alcanzaste el límite de áreas activas de tu plan.");
        const section: Section = {
          id: uid(),
          name: input.name.trim(),
          color: input.color,
          icon: input.icon,
          description: input.description?.trim() || null,
          sortOrder: Math.max(-1, ...d.sections.map((s) => s.sortOrder)) + 1,
          isActive: true,
          archivedAt: null,
          createdAt: now(),
        };
        d.sections.push(section);
        return section;
      });
    },

    async updateSection(id, patch) {
      return mutate((d) => {
        const index = d.sections.findIndex((s) => s.id === id);
        if (index < 0) throw new AppError("La sección no existe.");
        const current = d.sections[index];
        if (current.archivedAt && patch.archivedAt === null) {
          const active = d.sections.filter((s) => !s.archivedAt).length;
          if (!canCreateSection(d.profile.plan, active)) throw new AppError("Alcanzaste el límite de áreas activas de tu plan.");
        }
        const next: Section = {
          ...current,
          ...(patch.name !== undefined && { name: patch.name.trim() }),
          ...(patch.color !== undefined && { color: patch.color }),
          ...(patch.icon !== undefined && { icon: patch.icon }),
          ...(patch.description !== undefined && { description: patch.description?.trim() || null }),
          ...(patch.archivedAt !== undefined && { archivedAt: patch.archivedAt }),
          ...(patch.sortOrder !== undefined && { sortOrder: patch.sortOrder }),
          ...(patch.isActive !== undefined && { isActive: patch.isActive }),
        };
        d.sections[index] = next;
        return next;
      });
    },

    async deleteSection(id) {
      mutate((d) => {
        d.sections = d.sections.filter((s) => s.id !== id);
        d.activities = d.activities.map((a) => (a.sectionId === id ? { ...a, sectionId: null } : a));
        d.goals = d.goals.filter((g) => g.sectionId !== id);
        d.habits = d.habits.map((h) => (h.sectionId === id ? { ...h, sectionId: null } : h));
        if (d.timer?.sectionId === id) d.timer = { ...d.timer, sectionId: null };
      });
    },

    async reorderSections(ids) {
      mutate((d) => {
        d.sections = reorder(d.sections, ids);
      });
    },

    async listActivities(query) {
      const limit = query.limit ?? 30;
      const offset = query.offset ?? 0;
      const term = query.search ? normalizeText(query.search.trim()) : "";
      const items = load()
        .activities.filter((a) => {
          if (query.from && a.date < query.from) return false;
          if (query.to && a.date > query.to) return false;
          if (query.sectionId === null && a.sectionId !== null) return false;
          if (query.sectionId && a.sectionId !== query.sectionId) return false;
          if (term && !normalizeText(`${a.title} ${a.notes ?? ""}`).includes(term)) return false;
          return true;
        })
        .sort((a, b) => b.date.localeCompare(a.date) || sortKey(b).localeCompare(sortKey(a)));
      return { items: items.slice(offset, offset + limit), hasMore: items.length > offset + limit };
    },

    async exportActivities() {
      return [...load().activities].sort((a, b) => b.date.localeCompare(a.date));
    },

    async createActivity(input) {
      return mutate((d) => {
        assertSection(d, input.sectionId);
        const activity: Activity = {
          id: uid(),
          sectionId: input.sectionId,
          title: input.title.trim(),
          notes: input.notes?.trim() || null,
          date: input.date,
          startedAt: input.startedAt ?? null,
          durationSeconds: Math.round(input.durationSeconds),
          pages: cleanMeasure(input.pages),
          distanceKm: cleanMeasure(input.distanceKm),
          reps: cleanMeasure(input.reps),
          source: input.source ?? "manual",
          createdAt: now(),
        };
        validateActivity(activity);
        d.activities.push(activity);
        return activity;
      });
    },

    async updateActivity(id, patch) {
      return mutate((d) => {
        const index = d.activities.findIndex((a) => a.id === id);
        if (index < 0) throw new AppError("La actividad no existe.");
        assertSection(d, patch.sectionId);
        const current = d.activities[index];
        const next: Activity = {
          ...current,
          ...(patch.sectionId !== undefined && { sectionId: patch.sectionId }),
          ...(patch.title !== undefined && { title: patch.title.trim() }),
          ...(patch.notes !== undefined && { notes: patch.notes?.trim() || null }),
          ...(patch.date !== undefined && { date: patch.date }),
          ...(patch.startedAt !== undefined && { startedAt: patch.startedAt }),
          ...(patch.durationSeconds !== undefined && { durationSeconds: Math.round(patch.durationSeconds) }),
          ...(patch.pages !== undefined && { pages: cleanMeasure(patch.pages) }),
          ...(patch.distanceKm !== undefined && { distanceKm: cleanMeasure(patch.distanceKm) }),
          ...(patch.reps !== undefined && { reps: cleanMeasure(patch.reps) }),
        };
        validateActivity(next);
        d.activities[index] = next;
        return next;
      });
    },

    async deleteActivity(id) {
      mutate((d) => {
        d.activities = d.activities.filter((a) => a.id !== id);
      });
    },

    async getDailyTotals(range) {
      const map = new Map<string, DailyTotal>();
      for (const a of load().activities) {
        if (range?.from && a.date < range.from) continue;
        if (range?.to && a.date > range.to) continue;
        const k = `${a.date}|${a.sectionId ?? ""}`;
        const t = map.get(k) ?? { date: a.date, sectionId: a.sectionId, seconds: 0, count: 0, pages: 0, distance: 0, reps: 0 };
        t.seconds += a.durationSeconds;
        t.count += 1;
        t.pages += a.pages ?? 0;
        t.distance = Math.round((t.distance + (a.distanceKm ?? 0)) * 100) / 100;
        t.reps += a.reps ?? 0;
        map.set(k, t);
      }
      return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
    },

    async listGoals() {
      return [...load().goals].sort(
        (a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom) || a.createdAt.localeCompare(b.createdAt),
      );
    },

    async setGoal(input) {
      return mutate((d) => {
        assertSection(d, input.sectionId);
        const target = Math.max(0, Math.min(1_000_000, Math.round(input.target * 100) / 100));
        const existing = d.goals.find(
          (g) =>
            g.period === input.period &&
            g.metric === input.metric &&
            g.sectionId === input.sectionId &&
            g.effectiveFrom === input.effectiveFrom,
        );
        if (existing) {
          existing.target = target;
          return { ...existing };
        }
        const goal: Goal = { id: uid(), ...input, target, createdAt: now() };
        d.goals.push(goal);
        return goal;
      });
    },

    async listHabits() {
      return [...load().habits].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
    },

    async createHabit(input) {
      return mutate((d) => {
        assertSection(d, input.sectionId);
        const active = d.habits.filter((h) => !h.archivedAt).length;
        if (!canCreateHabit(d.profile.plan, active)) throw new AppError("Alcanzaste el límite de hábitos de tu plan.");
        if (!input.name.trim() || input.name.trim().length > 60) throw new AppError("El nombre debe tener entre 1 y 60 caracteres.");
        const habit: Habit = {
          id: uid(),
          ...input,
          name: input.name.trim(),
          isActive: true,
          archivedAt: null,
          sortOrder: Math.max(-1, ...d.habits.map((h) => h.sortOrder)) + 1,
          createdAt: now(),
        };
        d.habits.push(habit);
        return habit;
      });
    },

    async updateHabit(id, patch) {
      return mutate((d) => {
        const index = d.habits.findIndex((h) => h.id === id);
        if (index < 0) throw new AppError("El hábito no existe.");
        assertSection(d, patch.sectionId);
        const next: Habit = { ...d.habits[index], ...patch, ...(patch.name !== undefined && { name: patch.name.trim() }) };
        d.habits[index] = next;
        return next;
      });
    },

    async deleteHabit(id) {
      mutate((d) => {
        d.habits = d.habits.filter((h) => h.id !== id);
        d.habitChecks = d.habitChecks.filter((c) => c.habitId !== id);
      });
    },

    async reorderHabits(ids) {
      mutate((d) => {
        d.habits = reorder(d.habits, ids);
      });
    },

    async listHabitChecks() {
      return load().habitChecks;
    },

    async setHabitCheck(habitId, date, done) {
      mutate((d) => {
        if (!d.habits.some((h) => h.id === habitId)) throw new AppError("El hábito no existe.");
        const exists = d.habitChecks.some((c) => c.habitId === habitId && c.date === date);
        if (done && !exists) d.habitChecks.push({ habitId, date });
        if (!done) d.habitChecks = d.habitChecks.filter((c) => !(c.habitId === habitId && c.date === date));
      });
    },

    async listAchievements() {
      return load().achievements;
    },

    async unlockAchievements(codes) {
      return mutate((d) => {
        const have = new Set(d.achievements.map((a) => a.code));
        const added = codes.filter((c) => !have.has(c)).map((code) => ({ code, unlockedAt: now() }));
        d.achievements.push(...added);
        return added;
      });
    },

    async getTimer() {
      return load().timer;
    },

    async saveTimer(timer) {
      return mutate((d) => {
        assertSection(d, timer.sectionId);
        d.timer = { ...timer, title: timer.title.slice(0, 120) };
        return d.timer;
      });
    },

    async clearTimer() {
      mutate((d) => {
        d.timer = null;
      });
    },

    async finishTimer(input) {
      const activity = await repo.createActivity({ ...input, source: "timer" });
      await repo.clearTimer();
      return activity;
    },
  };
  return repo;
}

// ---------------------------------------------------------------------------
// Autenticación local
// ---------------------------------------------------------------------------
function emitAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function currentLocalUser(): AuthUser | null {
  const sessionId = readJson<string | null>(SESSION_KEY, null);
  if (!sessionId) return null;
  const found = readJson<LocalUser[]>(USERS_KEY, []).find((u) => u.id === sessionId);
  return found ? { id: found.id, email: found.email } : null;
}

export function createLocalAuthService(): AuthService {
  return {
    async getUser() {
      return currentLocalUser();
    },

    async signIn(email, password) {
      const users = readJson<LocalUser[]>(USERS_KEY, []);
      const found = users.find((u) => u.email === email.trim().toLowerCase());
      if (!found || found.passwordHash !== (await hashPassword(password, found.salt))) {
        throw new AppError("Email o contraseña incorrectos.");
      }
      writeJson(SESSION_KEY, found.id);
      emitAuthChange();
      return { id: found.id, email: found.email };
    },

    async signUp({ email, password, displayName, timezone }) {
      const normalized = email.trim().toLowerCase();
      const users = readJson<LocalUser[]>(USERS_KEY, []);
      if (users.some((u) => u.email === normalized)) throw new AppError("Ya existe una cuenta con ese email.");
      const salt = uid();
      const user: LocalUser = {
        id: uid(),
        email: normalized,
        salt,
        passwordHash: await hashPassword(password, salt),
        createdAt: now(),
      };
      writeJson(USERS_KEY, [...users, user]);
      // Inicializa los datos con el nombre y la zona horaria elegidos.
      const repo = createLocalRepository({ id: user.id, email: user.email });
      await repo.updateProfile({ displayName, timezone });
      writeJson(SESSION_KEY, user.id);
      emitAuthChange();
      return { sessionCreated: true };
    },

    async signOut() {
      window.localStorage.removeItem(SESSION_KEY);
      emitAuthChange();
    },

    async sendPasswordReset() {
      throw new AppError("La recuperación de contraseña por email requiere conectar Supabase.");
    },

    async resendConfirmation() {
      throw new AppError("En modo local no hay emails: la cuenta queda activa al crearla.");
    },

    async verifyEmailLink() {
      throw new AppError("Los enlaces por email requieren conectar Supabase.");
    },

    async updatePassword(password) {
      const current = currentLocalUser();
      if (!current) throw new AppError("Tu sesión expiró. Volvé a iniciar sesión.");
      const users = readJson<LocalUser[]>(USERS_KEY, []);
      const salt = uid();
      const hash = await hashPassword(password, salt);
      writeJson(
        USERS_KEY,
        users.map((u) => (u.id === current.id ? { ...u, salt, passwordHash: hash } : u)),
      );
    },

    onChange(callback) {
      const handler = () => callback(currentLocalUser());
      const storageHandler = (e: StorageEvent) => {
        if (e.key === SESSION_KEY) handler();
      };
      window.addEventListener(AUTH_EVENT, handler);
      window.addEventListener("storage", storageHandler);
      return () => {
        window.removeEventListener(AUTH_EVENT, handler);
        window.removeEventListener("storage", storageHandler);
      };
    },

    createRepository(user) {
      return createLocalRepository(user);
    },
  };
}
