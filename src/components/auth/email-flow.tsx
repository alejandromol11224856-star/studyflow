"use client";

import { ArrowRight, Inbox, LockKeyhole, Mail, PencilLine, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEmailCooldown } from "@/hooks/use-email-cooldown";
import {
  type AuthLinkState,
  type EmailLinkType,
  type MailProvider,
  mailProviderFor,
  parseAuthLink,
  parseRetryAfterSeconds,
} from "@/lib/auth-links";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { emailSchema } from "@/lib/validation";

// ---------------------------------------------------------------------------
// Registro pendiente (para la pantalla "Revisá tu correo" y "Cambiar email").
// Vive en sessionStorage: no viaja en la URL ni queda guardado para siempre.
// ---------------------------------------------------------------------------
const PENDING_KEY = "studyflow:pending-signup";

export interface PendingSignup {
  email: string;
  displayName: string;
}

export function savePendingSignup(value: PendingSignup) {
  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(value));
  } catch {
    /* sin almacenamiento */
  }
}

const noopSubscribe = () => () => {};

/** Lee sessionStorage sin romper la hidratación (en el servidor no hay nada). */
export function usePendingSignup(): PendingSignup | null {
  const raw = useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return window.sessionStorage.getItem(PENDING_KEY);
      } catch {
        return null;
      }
    },
    () => null,
  );
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingSignup>;
    return parsed.email ? { email: parsed.email, displayName: parsed.displayName ?? "" } : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Piezas visuales
// ---------------------------------------------------------------------------
export function AuthHero({
  emoji,
  tone = "primary",
  eyebrow,
  title,
  children,
}: {
  emoji: string;
  tone?: "primary" | "success" | "warning";
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  const ring = { primary: "bg-primary-soft", success: "bg-success-soft", warning: "bg-warning-soft" }[tone];
  return (
    <div className="text-center">
      <div className={cn("mx-auto mb-5 flex size-20 items-center justify-center rounded-[28px] text-[40px] shadow-sm animate-pop", ring)} aria-hidden>
        {emoji}
      </div>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-text">{eyebrow}</p>}
      <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight">{title}</h1>
      {children && <div className="mx-auto mt-2.5 max-w-sm text-[15px] leading-relaxed text-muted-foreground">{children}</div>}
    </div>
  );
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * Abre la app de correo si se puede (iOS: esquema de la app; Android: el
 * enlace web lo abre la app de Gmail si está instalada) y si no, la web.
 */
function openMailbox(provider: MailProvider) {
  if (isIOS() && provider.iosApp) {
    const fallback = window.setTimeout(() => {
      if (document.visibilityState === "visible") window.location.href = provider.web;
    }, 1400);
    document.addEventListener("visibilitychange", () => window.clearTimeout(fallback), { once: true });
    window.location.href = provider.iosApp;
    return;
  }
  if (/Android|Mobi/i.test(navigator.userAgent)) window.location.href = provider.web;
  else window.open(provider.web, "_blank", "noopener,noreferrer");
}

export function OpenMailButton({ email, className }: { email: string | null; className?: string }) {
  const { provider } = mailProviderFor(email);
  return (
    <a
      href={provider.web}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        openMailbox(provider);
      }}
      className={buttonVariants({ variant: "gradient", size: "xl", className: cn("w-full", className) })}
    >
      <Inbox /> Abrir {provider.label}
    </a>
  );
}

/** Botón de reenvío con espera visible entre correos. */
export function ResendButton({
  email,
  kind,
  variant = "outline",
  className,
}: {
  email: string;
  kind: "signup" | "recovery";
  variant?: "outline" | "soft" | "primary";
  className?: string;
}) {
  const { resendConfirmation, sendPasswordReset } = useAuth();
  const { remaining, start } = useEmailCooldown(email);
  const [sending, setSending] = useState(false);
  const valid = emailSchema.safeParse(email).success;

  async function resend() {
    if (!valid) {
      toast.error("Escribí un email válido.");
      return;
    }
    setSending(true);
    try {
      await (kind === "signup" ? resendConfirmation(email) : sendPasswordReset(email));
      start();
      toast.success("Te enviamos otro correo", { description: `Revisá ${email} (y la carpeta de Spam).` });
    } catch (error) {
      const wait = parseRetryAfterSeconds(error instanceof Error ? error.message : String(error));
      if (wait) start(wait);
      toast.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <Button variant={variant} size="lg" className="w-full" onClick={() => void resend()} loading={sending} disabled={remaining > 0}>
        {!sending && <RefreshCw />} Reenviar correo
      </Button>
      <p className="mt-2 min-h-5 text-center text-xs text-muted-foreground" aria-live="polite">
        {remaining > 0 ? `Podés volver a solicitar un correo en ${remaining} ${remaining === 1 ? "segundo" : "segundos"}.` : ""}
      </p>
    </div>
  );
}

/** Formulario chico "¿No recibiste el correo?" cuando no sabemos el email. */
function ResendForm({ kind, initialEmail = "" }: { kind: "signup" | "recovery"; initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  return (
    <div className="rounded-3xl border border-border bg-card p-4 text-left shadow-card">
      <p className="text-sm font-semibold">{kind === "signup" ? "¿No recibiste el correo?" : "¿Necesitás un enlace nuevo?"}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Escribí tu email y te mandamos uno nuevo.</p>
      <Input
        className="mt-3"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="vos@email.com"
        aria-label="Tu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <ResendButton className="mt-3" email={email.trim()} kind={kind} />
    </div>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-3 text-left">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary-text">{i + 1}</span>
          <span className="pt-1 leading-snug">{item}</span>
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// "📬 ¡Revisá tu correo!" (después de registrarse)
// ---------------------------------------------------------------------------
export function CheckEmailView() {
  const router = useRouter();
  const pending = usePendingSignup();

  if (!pending) {
    return (
      <div className="space-y-6">
        <AuthHero emoji="📬" title="¡Revisá tu correo!">
          Si acabás de crear tu cuenta, te enviamos un enlace para activarla.
        </AuthHero>
        <ResendForm kind="signup" />
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya la confirmaste?{" "}
          <Link href="/login" className="font-semibold text-primary-text hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AuthHero emoji="📬" eyebrow="Último paso" title="¡Revisá tu correo!">
        Te enviamos un enlace para activar tu cuenta a
        <span className="mt-2 block break-all rounded-2xl bg-muted px-3 py-2 text-[15px] font-semibold text-foreground">{pending.email}</span>
      </AuthHero>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <Steps
          items={[
            <>Abrí el correo de <b>StudyFlow</b>. Puede tardar 1 o 2 minutos.</>,
            <>
              Tocá el botón <b>🚀 TERMINAR REGISTRO</b>.
            </>,
            <>En la página que se abre, tocá <b>Confirmar mi email</b> y listo.</>,
          ]}
        />
      </div>

      <div className="space-y-3">
        <OpenMailButton email={pending.email} />
        <ResendButton email={pending.email} kind="signup" />
        <Button
          variant="ghost"
          size="lg"
          className="w-full"
          onClick={() => router.push("/register?edit=1")}
        >
          <PencilLine /> Cambiar email
        </Button>
      </div>

      <p className="flex gap-2.5 rounded-2xl bg-muted/70 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <Mail className="mt-0.5 size-4 shrink-0" />
        <span>
          ¿No lo encontrás? Revisá <b className="text-foreground">Spam</b> o <b className="text-foreground">Promociones</b> y buscá
          &quot;StudyFlow&quot;. Podés abrir el correo en cualquier dispositivo.
        </span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// /confirm-email: la persona toca el botón para usar el enlace
// ---------------------------------------------------------------------------
const CONFIRM_COPY: Record<EmailLinkType, { title: string; text: string; button: string; next: string }> = {
  email: { title: "Confirmá tu email", text: "Tocá el botón para activar tu cuenta y empezar a usar StudyFlow.", button: "CONFIRMAR MI EMAIL", next: "/onboarding" },
  signup: { title: "Confirmá tu email", text: "Tocá el botón para activar tu cuenta y empezar a usar StudyFlow.", button: "CONFIRMAR MI EMAIL", next: "/onboarding" },
  email_change: { title: "Confirmá tu nuevo email", text: "Tocá el botón para empezar a usar este email en StudyFlow.", button: "CONFIRMAR MI EMAIL", next: "/settings" },
  invite: { title: "Aceptá la invitación", text: "Tocá el botón para entrar a StudyFlow.", button: "ENTRAR A STUDYFLOW", next: "/onboarding" },
  magiclink: { title: "Entrá a StudyFlow", text: "Tocá el botón para iniciar sesión.", button: "ENTRAR A STUDYFLOW", next: "/dashboard" },
  recovery: { title: "Creá una nueva contraseña", text: "Tocá el botón para continuar.", button: "CREAR NUEVA CONTRASEÑA", next: "/reset-password" },
};

/** Lee el #fragmento (Supabase puede mandar ahí los errores) sin romper la hidratación. */
function useLocationHash() {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.hash,
    () => "",
  );
}

export function useAuthLinkState(initial: AuthLinkState): AuthLinkState {
  const hash = useLocationHash();
  if (initial.kind !== "none" || !hash) return initial;
  return parseAuthLink(new URLSearchParams(), hash);
}

/** Botón que usa el enlace (verifyOtp con token_hash). Compartido con /reset-password. */
export function ConfirmLinkButton({
  tokenHash,
  type,
  onVerified,
  onError,
}: {
  tokenHash: string;
  type: EmailLinkType;
  onVerified: () => void;
  onError: (message: string) => void;
}) {
  const { verifyEmailLink } = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="gradient"
      size="xl"
      className="w-full"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await verifyEmailLink(tokenHash, type);
          onVerified();
        } catch (error) {
          onError(getErrorMessage(error));
          setBusy(false);
        }
      }}
    >
      {busy ? "Confirmando…" : CONFIRM_COPY[type].button}
    </Button>
  );
}

export function ConfirmEmailView({ initial }: { initial: AuthLinkState }) {
  const router = useRouter();
  const { status } = useAuth();
  const link = useAuthLinkState(initial);
  const [result, setResult] = useState<{ ok: true; next: string } | { ok: false; message: string } | null>(null);

  // Después de confirmar, llevar a la persona a la app (con un instante para ver el ✅).
  useEffect(() => {
    if (!result?.ok) return;
    const id = window.setTimeout(() => router.replace(result.next), 1400);
    return () => window.clearTimeout(id);
  }, [result, router]);

  if (result?.ok) {
    return (
      <div className="space-y-6">
        <AuthHero emoji="✅" tone="success" title="¡Email confirmado!">
          Tu cuenta está activa. Te llevamos a StudyFlow…
        </AuthHero>
        <Button variant="gradient" size="xl" className="w-full" onClick={() => router.replace(result.next)}>
          Ir ahora <ArrowRight />
        </Button>
      </div>
    );
  }

  if (link.kind === "token" && !result) {
    const copy = CONFIRM_COPY[link.type];
    return (
      <div className="space-y-6">
        <AuthHero emoji="📩" eyebrow="Último paso" title={copy.title}>
          {copy.text}
        </AuthHero>
        <ConfirmLinkButton
          tokenHash={link.tokenHash}
          type={link.type}
          onVerified={() => setResult({ ok: true, next: copy.next })}
          onError={(message) => setResult({ ok: false, message })}
        />
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <LockKeyhole className="size-3.5" /> Por seguridad, este enlace funciona una sola vez.
        </p>
      </div>
    );
  }

  if (link.kind === "verified") {
    return (
      <div className="space-y-6">
        <AuthHero emoji="✅" tone="success" title="¡Tu email ya está confirmado!">
          Abriste el enlace en otro navegador o dispositivo. Iniciá sesión con tu email y contraseña para continuar.
        </AuthHero>
        <Link href="/login?next=/onboarding" className={buttonVariants({ variant: "gradient", size: "xl", className: "w-full" })}>
          INICIAR SESIÓN <ArrowRight />
        </Link>
      </div>
    );
  }

  if (link.kind === "error" || result) {
    return (
      <div className="space-y-6">
        <AuthHero emoji="⏳" tone="warning" title="Este enlace ya no sirve">
          {result && !result.ok ? `${result.message} ` : "Puede haber vencido o ya se usó. "}
          A veces el antivirus del correo abre el enlace antes que vos: si pasó eso, tu email ya puede estar confirmado.
        </AuthHero>
        <Link href="/login?next=/onboarding" className={buttonVariants({ variant: "gradient", size: "xl", className: "w-full" })}>
          Probar iniciar sesión <ArrowRight />
        </Link>
        <ResendForm kind="signup" />
      </div>
    );
  }

  // Sin enlace: instrucciones (o, si ya hay sesión, ir a la app).
  if (status === "authenticated") {
    return (
      <div className="space-y-6">
        <AuthHero emoji="👋" title="Ya estás dentro">
          Tu sesión está iniciada.
        </AuthHero>
        <Link href="/dashboard" className={buttonVariants({ variant: "gradient", size: "xl", className: "w-full" })}>
          Ir a StudyFlow <ArrowRight />
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <AuthHero emoji="📬" title="Confirmá tu email">
        Abrí el correo que te enviamos y tocá <b className="text-foreground">🚀 TERMINAR REGISTRO</b>.
      </AuthHero>
      <ResendForm kind="signup" />
      <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
        <ShieldCheck className="size-4" /> ¿Ya confirmaste?{" "}
        <Link href="/login" className="font-semibold text-primary-text hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
