/**
 * Configuración pública de la app. Solo variables NEXT_PUBLIC_* (se incrustan
 * en el bundle del navegador). Nunca pongas aquí claves secretas.
 */
export const APP_NAME = "StudyFlow";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Supabase llama "publishable key" a la antigua "anon key"; aceptamos ambas.
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Sin credenciales de Supabase la app funciona en "modo local": cuentas y
 * datos guardados en el navegador. Útil para probar y desarrollar.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const DATA_MODE: "supabase" | "local" = isSupabaseConfigured ? "supabase" : "local";

/** Rutas que requieren sesión iniciada. */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/activities",
  "/sections",
  "/calendar",
  "/stats",
  "/goals",
  "/settings",
  "/habits",
  "/achievements",
  "/onboarding",
];

/** Rutas de autenticación (si ya hay sesión, se redirige al dashboard). */
export const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];
