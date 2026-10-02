import { BookOpen, Clock, Dumbbell, type LucideIcon, Repeat, Route } from "lucide-react";
import type { GoalMetric } from "@/lib/types";

/** Ícono de cada métrica (consistente en toda la app). */
export const METRIC_ICONS: Record<GoalMetric, LucideIcon> = {
  time: Clock,
  count: Repeat,
  pages: BookOpen,
  distance: Route,
  reps: Dumbbell,
};

/** Verbo para armar la frase del objetivo: "Quiero leer 30 páginas por día". */
export const METRIC_VERB: Record<GoalMetric, string> = {
  time: "dedicar",
  count: "cumplir",
  pages: "leer",
  distance: "recorrer",
  reps: "hacer",
};

/** Etiqueta corta para las casillas de métrica (en 375 px "Repeticiones" no entra). */
export const METRIC_TILE_LABEL: Record<GoalMetric, string> = {
  time: "Tiempo",
  count: "Veces",
  pages: "Páginas",
  distance: "Distancia",
  reps: "Reps",
};
