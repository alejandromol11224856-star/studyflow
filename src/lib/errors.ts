import { parseRetryAfterSeconds } from "./auth-links";

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
  [/email not confirmed/i, "Todavía no confirmaste tu email. Abrí el correo de StudyFlow y tocá \"Terminar registro\"."],
  [/user already registered|already been registered/i, "Ya existe una cuenta con ese email."],
  [/password should be at least/i, "La contraseña debe tener al menos 8 caracteres."],
  [/new password should be different/i, "La nueva contraseña debe ser distinta de la anterior."],
  [/otp_expired|token has expired|expired or is invalid|invalid or has expired|invalid_link/i, "El enlace venció o ya se usó. Pedí uno nuevo."],
  [/signups? not allowed|signup is disabled/i, "Por ahora no se pueden crear cuentas nuevas."],
  [/unable to validate email|invalid format/i, "El email no es válido."],
  [/email rate limit|over_email_send_rate_limit/i, "Se enviaron muchos correos seguidos. Esperá un rato y volvé a intentar."],
  [/rate limit|too many requests|security purposes/i, "Demasiados intentos. Esperá unos minutos y volvé a probar."],
  [/plan_limit_sections/i, "Alcanzaste el límite de áreas activas de tu plan."],
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
  const wait = parseRetryAfterSeconds(raw);
  if (wait !== null) return `Por seguridad, esperá ${wait} ${wait === 1 ? "segundo" : "segundos"} antes de pedir otro correo.`;
  for (const [pattern, message] of KNOWN_MESSAGES) if (pattern.test(raw)) return message;
  return fallback;
}
