import { redirect } from "next/navigation";
import { FocusShell } from "@/components/layout/focus-shell";
import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Pantallas a pantalla completa (sin navegación), con sesión requerida. */
export default async function FocusLayout({ children }: { children: React.ReactNode }) {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) redirect("/login");
  }
  return <FocusShell>{children}</FocusShell>;
}
