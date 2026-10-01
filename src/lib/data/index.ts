import { isSupabaseConfigured } from "../config";
import { createLocalAuthService } from "./local-repository";
import type { AuthService } from "./repository";
import { createSupabaseAuthService } from "./supabase-repository";

export type { AuthService, Repository, SignUpInput } from "./repository";

let service: AuthService | null = null;

/** Servicio de autenticación según la configuración (Supabase o local). */
export function getAuthService(): AuthService {
  if (!service) service = isSupabaseConfigured ? createSupabaseAuthService() : createLocalAuthService();
  return service;
}
