import Link from "next/link";
import { LogoMark } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <LogoMark className="size-12" />
      <p className="mt-8 text-sm font-medium text-primary-text">Error 404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Esta página no existe</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">Puede que el enlace esté roto o que la página se haya movido.</p>
      <Link href="/dashboard" className={buttonVariants({ className: "mt-8" })}>
        Volver al inicio
      </Link>
    </div>
  );
}
