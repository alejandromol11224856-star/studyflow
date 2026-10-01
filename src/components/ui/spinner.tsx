import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle aria-hidden className={cn("size-5 animate-spin text-current", className)} />;
}

export function FullScreenLoader({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-muted-foreground">
      <Spinner className="size-6 text-primary-text" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
