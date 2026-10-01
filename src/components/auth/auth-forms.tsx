"use client";

import { Eye, EyeOff, HardDrive, MailCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { browserTimeZone } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { safeNextPath } from "@/lib/utils";
import { emailSchema, fieldErrors, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validation";

function PasswordInput(props: ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-11" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
          ? "flex gap-2.5 rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger"
          : "flex gap-2.5 rounded-xl bg-muted px-3.5 py-3 text-sm text-muted-foreground"
      }
    >
      {tone === "danger" ? <TriangleAlert className="mt-0.5 size-4 shrink-0" /> : <HardDrive className="mt-0.5 size-4 shrink-0" />}
      <div>{children}</div>
    </div>
  );
}

function AuthHeading({ title, description }: { title: string; description: React.ReactNode }) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
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
function useRedirectWhenAuthenticated(target: string) {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(target);
      router.refresh();
    }
  }, [status, router, target]);
}

// ---------------------------------------------------------------------------
export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const { signIn } = useAuth();
  const target = safeNextPath(next);
  useRedirectWhenAuthenticated(target);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(
    linkError ? "El enlace no es válido o expiró. Pedí uno nuevo." : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setFormError(null);
    setLoading(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
    } catch (error) {
      setFormError(getErrorMessage(error));
      setLoading(false);
    }
  }

  return (
    <>
      <AuthHeading
        title="Iniciá sesión"
        description={
          <>
            ¿No tenés cuenta?{" "}
            <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-primary-text hover:underline">
              Creá una gratis
            </Link>
          </>
        }
      />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && <FormAlert>{formError}</FormAlert>}
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
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Entrar
        </Button>
      </form>
      <LocalModeNote />
    </>
  );
}

// ---------------------------------------------------------------------------
export function RegisterForm({ next }: { next?: string }) {
  const { signUp } = useAuth();
  useRedirectWhenAuthenticated(safeNextPath(next, "/onboarding"));
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse({ displayName, email, password });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setFormError(null);
    setLoading(true);
    try {
      const result = await signUp({ ...parsed.data, timezone: browserTimeZone() });
      if (!result.sessionCreated) setConfirmEmail(parsed.data.email);
      else toast.success("¡Cuenta creada! Bienvenido a StudyFlow");
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  if (confirmEmail) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
          <MailCheck className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Confirmá tu email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Te enviamos un enlace a <b className="text-foreground">{confirmEmail}</b>. Abrilo para activar tu cuenta.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-primary-text hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      <AuthHeading
        title="Creá tu cuenta"
        description={
          <>
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="font-medium text-primary-text hover:underline">
              Iniciá sesión
            </Link>
          </>
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
              autoFocus
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
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Crear cuenta
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
      <div className="text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
          <MailCheck className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Revisá tu email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Si existe una cuenta con <b className="text-foreground">{email}</b>, vas a recibir un enlace para crear una nueva
          contraseña.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-primary-text hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      <AuthHeading title="Recuperá tu contraseña" description="Te enviamos un enlace para crear una nueva." />
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
                aria-describedby={d}
                aria-invalid={!!error || undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vos@email.com"
                autoFocus
              />
            )}
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
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
export function ResetPasswordForm() {
  const { updatePassword, status } = useAuth();
  const router = useRouter();
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
      toast.success("Contraseña actualizada");
      router.replace("/dashboard");
    } catch (error) {
      setFormError(getErrorMessage(error));
      setLoading(false);
    }
  }

  if (status === "unauthenticated") {
    return (
      <>
        <AuthHeading title="Enlace vencido" description="El enlace para cambiar la contraseña no es válido o ya expiró." />
        <Link href="/forgot-password" className="text-sm font-medium text-primary-text hover:underline">
          Pedir un enlace nuevo
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Nueva contraseña" description="Elegí una contraseña segura que no uses en otros sitios." />
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
        <Button type="submit" size="lg" className="w-full" loading={loading} disabled={status === "loading"}>
          Guardar contraseña
        </Button>
      </form>
    </>
  );
}
