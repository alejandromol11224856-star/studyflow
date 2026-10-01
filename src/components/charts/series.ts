import { NO_SECTION_KEY } from "@/lib/domain/stats";
import { UNASSIGNED_COLOR, sectionColor } from "@/lib/sections";
import type { DailyTotal, Section } from "@/lib/types";
import type { ChartSeries } from "./charts";

/**
 * Series de un gráfico por sección, en el orden de las secciones (estable:
 * el color sigue a la sección, nunca a su posición en el ranking).
 */
export function buildSectionSeries(sections: Section[], totals: DailyTotal[]): ChartSeries[] {
  const present = new Set(totals.filter((t) => t.seconds > 0).map((t) => t.sectionId ?? NO_SECTION_KEY));
  const series: ChartSeries[] = sections
    .filter((s) => present.has(s.id))
    .map((s) => ({ key: s.id, name: s.name, color: sectionColor(s.color) }));
  if (present.has(NO_SECTION_KEY)) series.push({ key: NO_SECTION_KEY, name: "Sin sección", color: UNASSIGNED_COLOR });
  return series;
}
