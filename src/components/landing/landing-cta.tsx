"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Llamados a la acción de la landing; cambian si ya hay sesión iniciada. */
export function LandingCta({ variant }: { variant: "header" | "hero" | "dark" }) {
  const { status } = useAuth();
  const authed = status === "authenticated";

  if (variant === "header") {
    return authed ? (
      <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
        Ir al dashboard
      </Link>
    ) : (
      <>
        <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Iniciar sesión
        </Link>
        <Link href="/register" className={buttonVariants({ size: "sm", className: "hidden sm:inline-flex" })}>
          Empezar gratis
        </Link>
      </>
    );
  }

  if (variant === "dark") {
    return (
      <Link
        href={authed ? "/dashboard" : "/register"}
        className={buttonVariants({ size: "lg", className: "bg-white text-[#0c0a1d] shadow-none hover:bg-white/90" })}
      >
        {authed ? "Abrir StudyFlow" : "Crear mi cuenta"} <ArrowRight />
      </Link>
    );
  }

  return (
    <>
      <Link href={authed ? "/dashboard" : "/register"} className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}>
        {authed ? "Ir a mi dashboard" : "Empezar gratis"} <ArrowRight />
      </Link>
      {!authed && (
        <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" }))}>
          Ya tengo cuenta
        </Link>
      )}
    </>
  );
}
