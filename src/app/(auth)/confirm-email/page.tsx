import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConfirmEmailView } from "@/components/auth/email-flow";
import { parseAuthLink } from "@/lib/auth-links";

export const metadata: Metadata = {
  title: "Confirmá tu email",
  // La URL lleva un token de un solo uso: que no se indexe ni viaje como Referer.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Params = Record<string, string | string[] | undefined>;

function toSearchParams(params: Params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (typeof value === "string") search.set(key, value);
  return search;
}

/**
 * Página intermedia de confirmación. Abrirla NO usa el enlace: solo se usa al
 * tocar "Confirmar mi email" (los escáneres de correo no tocan botones).
 */
export default async function ConfirmEmailPage({ searchParams }: { searchParams: Promise<Params> }) {
  const search = toSearchParams(await searchParams);

  // Plantilla por defecto de Supabase (flujo PKCE): el enlace ya se verificó y
  // llega con ?code=. Se canjea del lado del servidor.
  const code = search.get("code");
  if (code) redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=/onboarding`);

  return <ConfirmEmailView initial={parseAuthLink(search)} />;
}
