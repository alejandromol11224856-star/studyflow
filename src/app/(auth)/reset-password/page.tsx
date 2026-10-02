import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { parseAuthLink } from "@/lib/auth-links";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Params = Record<string, string | string[] | undefined>;

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (typeof value === "string") search.set(key, value);

  // Plantilla por defecto (PKCE): se canjea el código del lado del servidor.
  const code = search.get("code");
  if (code) redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=/reset-password`);

  return <ResetPasswordForm link={parseAuthLink(search)} />;
}
