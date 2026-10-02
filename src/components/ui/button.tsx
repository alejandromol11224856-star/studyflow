import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const VARIANTS = {
  primary:
    "bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/25 active:scale-[0.97]",
  /** Acción principal de una pantalla: relleno con gradiente y un poco de brillo. */
  gradient:
    "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97]",
  secondary: "bg-muted text-foreground hover:bg-border/70 active:scale-[0.97]",
  outline: "border border-border bg-card text-foreground hover:border-foreground/15 hover:bg-muted active:scale-[0.97]",
  ghost: "text-foreground hover:bg-muted active:scale-[0.97]",
  soft: "bg-primary-soft text-primary-text hover:brightness-95 dark:hover:brightness-125 active:scale-[0.97]",
  danger: "bg-danger text-white hover:brightness-110 active:scale-[0.97]",
  "danger-ghost": "text-danger hover:bg-danger-soft",
  success: "bg-success text-white hover:brightness-110 active:scale-[0.97]",
} as const;

const SIZES = {
  xs: "h-7 gap-1 rounded-lg px-2.5 text-xs",
  sm: "h-9 gap-1.5 rounded-xl px-3.5 text-[13px]",
  md: "h-11 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-2xl px-5 text-[15px] [&_svg]:size-[18px]",
  /** Botones grandes y fáciles de tocar (acciones principales en el celular). */
  xl: "h-14 gap-2.5 rounded-2xl px-6 text-base font-semibold tracking-tight [&_svg]:size-5",
  icon: "size-11 rounded-xl",
  "icon-sm": "size-9 rounded-xl",
  "icon-lg": "size-12 rounded-2xl",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold transition-all duration-150 ease-out",
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({ variant, size, loading, className, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
