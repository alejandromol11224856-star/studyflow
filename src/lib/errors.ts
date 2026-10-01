/** Error con mensaje ya apto para mostrar al usuario. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

const KNOWN_MESSAGES: [RegExp, string][] = [
  [/invalid login credentials/i, "Email o contraseña incorrectos."],
  [/email not confirmed/i, "Tenés que confirmar tu email antes de iniciar sesión. Revisá tu bandeja de entrada."],
  [/user already registered|already been registered/i, "Ya existe una cuenta con ese email."],
  [/password should be at least/i, "La contraseña debe tener al menos 8 caracteres."],
  [/new password should be different/i, "La nueva contraseña debe ser distinta de la anterior."],
  [/rate limit|too many requests|security purposes/i, "Demasiados intentos. Esperá unos minutos y volvé a probar."],
  [/plan_limit_sections/i, "Alcanzaste el límite de secciones activas de tu plan."],
  [/jwt expired|invalid jwt|refresh token/i, "Tu sesión expiró. Volvé a iniciar sesión."],
  [/failed to fetch|networkerror|network request failed|load failed/i, "No hay conexión con el servidor. Revisá tu internet."],
  [/duplicate key/i, "Ese registro ya existe."],
  [/violates check constraint/i, "Algún dato no es válido. Revisá el formulario."],
  [/quota|exceeded the quota/i, "No hay espacio suficiente en el almacenamiento local del navegador."],
];

export function getErrorMessage(error: unknown, fallback = "Ocurrió un error inesperado. Intentá de nuevo."): string {
  if (error instanceof AppError) return error.message;
  const raw =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "";
  if (!raw) return fallback;
  for (const [pattern, message] of KNOWN_MESSAGES) if (pattern.test(raw)) return message;
  return fallback;
}
