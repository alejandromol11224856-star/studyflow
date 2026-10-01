import { CalendarCheck, CircleCheck, Clock, Crown, Flag, Flame, Lock, Mountain, Repeat, Star, Target, Trophy, Zap } from "lucide-react";
import { createElement } from "react";
import type { AchievementDefinition } from "@/lib/domain/progression";
import { cn } from "@/lib/utils";

const ICONS = {
  flag: Flag,
  flame: Flame,
  clock: Clock,
  zap: Zap,
  check: CircleCheck,
  target: Target,
  calendar: CalendarCheck,
  repeat: Repeat,
  star: Star,
  crown: Crown,
  trophy: Trophy,
  mountain: Mountain,
} satisfies Record<AchievementDefinition["icon"], typeof Flag>;

/** Medalla del logro: con acento si está desbloqueado, apagada y con candado si no. */
export function AchievementBadge({
  icon,
  earned,
  size = "md",
}: {
  icon: AchievementDefinition["icon"];
  earned: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "lg" ? "size-14 rounded-2xl [&_svg]:size-7" : size === "sm" ? "size-9 rounded-xl [&_svg]:size-4" : "size-11 rounded-xl [&_svg]:size-5";
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        box,
        earned ? "bg-primary-soft text-primary-text" : "bg-muted text-muted-foreground/60",
      )}
    >
      {createElement(ICONS[icon], { "aria-hidden": true })}
      {!earned && (
        <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border">
          <Lock className="!size-2.5" />
        </span>
      )}
    </span>
  );
}
