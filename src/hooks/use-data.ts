"use client";

import {
  type QueryClient,
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import type { Repository } from "@/lib/data";
import { type DateKey, browserTimeZone, dateKeyInTimeZone } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { DEFAULT_PREFERENCES, type PreferencesPatch, mergePreferences } from "@/lib/preferences";
import type {
  Activity,
  ActivityInput,
  ActivityQuery,
  ActivityUpdate,
  DailyTotal,
  Goal,
  GoalInput,
  Habit,
  HabitCheck,
  HabitInput,
  HabitUpdate,
  Profile,
  ProfileUpdate,
  Section,
  SectionInput,
  SectionUpdate,
  UnlockedAchievement,
} from "@/lib/types";
import { useClock } from "./use-clock";

export const queryKeys = {
  profile: (uid: string) => ["profile", uid] as const,
  sections: (uid: string) => ["sections", uid] as const,
  activitiesRoot: (uid: string) => ["activities", uid] as const,
  activities: (uid: string, q: unknown) => ["activities", uid, q] as const,
  totals: (uid: string) => ["dailyTotals", uid] as const,
  goals: (uid: string) => ["goals", uid] as const,
  timer: (uid: string) => ["timer", uid] as const,
  habits: (uid: string) => ["habits", uid] as const,
  checks: (uid: string) => ["habitChecks", uid] as const,
  achievements: (uid: string) => ["achievements", uid] as const,
};

export function useScope() {
  const { user, repo } = useAuth();
  return { uid: user?.id ?? "anonymous", repo };
}

export function requireRepo(repo: Repository | null): Repository {
  if (!repo) throw new AppError("Tu sesión expiró. Volvé a iniciar sesión.");
  return repo;
}

/** Aplica un cambio optimista y devuelve cómo deshacerlo si falla. */
async function optimistic<T>(qc: QueryClient, key: readonly unknown[], update: (prev: T | undefined) => T | undefined) {
  await qc.cancelQueries({ queryKey: key });
  const previous = qc.getQueryData<T>(key);
  qc.setQueryData<T>(key, update);
  return () => qc.setQueryData(key, previous);
}

// ---------------------------------------------------------------------------
// Perfil, preferencias, zona horaria y "hoy"
// ---------------------------------------------------------------------------
export function useProfile() {
  const { uid, repo } = useScope();
  return useQuery({
    queryKey: queryKeys.profile(uid),
    queryFn: () => requireRepo(repo).getProfile(),
    enabled: !!repo,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  return useMutation({
    mutationFn: (patch: ProfileUpdate) => requireRepo(repo).updateProfile(patch),
    onSuccess: (profile) => qc.setQueryData(queryKeys.profile(uid), profile),
  });
}

export function usePreferences() {
  const { data } = useProfile();
  return data?.preferences ?? DEFAULT_PREFERENCES;
}

/** Guarda preferencias con actualización optimista (la UI responde al instante). */
export function useUpdatePreferences() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  const key = queryKeys.profile(uid);
  return useMutation({
    mutationFn: async (patch: PreferencesPatch) => {
      const current = qc.getQueryData<Profile>(key)?.preferences ?? DEFAULT_PREFERENCES;
      return requireRepo(repo).updateProfile({ preferences: mergePreferences(current, patch) });
    },
    onMutate: (patch) =>
      optimistic<Profile>(qc, key, (prev) => (prev ? { ...prev, preferences: mergePreferences(prev.preferences, patch) } : prev)),
    onError: (_e, _p, rollback) => rollback?.(),
    onSuccess: (profile) => qc.setQueryData(key, profile),
  });
}

export function useTimeZone() {
  const { data } = useProfile();
  return data?.timezone ?? browserTimeZone();
}

export function useWeekStart() {
  const { data } = useProfile();
  return data?.weekStartsOn ?? 1;
}

/** Día actual del usuario. Se actualiza solo al pasar la medianoche. */
export function useToday() {
  const timeZone = useTimeZone();
  const now = useClock(30_000);
  return dateKeyInTimeZone(new Date(now), timeZone);
}

// ---------------------------------------------------------------------------
// Secciones
// ---------------------------------------------------------------------------
export function useSections() {
  const { uid, repo } = useScope();
  return useQuery({
    queryKey: queryKeys.sections(uid),
    queryFn: () => requireRepo(repo).listSections(),
    enabled: !!repo,
    staleTime: 60_000,
  });
}

/**
 * `active`: secciones utilizables (no archivadas y no pausadas) para
 * selectores, temporizador y Hoy. `unarchived` incluye las pausadas.
 */
export function useActiveSections() {
  const query = useSections();
  const unarchived = useMemo(() => (query.data ?? []).filter((s) => !s.archivedAt), [query.data]);
  const active = useMemo(() => unarchived.filter((s) => s.isActive), [unarchived]);
  return { ...query, active, unarchived };
}

export function useSectionMap() {
  const { data } = useSections();
  return useMemo(() => new Map<string, Section>((data ?? []).map((s) => [s.id, s])), [data]);
}

export function useCreateSection() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  return useMutation({
    mutationFn: (input: SectionInput) => requireRepo(repo).createSection(input),
    onSuccess: (section) => {
      qc.setQueryData<Section[]>(queryKeys.sections(uid), (prev) => (prev ? [...prev, section] : prev));
      void qc.invalidateQueries({ queryKey: queryKeys.sections(uid) });
    },
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: SectionUpdate }) => requireRepo(repo).updateSection(id, patch),
    onSuccess: (section) => {
      qc.setQueryData<Section[]>(queryKeys.sections(uid), (prev) => prev?.map((s) => (s.id === section.id ? section : s)));
    },
  });
}

export function useReorderSections() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  const key = queryKeys.sections(uid);
  return useMutation({
    mutationFn: (ids: string[]) => requireRepo(repo).reorderSections(ids),
    onMutate: (ids) =>
      optimistic<Section[]>(qc, key, (prev) =>
        prev
          ?.map((s) => (ids.includes(s.id) ? { ...s, sortOrder: ids.indexOf(s.id) } : s))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      ),
    onError: (_e, _ids, rollback) => rollback?.(),
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  return useMutation({
    mutationFn: (id: string) => requireRepo(repo).deleteSection(id),
    onSuccess: () => {
      for (const key of [
        queryKeys.sections(uid),
        queryKeys.activitiesRoot(uid),
        queryKeys.totals(uid),
        queryKeys.goals(uid),
        queryKeys.timer(uid),
        queryKeys.habits(uid),
      ]) {
        void qc.invalidateQueries({ queryKey: key });
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Actividades y totales diarios
// ---------------------------------------------------------------------------
export function useDailyTotals() {
  const { uid, repo } = useScope();
  return useQuery({
    queryKey: queryKeys.totals(uid),
    queryFn: () => requireRepo(repo).getDailyTotals(),
    enabled: !!repo,
  });
}

export function useActivities(query: ActivityQuery, options: { enabled?: boolean } = {}) {
  const { uid, repo } = useScope();
  return useQuery({
    queryKey: queryKeys.activities(uid, query),
    queryFn: () => requireRepo(repo).listActivities(query),
    enabled: !!repo && (options.enabled ?? true),
  });
}

export function useInfiniteActivities(filters: Omit<ActivityQuery, "offset" | "limit">, pageSize = 25) {
  const { uid, repo } = useScope();
  return useInfiniteQuery({
    queryKey: queryKeys.activities(uid, { ...filters, infinite: true, pageSize }),
    queryFn: ({ pageParam }) => requireRepo(repo).listActivities({ ...filters, limit: pageSize, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.hasMore ? pages.length * pageSize : undefined),
    enabled: !!repo,
    placeholderData: keepPreviousData,
  });
}

type TotalsChange = DailyTotal;

/** Ajusta la caché de totales sin esperar al servidor (UI instantánea). */
export function patchDailyTotals(qc: QueryClient, uid: string, changes: TotalsChange[]) {
  qc.setQueryData<DailyTotal[]>(queryKeys.totals(uid), (prev) => {
    if (!prev) return prev;
    const next = prev.map((t) => ({ ...t }));
    for (const change of changes) {
      const found = next.find((t) => t.date === change.date && t.sectionId === change.sectionId);
      if (found) {
        found.seconds += change.seconds;
        found.count += change.count;
        found.pages += change.pages;
        found.distance = Math.round((found.distance + change.distance) * 100) / 100;
        found.reps += change.reps;
      } else if (change.count > 0) {
        next.push({ ...change });
      }
    }
    return next.filter((t) => t.count > 0);
  });
}

export const activityChange = (a: Activity, sign: 1 | -1): TotalsChange => ({
  date: a.date,
  sectionId: a.sectionId,
  seconds: sign * a.durationSeconds,
  count: sign,
  pages: sign * (a.pages ?? 0),
  distance: sign * (a.distanceKm ?? 0),
  reps: sign * (a.reps ?? 0),
});

export function useCreateActivity() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  return useMutation({
    mutationFn: (input: ActivityInput) => requireRepo(repo).createActivity(input),
    onSuccess: (activity) => {
      patchDailyTotals(qc, uid, [activityChange(activity, 1)]);
      void qc.invalidateQueries({ queryKey: queryKeys.activitiesRoot(uid) });
      void qc.invalidateQueries({ queryKey: queryKeys.totals(uid) });
    },
  });
}

export function useUpdateActivity() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ActivityUpdate; previous?: Activity }) =>
      requireRepo(repo).updateActivity(id, patch),
    onSuccess: (activity, { previous }) => {
      if (previous) patchDailyTotals(qc, uid, [activityChange(previous, -1), activityChange(activity, 1)]);
      void qc.invalidateQueries({ queryKey: queryKeys.activitiesRoot(uid) });
      void qc.invalidateQueries({ queryKey: queryKeys.totals(uid) });
    },
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  return useMutation({
    mutationFn: (activity: Activity) => requireRepo(repo).deleteActivity(activity.id),
    onSuccess: (_void, activity) => {
      patchDailyTotals(qc, uid, [activityChange(activity, -1)]);
      void qc.invalidateQueries({ queryKey: queryKeys.activitiesRoot(uid) });
      void qc.invalidateQueries({ queryKey: queryKeys.totals(uid) });
    },
  });
}

// ---------------------------------------------------------------------------
// Objetivos
// ---------------------------------------------------------------------------
export function useGoals() {
  const { uid, repo } = useScope();
  return useQuery({
    queryKey: queryKeys.goals(uid),
    queryFn: () => requireRepo(repo).listGoals(),
    enabled: !!repo,
    staleTime: 60_000,
  });
}

export function useSetGoal() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  return useMutation({
    mutationFn: (input: GoalInput) => requireRepo(repo).setGoal(input),
    onSuccess: (goal) => {
      qc.setQueryData<Goal[]>(queryKeys.goals(uid), (prev) => {
        if (!prev) return prev;
        const others = prev.filter(
          (g) =>
            !(
              g.period === goal.period &&
              g.metric === goal.metric &&
              g.sectionId === goal.sectionId &&
              g.effectiveFrom === goal.effectiveFrom
            ),
        );
        return [...others, goal];
      });
      void qc.invalidateQueries({ queryKey: queryKeys.goals(uid) });
    },
  });
}

// ---------------------------------------------------------------------------
// Hábitos
// ---------------------------------------------------------------------------
export function useHabits() {
  const { uid, repo } = useScope();
  return useQuery({
    queryKey: queryKeys.habits(uid),
    queryFn: () => requireRepo(repo).listHabits(),
    enabled: !!repo,
    staleTime: 60_000,
  });
}

export function useHabitChecks() {
  const { uid, repo } = useScope();
  return useQuery({
    queryKey: queryKeys.checks(uid),
    queryFn: () => requireRepo(repo).listHabitChecks(),
    enabled: !!repo,
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  return useMutation({
    mutationFn: (input: HabitInput) => requireRepo(repo).createHabit(input),
    onSuccess: (habit) => {
      qc.setQueryData<Habit[]>(queryKeys.habits(uid), (prev) => (prev ? [...prev, habit] : prev));
      void qc.invalidateQueries({ queryKey: queryKeys.habits(uid) });
    },
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  const key = queryKeys.habits(uid);
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: HabitUpdate }) => requireRepo(repo).updateHabit(id, patch),
    onMutate: ({ id, patch }) => optimistic<Habit[]>(qc, key, (prev) => prev?.map((h) => (h.id === id ? { ...h, ...patch } : h))),
    onError: (_e, _v, rollback) => rollback?.(),
    onSuccess: (habit) => qc.setQueryData<Habit[]>(key, (prev) => prev?.map((h) => (h.id === habit.id ? habit : h))),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  return useMutation({
    mutationFn: (id: string) => requireRepo(repo).deleteHabit(id),
    onSuccess: (_v, id) => {
      qc.setQueryData<Habit[]>(queryKeys.habits(uid), (prev) => prev?.filter((h) => h.id !== id));
      qc.setQueryData<HabitCheck[]>(queryKeys.checks(uid), (prev) => prev?.filter((c) => c.habitId !== id));
    },
  });
}

export function useReorderHabits() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  const key = queryKeys.habits(uid);
  return useMutation({
    mutationFn: (ids: string[]) => requireRepo(repo).reorderHabits(ids),
    onMutate: (ids) =>
      optimistic<Habit[]>(qc, key, (prev) =>
        prev
          ?.map((h) => (ids.includes(h.id) ? { ...h, sortOrder: ids.indexOf(h.id) } : h))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      ),
    onError: (_e, _ids, rollback) => rollback?.(),
  });
}

/** Marca o desmarca un hábito en una fecha (optimista: la UI no espera). */
export function useToggleHabitCheck() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  const key = queryKeys.checks(uid);
  return useMutation({
    mutationFn: ({ habitId, date, done }: { habitId: string; date: DateKey; done: boolean }) =>
      requireRepo(repo).setHabitCheck(habitId, date, done),
    onMutate: ({ habitId, date, done }) =>
      optimistic<HabitCheck[]>(qc, key, (prev) => {
        const rest = (prev ?? []).filter((c) => !(c.habitId === habitId && c.date === date));
        return done ? [...rest, { habitId, date }] : rest;
      }),
    onError: (_e, _v, rollback) => rollback?.(),
  });
}

// ---------------------------------------------------------------------------
// Logros
// ---------------------------------------------------------------------------
export function useAchievements() {
  const { uid, repo } = useScope();
  return useQuery({
    queryKey: queryKeys.achievements(uid),
    queryFn: () => requireRepo(repo).listAchievements(),
    enabled: !!repo,
    staleTime: 5 * 60_000,
  });
}

export function useUnlockAchievements() {
  const qc = useQueryClient();
  const { uid, repo } = useScope();
  return useMutation({
    mutationFn: (codes: string[]) => requireRepo(repo).unlockAchievements(codes),
    onSuccess: (added) => {
      if (!added.length) return;
      qc.setQueryData<UnlockedAchievement[]>(queryKeys.achievements(uid), (prev) => {
        const have = new Set((prev ?? []).map((a) => a.code));
        return [...(prev ?? []), ...added.filter((a) => !have.has(a.code))];
      });
    },
  });
}
