import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div aria-hidden className={cn("skeleton rounded-xl", className)} {...props} />;
}

const PROGRESS_TONES = {
  primary: "bg-[image:var(--gradient-primary)]",
  success: "bg-[image:var(--gradient-success)]",
  xp: "bg-[image:var(--gradient-xp)]",
  streak: "bg-[image:var(--gradient-streak)]",
} as const;

export function Progress({
  value,
  color,
  tone = "primary",
  className,
  barClassName,
  label,
}: {
  /** 0..1 */
  value: number;
  color?: string;
  tone?: keyof typeof PROGRESS_TONES;
  className?: string;
  barClassName?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", PROGRESS_TONES[tone], barClassName)}
        style={{ width: `${pct}%`, ...(color ? { background: color } : null) }}
      />
    </div>
  );
}

const BADGE_TONES = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-primary-text",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
} as const;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: keyof typeof BADGE_TONES }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium [&_svg]:size-3",
        BADGE_TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

/**
 * Estado vacío amable: nunca una pantalla fría. Con `emoji` se muestra un
 * emoji grande (más cálido); si no, el ícono.
 */
export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-2 text-center", compact ? "py-7" : "py-12", className)}>
      <div
        aria-hidden
        className={cn(
          "mb-4 flex items-center justify-center rounded-[22px] bg-primary-soft text-primary-text animate-pop",
          compact ? "size-14 text-[28px]" : "size-[72px] text-[36px]",
        )}
      >
        {emoji ?? (Icon && <Icon className={compact ? "size-6" : "size-8"} />)}
      </div>
      <h3 className={cn("font-bold tracking-tight", compact ? "text-[15px]" : "text-lg")}>{title}</h3>
      {description && <div className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="tablist" className={cn("inline-flex rounded-[14px] bg-muted p-1", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-[10px] font-semibold transition-all",
              size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-3.5 text-sm",
              active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      {children}
    </kbd>
  );
}
