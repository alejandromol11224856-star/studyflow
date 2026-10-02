import { ChevronDown } from "lucide-react";
import { type ComponentProps, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

// text-base en móvil evita que iOS haga zoom al enfocar un input.
const FIELD_BASE =
  "w-full rounded-[14px] border border-input bg-card text-base text-foreground transition-[border-color,box-shadow] sm:text-sm " +
  "placeholder:text-muted-foreground/70 focus:border-ring focus:outline-none focus:ring-4 focus:ring-ring/15 " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger aria-invalid:focus:ring-danger/15";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(FIELD_BASE, "h-12 px-4 sm:h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(FIELD_BASE, "min-h-20 resize-y px-4 py-3", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(FIELD_BASE, "h-12 cursor-pointer appearance-none pl-4 pr-10 sm:h-11", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-[13px] font-semibold text-foreground", className)} {...props} />;
}

interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  className?: string;
  children: (id: string, describedBy?: string) => ReactNode;
}

/** Etiqueta + control + ayuda/error con los atributos de accesibilidad conectados. */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const describedBy = error || hint ? `${id}-desc` : undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      {children(id, describedBy)}
      {error ? (
        <p id={describedBy} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={describedBy} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
