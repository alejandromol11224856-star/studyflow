import type { DateKey, DateRange } from "../dates";
import type {
  ActiveTimer,
  Activity,
  ActivityInput,
  ActivityPage,
  ActivityQuery,
  ActivityUpdate,
  AuthUser,
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
} from "../types";

/**
 * Contrato único de acceso a datos. La UI solo conoce esta interfaz; hoy hay
 * dos implementaciones (Supabase y local) y mañana podría haber otra (API
 * propia, offline-first...) sin cambiar componentes.
 *
 * Todas las operaciones están acotadas al usuario autenticado.
 */
export interface Repository {
  getProfile(): Promise<Profile>;
  updateProfile(patch: ProfileUpdate): Promise<Profile>;

  listSections(): Promise<Section[]>;
  createSection(input: SectionInput): Promise<Section>;
  updateSection(id: string, patch: SectionUpdate): Promise<Section>;
  deleteSection(id: string): Promise<void>;
  /** Guarda el orden de aparición (ids en el orden deseado). */
  reorderSections(ids: string[]): Promise<void>;

  listActivities(query: ActivityQuery): Promise<ActivityPage>;
  /** Todas las actividades (paginando internamente). Para exportar. */
  exportActivities(): Promise<Activity[]>;
  createActivity(input: ActivityInput): Promise<Activity>;
  updateActivity(id: string, patch: ActivityUpdate): Promise<Activity>;
  deleteActivity(id: string): Promise<void>;
  getDailyTotals(range?: Partial<DateRange>): Promise<DailyTotal[]>;

  listGoals(): Promise<Goal[]>;
  /** Crea o reemplaza la versión del objetivo para `effectiveFrom`. */
  setGoal(input: GoalInput): Promise<Goal>;

  listHabits(): Promise<Habit[]>;
  createHabit(input: HabitInput): Promise<Habit>;
  updateHabit(id: string, patch: HabitUpdate): Promise<Habit>;
  deleteHabit(id: string): Promise<void>;
  reorderHabits(ids: string[]): Promise<void>;
  listHabitChecks(): Promise<HabitCheck[]>;
  setHabitCheck(habitId: string, date: DateKey, done: boolean): Promise<void>;

  listAchievements(): Promise<UnlockedAchievement[]>;
  /** Guarda logros desbloqueados (idempotente: ignora los que ya existen). */
  unlockAchievements(codes: string[]): Promise<UnlockedAchievement[]>;

  getTimer(): Promise<ActiveTimer | null>;
  saveTimer(timer: ActiveTimer): Promise<ActiveTimer>;
  clearTimer(): Promise<void>;
  /** Guarda la actividad del temporizador y lo elimina. */
  finishTimer(activity: ActivityInput): Promise<Activity>;
}

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
  timezone: string;
}

export interface SignUpResult {
  /** false si el proveedor exige confirmar el email antes de entrar. */
  sessionCreated: boolean;
}

export interface AuthService {
  getUser(): Promise<AuthUser | null>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signUp(input: SignUpInput): Promise<SignUpResult>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  onChange(callback: (user: AuthUser | null) => void): () => void;
  createRepository(user: AuthUser): Repository;
}
