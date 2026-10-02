"use client";

import { ArrowRight, Eye, EyeOff, HardDrive, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { AuthLinkState } from "@/lib/auth-links";
import { browserTimeZone } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { safeNextPath } from "@/lib/utils";
import { emailSchema, fieldErrors, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validation";
import {
  AuthHero,
  ConfirmLinkButton,
  OpenMailButton,
  ResendButton,
  savePendingSignup,
  useAuthLinkState,
  usePendingSignup,
} from "./email-flow";

function PasswordInput(props: ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-12" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1.5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </div>
  );
}

function FormAlert({ children, tone = "danger" }: { children: React.ReactNode; tone?: "danger" | "info" }) {
  return (
    <div
      role="alert"
      className={
        tone === "danger"
          ? "flex gap-2.5 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger"
          : "flex gap-2.5 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground"
      }
    >
      {tone === "danger" ? <TriangleAlert className="mt-0.5 size-4 shrink-0" /> : <HardDrive className="mt-0.5 size-4 shrink-0" />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function AuthHeading({ emoji, title, description }: { emoji?: string; title: string; description: React.ReactNode }) {
  return (
    <div className="mb-7">
      {emoji && (
        <span className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-2xl" aria-hidden>
          {emoji}
        </span>
      )}
      <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">{description}</p>
    </div>
  );
}

function LocalModeNote() {
  const { mode } = useAuth();
  if (mode !== "local") return null;
  return (
    <div className="mt-6">
      <FormAlert tone="info">
        <b className="font-medium text-foreground">Modo local:</b> la cuenta y los datos se guardan en este navegador.
        Configurá Supabase para usar la nube.
      </FormAlert>
    </div>
  );
}

/** Si ya hay sesión, ir al destino. */
function useRedirectWhenAuthenticated(target: string, enabled = true) {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (enabled && status === "authenticated") {
      router.replace(target);
      router.refresh();
    }
  }, [enabled, status, router, target]);
}

const isUnconfirmedError = (error: unknown) => /email not confirmed/i.test(error instanceof Error ? error.message : String(error));

// ---------------------------------------------------------------------------
export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const { signIn } = useAuth();
  const target = safeNextPath(next);
  useRedirectWhenAuthenticated(target);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(
    linkError ? "Ese enlace venció o ya se usó. Si ya confirmaste tu email, iniciá sesión; si no, pedí uno nuevo." : null,
  );
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setFormError(null);
    setUnconfirmed(false);
    setLoading(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
    } catch (error) {
      setUnconfirmed(isUnconfirmedError(error));
      setFormError(getErrorMessage(error));
      setLoading(false);
    }
  }

  return (
    <>
      <AuthHeading
        emoji="👋"
        title="¡Hola de nuevo!"
        description={
          <>
            ¿No tenés cuenta?{" "}
            <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-primary-text hover:underline">
              Creá una gratis
            </Link>
          </>
        }
      />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && (
          <FormAlert>
            {formError}
            {unconfirmed && <ResendButton className="mt-3" email={email.trim()} kind="signup" variant="soft" />}
          </FormAlert>
        )}
        <Field label="Email" error={errors.email}>
          {(id, d) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              inputMode="email"
              aria-describedby={d}
              aria-invalid={!!errors.email || undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vos@email.com"
              autoFocus
            />
          )}
        </Field>
        <Field
          label={
            <span className="flex w-full justify-between">
              Contraseña
              <Link href="/forgot-password" className="font-normal text-muted-foreground hover:text-foreground">
                ¿La olvidaste?
              </Link>
            </span>
          }
          error={errors.password}
        >
          {(id, d) => (
            <PasswordInput
              id={id}
              autoComplete="current-password"
              aria-describedby={d}
              aria-invalid={!!errors.password || undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" variant="gradient" size="xl" className="w-full" loading={loading}>
          Entrar <ArrowRight />
        </Button>
      </form>
      <LocalModeNote />
    </>
  );
}

// ---------------------------------------------------------------------------
export function RegisterForm({ next, editing }: { next?: string; editing?: boolean }) {
  const { signUp } = useAuth();
  const router = useRouter();
  useRedirectWhenAuthenticated(safeNextPath(next, "/onboarding"));
  // Al tocar "Cambiar email" volvemos acá con los datos cargados (null = sin editar todavía).
  const pending = usePendingSignup();
  const [nameDraft, setDisplayName] = useState<string | null>(null);
  const [emailDraft, setEmail] = useState<string | null>(null);
  const displayName = nameDraft ?? (editing ? (pending?.displayName ?? "") : "");
  const email = emailDraft ?? (editing ? (pending?.email ?? "") : "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse({ displayName, email, password });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setFormError(null);
    setLoading(true);
    try {
      const result = await signUp({ ...parsed.data, timezone: browserTimeZone() });
      if (!result.sessionCreated) {
        savePendingSignup({ email: parsed.data.email, displayName: parsed.data.displayName });
        router.push("/check-email");
        return;
      }
      toast.success("¡Cuenta creada! Bienvenido a StudyFlow 🎉");
    } catch (error) {
      setFormError(getErrorMessage(error));
      setLoading(false);
    }
  }

  return (
    <>
      <AuthHeading
        emoji="🚀"
        title={editing ? "Corregí tu email" : "Creá tu cuenta"}
        description={
          editing ? (
            "Escribí el email correcto y te mandamos un enlace nuevo."
          ) : (
            <>
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="font-semibold text-primary-text hover:underline">
                Iniciá sesión
              </Link>
            </>
          )
        }
      />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field label="Nombre" error={errors.displayName}>
          {(id, d) => (
            <Input
              id={id}
              autoComplete="given-name"
              aria-describedby={d}
              aria-invalid={!!errors.displayName || undefined}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="¿Cómo te llamás?"
              autoFocus={!editing}
            />
          )}
        </Field>
        <Field label="Email" error={errors.email}>
          {(id, d) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              inputMode="email"
              aria-describedby={d}
              aria-invalid={!!errors.email || undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vos@email.com"
              autoFocus={editing}
            />
          )}
        </Field>
        <Field label="Contraseña" error={errors.password} hint="Mínimo 8 caracteres.">
          {(id, d) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              aria-describedby={d}
              aria-invalid={!!errors.password || undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" variant="gradient" size="xl" className="w-full" loading={loading}>
          {editing ? "Enviar enlace nuevo" : "Crear mi cuenta"} <ArrowRight />
        </Button>
        <p className="text-center text-xs text-muted-foreground">Gratis. Sin tarjeta de crédito.</p>
      </form>
      <LocalModeNote />
    </>
  );
}

// ---------------------------------------------------------------------------
export function ForgotPasswordForm() {
  const { sendPasswordReset, mode } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Email inválido.");
    setError(null);
    setLoading(true);
    try {
      await sendPasswordReset(parsed.data);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <AuthHero emoji="📬" title="¡Revisá tu correo!">
          Si existe una cuenta con <b className="break-all text-foreground">{email.trim()}</b>, vas a recibir un enlace para crear
          una nueva contraseña.
        </AuthHero>
        <div className="space-y-3">
          <OpenMailButton email={email.trim()} />
          <ResendButton email={email.trim()} kind="recovery" />
        </div>
        <Link href="/login" className="block text-center text-sm font-semibold text-primary-text hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      <AuthHeading emoji="🔑" title="Recuperá tu contraseña" description="Te mandamos un enlace para crear una nueva." />
      {mode === "local" ? (
        <FormAlert tone="info">
          La recuperación por email necesita Supabase configurado. En modo local podés crear otra cuenta.
        </FormAlert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Email" error={error}>
            {(id, d) => (
              <Input
                id={id}
                type="email"
                autoComplete="email"
                inputMode="email"
                aria-describedby={d}
                aria-invalid={!!error || undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vos@email.com"
                autoFocus
              />
            )}
          </Field>
          <Button type="submit" variant="gradient" size="xl" className="w-full" loading={loading}>
            Enviar enlace
          </Button>
        </form>
      )}
      <Link href="/login" className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground">
        ← Volver a iniciar sesión
      </Link>
    </>
  );
}

// ---------------------------------------------------------------------------
export function ResetPasswordForm({ link: initialLink }: { link: AuthLinkState }) {
  const { updatePassword, status } = useAuth();
  const router = useRouter();
  const link = useAuthLinkState(initialLink);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = resetPasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setLoading(true);
    try {
      await updatePassword(parsed.data.password);
      toast.success("Contraseña actualizada 🔐");
      router.replace("/dashboard");
    } catch (error) {
      setFormError(getErrorMessage(error));
      setLoading(false);
    }
  }

  const expired = (
    <div className="space-y-6">
      <AuthHero emoji="⏳" tone="warning" title="Este enlace ya no sirve">
        {linkError ?? "Puede haber vencido o ya se usó."} Pedí uno nuevo y abrilo apenas te llegue.
      </AuthHero>
      <Link href="/forgot-password" className={buttonVariants({ variant: "gradient", size: "xl", className: "w-full" })}>
        Pedir un enlace nuevo
      </Link>
    </div>
  );

  // Enlace nuevo del email: se usa recién cuando la persona toca el botón.
  if (link.kind === "token" && status !== "authenticated") {
    if (linkError) return expired;
    return (
      <div className="space-y-6">
        <AuthHero emoji="🔐" eyebrow="Recuperar contraseña" title="Creá una nueva contraseña">
          Tocá el botón para continuar. Por seguridad, el enlace funciona una sola vez.
        </AuthHero>
        <ConfirmLinkButton tokenHash={link.tokenHash} type={link.type} onVerified={() => undefined} onError={setLinkError} />
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }
  if (status === "unauthenticated" || link.kind === "error") return expired;

  return (
    <>
      <AuthHeading emoji="🔐" title="Nueva contraseña" description="Elegí una contraseña segura que no uses en otros sitios." />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field label="Nueva contraseña" error={errors.password} hint="Mínimo 8 caracteres.">
          {(id, d) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              aria-describedby={d}
              aria-invalid={!!errors.password || undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          )}
        </Field>
        <Field label="Repetí la contraseña" error={errors.confirm}>
          {(id, d) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              aria-describedby={d}
              aria-invalid={!!errors.confirm || undefined}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" variant="gradient" size="xl" className="w-full" loading={loading}>
          Guardar contraseña
        </Button>
      </form>
    </>
  );
}
