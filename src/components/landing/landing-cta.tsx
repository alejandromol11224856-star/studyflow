"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Si un enlace de email vencido termina en la landing con el error en el
 * #fragmento (Supabase lo hace cuando usa la Site URL), llevarlo a la página
 * que lo explica. El servidor no ve el fragmento, por eso va del lado cliente.
 */
function useForwardEmailLinkErrors(enabled: boolean) {
  const router = useRouter();
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!enabled || !/(^|&)(error|error_code)=/.test(hash)) return;
    router.replace(`/confirm-email?${hash}`);
  }, [enabled, router]);
}

/** Llamados a la acción de la landing; cambian si ya hay sesión iniciada. */
export function LandingCta({ variant }: { variant: "header" | "hero" | "dark" }) {
  const { status } = useAuth();
  const authed = status === "authenticated";
  useForwardEmailLinkErrors(variant === "header");

  if (variant === "header") {
    return authed ? (
      <Link href="/dashboard" className={buttonVariants({ variant: "ink", size: "sm" })}>
        Abrir StudyFlow
      </Link>
    ) : (
      <>
        <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Iniciar sesión
        </Link>
        <Link href="/register" className={buttonVariants({ variant: "ink", size: "sm", className: "hidden sm:inline-flex" })}>
          Empezar
        </Link>
      </>
    );
  }

  if (variant === "dark") {
    return (
      <Link
        href={authed ? "/dashboard" : "/register"}
        className={buttonVariants({ size: "lg", className: "bg-[#f4f0e8] text-[#0f1714] shadow-none hover:bg-white" })}
      >
        {authed ? "Abrir StudyFlow" : "Crear mi cuenta"} <ArrowRight />
      </Link>
    );
  }

  return (
    <>
      <Link href={authed ? "/dashboard" : "/register"} className={buttonVariants({ variant: "gradient", size: "xl", className: "w-full sm:w-auto" })}>
        {authed ? "Abrir StudyFlow" : "Empezar gratis"} <ArrowRight />
      </Link>
      {!authed && (
        <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "xl", className: "w-full sm:w-auto" }))}>
          Ya tengo cuenta
        </Link>
      )}
    </>
  );
}
