import { type NextRequest, NextResponse } from "next/server";
import { isEmailLinkType, pageForLinkType } from "@/lib/auth-links";
import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

/**
 * Destino de los enlaces de email con el flujo PKCE (?code=), que es lo que
 * manda Supabase con la plantilla por defecto. También recibe enlaces viejos
 * y errores para derivarlos a la página correcta.
 *
 * Importante: un enlace con token_hash NUNCA se usa en un GET (los escáneres
 * de los correos lo consumirían antes que la persona): se reenvía a la página
 * con el botón "Confirmar".
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"), "/onboarding");
  const isRecovery = next.startsWith("/reset-password");
  const redirect = (path: string, params: Record<string, string | null> = {}) => {
    const url = new URL(path, origin);
    for (const [key, value] of Object.entries(params)) if (value) url.searchParams.set(key, value);
    return NextResponse.redirect(url);
  };

  if (!isSupabaseConfigured) return redirect("/login");

  // Supabase agrega estos parámetros cuando el enlace venció o ya se usó.
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  if (error || errorCode) {
    return redirect(isRecovery ? "/reset-password" : "/confirm-email", {
      error,
      error_code: errorCode,
      error_description: searchParams.get("error_description"),
    });
  }

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (tokenHash && isEmailLinkType(type)) {
    return redirect(pageForLinkType(type), { token_hash: tokenHash, type });
  }

  const code = searchParams.get("code");
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) return redirect(next);
    // Supabase solo agrega ?code= después de verificar el enlace: la cuenta ya
    // está confirmada, pero este navegador no es el que pidió el email (o el
    // enlace ya se había abierto). Para cambiar la contraseña hace falta sesión.
    return isRecovery ? redirect("/reset-password", { status: "invalid" }) : redirect("/confirm-email", { status: "verified" });
  }

  return redirect("/login");
}
