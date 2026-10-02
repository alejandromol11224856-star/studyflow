/**
 * Lógica pura de los enlaces que llegan por email (confirmación de cuenta y
 * recuperación de contraseña). Sin dependencias del navegador para poder
 * testearla.
 *
 * Por qué existe: el enlace por defecto de Supabase ({{ .ConfirmationURL }})
 * se consume con el primer GET. Los antivirus y "link scanners" de los
 * correos lo abren antes que la persona y, con PKCE, abrirlo en otro
 * navegador/dispositivo también falla. Por eso los emails de StudyFlow llevan
 * un `token_hash` a una página propia que solo lo usa cuando la persona toca
 * el botón (un escáner no toca botones).
 */

export const EMAIL_LINK_TYPES = ["email", "signup", "recovery", "email_change", "invite", "magiclink"] as const;
export type EmailLinkType = (typeof EMAIL_LINK_TYPES)[number];

export function isEmailLinkType(value: unknown): value is EmailLinkType {
  return typeof value === "string" && (EMAIL_LINK_TYPES as readonly string[]).includes(value);
}

/** Página que maneja cada tipo de enlace (la de contraseña necesita su formulario). */
export function pageForLinkType(type: EmailLinkType): "/confirm-email" | "/reset-password" {
  return type === "recovery" ? "/reset-password" : "/confirm-email";
}

export type AuthLinkState =
  /** Enlace nuevo (token_hash): todavía no se usó; se verifica al tocar el botón. */
  | { kind: "token"; tokenHash: string; type: EmailLinkType }
  /** Supabase ya verificó el enlace pero no se pudo abrir sesión acá (otro navegador o dispositivo). */
  | { kind: "verified" }
  /** El enlace venció, ya se usó o es inválido. */
  | { kind: "error"; code: string | null; description: string | null }
  | { kind: "none" };

/** Lee los parámetros de un enlace de email (query y, si viene, el fragmento #...). */
export function parseAuthLink(search: URLSearchParams, hash = ""): AuthLinkState {
  const fragment = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const get = (key: string) => search.get(key) ?? fragment.get(key);

  const error = get("error");
  const errorCode = get("error_code");
  if (error || errorCode) {
    return { kind: "error", code: errorCode ?? error, description: get("error_description") };
  }

  const status = get("status");
  if (status === "verified") return { kind: "verified" };
  if (status === "invalid") return { kind: "error", code: "invalid_link", description: null };

  const tokenHash = get("token_hash");
  const type = get("type");
  if (tokenHash && /^[A-Za-z0-9_-]{8,256}$/.test(tokenHash) && isEmailLinkType(type)) {
    return { kind: "token", tokenHash, type };
  }
  return { kind: "none" };
}

/**
 * "For security purposes, you can only request this after 37 seconds." -> 37.
 * Devuelve null si el mensaje no indica una espera concreta.
 */
export function parseRetryAfterSeconds(message: string | null | undefined): number | null {
  if (!message) return null;
  const match = /after (\d{1,4}) seconds?/i.exec(message);
  return match ? Number(match[1]) : null;
}

/** Espera mínima entre correos (Supabase también limita a 1 por minuto por usuario). */
export const EMAIL_COOLDOWN_SECONDS = 60;

// ---------------------------------------------------------------------------
// Abrir el correo
// ---------------------------------------------------------------------------
export interface MailProvider {
  id: "gmail" | "outlook" | "yahoo" | "icloud" | "proton";
  label: string;
  /** Bandeja de entrada en la web. */
  web: string;
  /** Esquema de la app en iOS (si existe). */
  iosApp?: string;
}

const PROVIDERS: Record<MailProvider["id"], MailProvider> = {
  gmail: { id: "gmail", label: "Gmail", web: "https://mail.google.com/mail/u/0/#inbox", iosApp: "googlegmail://" },
  outlook: { id: "outlook", label: "Outlook", web: "https://outlook.live.com/mail/0/", iosApp: "ms-outlook://" },
  yahoo: { id: "yahoo", label: "Yahoo Mail", web: "https://mail.yahoo.com/", iosApp: "ymail://" },
  icloud: { id: "icloud", label: "iCloud Mail", web: "https://www.icloud.com/mail/", iosApp: "message://" },
  proton: { id: "proton", label: "Proton Mail", web: "https://mail.proton.me/u/0/inbox" },
};

const DOMAINS: Record<string, MailProvider["id"]> = {
  "gmail.com": "gmail",
  "googlemail.com": "gmail",
  "outlook.com": "outlook",
  "outlook.es": "outlook",
  "hotmail.com": "outlook",
  "hotmail.es": "outlook",
  "hotmail.com.ar": "outlook",
  "live.com": "outlook",
  "live.com.ar": "outlook",
  "msn.com": "outlook",
  "yahoo.com": "yahoo",
  "yahoo.com.ar": "yahoo",
  "yahoo.es": "yahoo",
  "ymail.com": "yahoo",
  "icloud.com": "icloud",
  "me.com": "icloud",
  "mac.com": "icloud",
  "proton.me": "proton",
  "protonmail.com": "proton",
};

/**
 * Proveedor de correo según el dominio del email. Para dominios desconocidos
 * (muchos son Google Workspace) se ofrece Gmail.
 */
export function mailProviderFor(email: string | null | undefined): { provider: MailProvider; known: boolean } {
  const domain = email?.split("@")[1]?.trim().toLowerCase() ?? "";
  const id = DOMAINS[domain];
  return id ? { provider: PROVIDERS[id], known: true } : { provider: PROVIDERS.gmail, known: false };
}
