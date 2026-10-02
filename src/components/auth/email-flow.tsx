"use client";

import { ArrowRight, Inbox, LockKeyhole, Mail, PencilLine, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { EnvelopeIllustration, PathIllustration, SproutIllustration } from "@/components/brand/illustrations";
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
import { OtpInput } from "./otp-input";

// ---------------------------------------------------------------------------
// Registro pendiente (para "Revisá tu correo" y "Cambiar email").
// Vive en sessionStorage: no viaja en la URL ni queda guardado para siempre.
// ---------------------------------------------------------------------------
const PENDING_KEY = "studyflow:pending-signup";
const PENDING_EVENT = "studyflow:pending-signup";

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
  window.dispatchEvent(new Event(PENDING_EVENT));
}

function subscribePending(listener: () => void) {
  window.addEventListener(PENDING_EVENT, listener);
  return () => window.removeEventListener(PENDING_EVENT, listener);
}

/** Lee sessionStorage sin romper la hidratación (en el servidor no hay nada). */
export function usePendingSignup(): PendingSignup | null {
  const raw = useSyncExternalStore(
    subscribePending,
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
  art,
  eyebrow,
  title,
  children,
}: {
  art?: React.ReactNode;
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="text-center">
      {art && <div className="mx-auto mb-4 flex justify-center [&_svg]:w-36">{art}</div>}
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-1 font-display text-[32px] font-semibold leading-[1.1]">{title}</h1>
      {children && <div className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-muted-foreground">{children}</div>}
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

export function OpenMailButton({ email, className, variant = "outline" }: { email: string | null; className?: string; variant?: "outline" | "gradient" }) {
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
      className={buttonVariants({ variant, size: "lg", className: cn("w-full", className) })}
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
  label = "Reenviar código",
}: {
  email: string;
  kind: "signup" | "recovery";
  variant?: "outline" | "soft" | "primary" | "ghost";
  className?: string;
  label?: string;
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
      toast.success("Te enviamos otro correo", { description: `Revisá ${email} (y la carpeta de spam).` });
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
        {!sending && <RefreshCw />} {label}
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
      <p className="text-sm font-semibold">{kind === "signup" ? "¿Necesitás otro correo?" : "¿Necesitás un enlace nuevo?"}</p>
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
      <ResendButton className="mt-3" email={email.trim()} kind={kind} label="Reenviar correo" />
    </div>
  );
}

/**
 * Código de 6 dígitos: se escribe (o se pega) y se confirma sin salir de la
 * app. Se usa para confirmar la cuenta y para recuperar la contraseña.
 */
export function VerifyCodeForm({
  email,
  kind,
  onVerified,
}: {
  email: string;
  kind: "signup" | "recovery";
  onVerified: () => void;
}) {
  const { verifyEmailCode } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify(value = code) {
    if (value.length < 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await verifyEmailCode(email, value, kind);
      onVerified();
    } catch (err) {
      setError(/venció o ya se usó/.test(getErrorMessage(err)) ? "El código no es correcto o ya venció. Revisalo o pedí uno nuevo." : getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void verify();
      }}
    >
      <OtpInput
        value={code}
        onChange={(v) => {
          setCode(v);
          if (error) setError(null);
        }}
        onComplete={(v) => void verify(v)}
        disabled={busy}
        invalid={Boolean(error)}
        autoFocus
      />
      <p className="min-h-5 text-center text-sm font-medium text-danger" role="alert">
        {error ?? ""}
      </p>
      <Button type="submit" variant="gradient" size="xl" className="w-full" loading={busy} disabled={code.length < 6}>
        {kind === "signup" ? "Confirmar" : "Continuar"} {!busy && <ArrowRight />}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// "Revisá tu correo" (después de registrarse): código dentro de la app
// ---------------------------------------------------------------------------
export function CheckEmailView() {
  const router = useRouter();
  const pending = usePendingSignup();
  const [typedEmail, setTypedEmail] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState<string | null>(null);
  const email = pending?.email ?? emailConfirmed;

  const onVerified = () => {
    toast.success("Cuenta confirmada", { description: "Bienvenido a StudyFlow." });
    router.replace("/onboarding");
  };

  if (!email) {
    return (
      <div className="space-y-6">
        <AuthHero art={<EnvelopeIllustration />} title="Revisá tu correo">
          Escribí el email con el que te registraste y después el código que te mandamos.
        </AuthHero>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (emailSchema.safeParse(typedEmail).success) setEmailConfirmed(typedEmail.trim());
            else toast.error("Escribí un email válido.");
          }}
        >
          <Input type="email" inputMode="email" autoComplete="email" placeholder="vos@email.com" aria-label="Tu email" value={typedEmail} onChange={(e) => setTypedEmail(e.target.value)} />
          <Button type="submit" variant="gradient" size="lg" className="w-full">
            Seguir
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya confirmaste?{" "}
          <Link href="/login" className="font-semibold text-primary-text hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <AuthHero art={<EnvelopeIllustration />} eyebrow="Último paso" title="Revisá tu correo">
        Te mandamos un código de 6 dígitos a
        <span className="mt-2 block break-all font-semibold text-foreground">{email}</span>
      </AuthHero>

      <VerifyCodeForm email={email} kind="signup" onVerified={onVerified} />

      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-2">
          <OpenMailButton email={email} />
          <Button variant="outline" size="lg" className="w-full" onClick={() => router.push("/register?edit=1")}>
            <PencilLine /> Cambiar email
          </Button>
        </div>
        <ResendButton email={email} kind="signup" variant="ghost" />
      </div>

      <p className="flex gap-2.5 rounded-2xl bg-muted/70 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <Mail className="mt-0.5 size-4 shrink-0" />
        <span>
          ¿No lo ves? Revisá <b className="text-foreground">spam</b> o <b className="text-foreground">promociones</b>. También podés tocar el
          botón del correo, en cualquier dispositivo.
        </span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// /confirm-email: la persona toca el botón para usar el enlace del correo
// ---------------------------------------------------------------------------
const CONFIRM_COPY: Record<EmailLinkType, { title: string; text: string; button: string; next: string }> = {
  email: { title: "Confirmá tu email", text: "Tocá el botón para activar tu cuenta y empezar a usar StudyFlow.", button: "Confirmar mi email", next: "/onboarding" },
  signup: { title: "Confirmá tu email", text: "Tocá el botón para activar tu cuenta y empezar a usar StudyFlow.", button: "Confirmar mi email", next: "/onboarding" },
  email_change: { title: "Confirmá tu nuevo email", text: "Tocá el botón para empezar a usar este email en StudyFlow.", button: "Confirmar mi email", next: "/settings" },
  invite: { title: "Aceptá la invitación", text: "Tocá el botón para entrar a StudyFlow.", button: "Entrar a StudyFlow", next: "/onboarding" },
  magiclink: { title: "Entrá a StudyFlow", text: "Tocá el botón para iniciar sesión.", button: "Entrar a StudyFlow", next: "/dashboard" },
  recovery: { title: "Creá una nueva contraseña", text: "Tocá el botón para continuar.", button: "Crear nueva contraseña", next: "/reset-password" },
};

/** Lee el #fragmento (Supabase puede mandar ahí los errores) sin romper la hidratación. */
function useLocationHash() {
  return useSyncExternalStore(
    () => () => {},
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

  // Después de confirmar, llevar a la persona a la app (con un instante para ver la confirmación).
  useEffect(() => {
    if (!result?.ok) return;
    const id = window.setTimeout(() => router.replace(result.next), 1400);
    return () => window.clearTimeout(id);
  }, [result, router]);

  if (result?.ok) {
    return (
      <div className="space-y-6">
        <AuthHero art={<SproutIllustration />} title="Email confirmado.">
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
        <AuthHero art={<EnvelopeIllustration />} eyebrow="Último paso" title={copy.title}>
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
        <AuthHero art={<SproutIllustration />} title="Tu email ya está confirmado.">
          Abriste el enlace en otro navegador o dispositivo. Iniciá sesión con tu email y contraseña para continuar.
        </AuthHero>
        <Link href="/login?next=/onboarding" className={buttonVariants({ variant: "gradient", size: "xl", className: "w-full" })}>
          Iniciar sesión <ArrowRight />
        </Link>
      </div>
    );
  }

  if (link.kind === "error" || result) {
    return (
      <div className="space-y-6">
        <AuthHero art={<PathIllustration />} title="Este enlace ya no sirve">
          {result && !result.ok ? `${result.message} ` : "Puede haber vencido o ya se usó. "}
          A veces el antivirus del correo lo abre antes que vos: si pasó eso, tu email ya puede estar confirmado.
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
        <AuthHero art={<SproutIllustration />} title="Ya estás dentro.">
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
      <AuthHero art={<EnvelopeIllustration />} title="Confirmá tu email">
        Escribí el código que te mandamos o tocá el botón del correo.
      </AuthHero>
      <Link href="/check-email" className={buttonVariants({ variant: "gradient", size: "xl", className: "w-full" })}>
        Ingresar el código <ArrowRight />
      </Link>
      <ResendForm kind="signup" />
    </div>
  );
}
