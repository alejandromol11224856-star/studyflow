"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  loading,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground sm:text-[13px]">{label}</p>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            accent ? "bg-primary-soft text-primary-text" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-24" />
      ) : (
        <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs leading-snug text-muted-foreground">{hint}</p>}
    </Card>
  );
}
