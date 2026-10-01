import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const VARIANTS = {
  primary:
    "bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary-hover active:scale-[0.98]",
  secondary: "bg-muted text-foreground hover:bg-border/70 active:scale-[0.98]",
  outline: "border border-border bg-card text-foreground hover:bg-muted active:scale-[0.98]",
  ghost: "text-foreground hover:bg-muted",
  soft: "bg-primary-soft text-primary-text hover:brightness-95 dark:hover:brightness-125 active:scale-[0.98]",
  danger: "bg-danger text-white hover:brightness-110 active:scale-[0.98]",
  "danger-ghost": "text-danger hover:bg-danger-soft",
  success: "bg-success text-white hover:brightness-110 active:scale-[0.98]",
} as const;

const SIZES = {
  xs: "h-7 gap-1 rounded-lg px-2.5 text-xs",
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-5 text-[15px]",
  icon: "size-10 rounded-xl",
  "icon-sm": "size-8 rounded-lg",
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
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-150",
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
