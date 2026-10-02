import { type NextRequest, NextResponse } from "next/server";
import { isEmailLinkType, pageForLinkType } from "@/lib/auth-links";
import { isSupabaseConfigured } from "@/lib/config";
import { updateSession } from "@/lib/supabase/proxy";

const EMAIL_LINK_PAGES = ["/confirm-email", "/reset-password", "/auth/callback"];

/**
 * Si Supabase no reconoce la URL de redirección, manda el enlace del email a
 * la Site URL (por ejemplo "/?token_hash=..."). Lo derivamos a la página que
 * corresponde en vez de perderlo.
 */
function forwardEmailLink(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (EMAIL_LINK_PAGES.includes(pathname)) return null;

  const type = searchParams.get("type");
  let target: string | null = null;
  if (searchParams.get("token_hash") && isEmailLinkType(type)) target = pageForLinkType(type);
  else if (pathname === "/" && searchParams.get("code")) target = "/auth/callback";
  else if (pathname === "/" && (searchParams.get("error_code") || searchParams.get("error"))) target = "/confirm-email";
  if (!target) return null;

  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  // En modo local la sesión vive en el navegador; la protege el AppShell.
  if (!isSupabaseConfigured) return NextResponse.next();
  return forwardEmailLink(request) ?? updateSession(request);
}

export const config = {
  matcher: [
    // Todo excepto assets estáticos e imágenes.
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
