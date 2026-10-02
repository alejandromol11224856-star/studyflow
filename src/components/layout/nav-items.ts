import { CalendarDays, ChartColumn, Compass, House, ListChecks, RotateCcwClock, Settings, Shapes, Target, Trophy } from "lucide-react";
import type { ComponentType } from "react";
import { GrowthMark } from "@/components/brand/marks";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Elemento resaltado por el tutorial. */
  tour?: string;
  group: "main" | "more" | "settings";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Hoy", icon: House, group: "main" },
  { href: "/progress", label: "Progreso", icon: GrowthMark, tour: "progress", group: "main" },
  { href: "/habits", label: "Hábitos", icon: ListChecks, group: "main" },
  { href: "/goals", label: "Objetivos", icon: Target, group: "main" },
  { href: "/sections", label: "Áreas", icon: Shapes, group: "main" },
  { href: "/methods", label: "Métodos", icon: Compass, group: "main" },
  { href: "/calendar", label: "Calendario", icon: CalendarDays, group: "more" },
  { href: "/activities", label: "Historial", icon: RotateCcwClock, group: "more" },
  { href: "/achievements", label: "Logros", icon: Trophy, group: "more" },
  { href: "/stats", label: "Estadísticas", icon: ChartColumn, group: "more" },
  { href: "/settings", label: "Ajustes", icon: Settings, group: "settings" },
];

/** Accesos principales en la barra inferior móvil (el resto va en "Más"). */
export const MOBILE_PRIMARY = ["/dashboard", "/progress", "/habits"];

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
