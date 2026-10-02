import {
  CalendarDays,
  ChartColumn,
  House,
  ListChecks,
  type LucideIcon,
  RotateCcwClock,
  Settings,
  Shapes,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Elemento resaltado por el tutorial. */
  tour?: string;
  group: "main" | "more" | "settings";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Hoy", icon: House, group: "main" },
  { href: "/progress", label: "Progreso", icon: TrendingUp, tour: "progress", group: "main" },
  { href: "/habits", label: "Hábitos", icon: ListChecks, group: "main" },
  { href: "/goals", label: "Objetivos", icon: Target, group: "main" },
  { href: "/sections", label: "Áreas", icon: Shapes, group: "main" },
  { href: "/activities", label: "Historial", icon: RotateCcwClock, group: "more" },
  { href: "/calendar", label: "Calendario", icon: CalendarDays, group: "more" },
  { href: "/achievements", label: "Logros", icon: Trophy, group: "more" },
  { href: "/stats", label: "Estadísticas", icon: ChartColumn, group: "more" },
  { href: "/settings", label: "Ajustes", icon: Settings, group: "settings" },
];

/** Accesos principales en la barra inferior móvil (el resto va en "Más"). */
export const MOBILE_PRIMARY = ["/dashboard", "/progress", "/habits"];

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
