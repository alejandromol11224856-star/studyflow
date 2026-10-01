import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Layout de la zona privada. Con Supabase, la sesión se valida en el servidor
 * antes de renderizar (además del proxy). En modo local la valida el AppShell.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) redirect("/login");
  }
  return <AppShell>{children}</AppShell>;
}
