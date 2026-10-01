import {
  CalendarDays,
  ChartColumn,
  Layers,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  RotateCcwClock,
  Settings,
  Target,
  Trophy,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Hoy", icon: LayoutDashboard },
  { href: "/habits", label: "Hábitos", icon: ListChecks },
  { href: "/goals", label: "Objetivos", icon: Target },
  { href: "/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/stats", label: "Estadísticas", icon: ChartColumn },
  { href: "/achievements", label: "Logros", icon: Trophy },
  { href: "/activities", label: "Historial", icon: RotateCcwClock },
  { href: "/sections", label: "Secciones", icon: Layers },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

/** Accesos principales en la barra inferior móvil (el resto va en "Más"). */
export const MOBILE_PRIMARY = ["/dashboard", "/habits", "/calendar"];

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
