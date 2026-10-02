"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";

/** Pantalla de error recuperable (usada por los error boundaries de Next). */
export function ErrorView({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <TriangleAlert className="size-6" />
      </div>
      <h1 className="mt-5 text-xl font-semibold tracking-tight">Algo salió mal</h1>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {getErrorMessage(error, "No pudimos cargar esta página. Probá de nuevo en unos segundos.")}
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={() => retry()}>
          <RotateCcw /> Reintentar
        </Button>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Ir al inicio
        </Link>
      </div>
      {error.digest && <p className="mt-6 font-mono text-[11px] text-muted-foreground">Código: {error.digest}</p>}
    </div>
  );
}
