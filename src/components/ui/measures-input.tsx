"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ActivityMeasures } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "./input";

const FIELDS: { key: keyof ActivityMeasures; label: string; unit: string; step: number; max: number }[] = [
  { key: "pages", label: "Páginas", unit: "págs", step: 1, max: 100000 },
  { key: "distanceKm", label: "Distancia", unit: "km", step: 0.1, max: 100000 },
  { key: "reps", label: "Repeticiones", unit: "reps", step: 1, max: 10000000 },
];

export function parseMeasure(value: string, decimals = 0) {
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

/**
 * Medidas opcionales de una actividad (páginas, km, repeticiones). Plegadas
 * por defecto para no recargar el formulario cuando solo se mide tiempo.
 */
export function MeasuresInput({
  value,
  onChange,
  defaultOpen,
}: {
  value: Partial<ActivityMeasures>;
  onChange: (value: Partial<ActivityMeasures>) => void;
  defaultOpen?: boolean;
}) {
  const hasValues = Boolean(value.pages || value.distanceKm || value.reps);
  const [open, setOpen] = useState(defaultOpen || hasValues);
  const [raw, setRaw] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, value[f.key] ? String(value[f.key]) : ""])),
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ChevronDown className={cn("size-4 transition-transform", !open && "-rotate-90")} />
        Otras medidas {hasValues ? "" : "(páginas, distancia, repeticiones)"}
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-3 gap-2 animate-fade-in">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1 block text-xs text-muted-foreground">{f.label}</span>
              <span className="relative block">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={f.max}
                  step={f.step}
                  placeholder="0"
                  value={raw[f.key]}
                  onChange={(e) => {
                    setRaw((r) => ({ ...r, [f.key]: e.target.value }));
                    onChange({ ...value, [f.key]: parseMeasure(e.target.value, f.key === "distanceKm" ? 2 : 0) });
                  }}
                  className="pr-11 tabular"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {f.unit}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/** "30 págs · 5 km · 100 reps" (vacío si no hay medidas). */
export function formatActivityMeasures(m: Partial<ActivityMeasures>) {
  const parts: string[] = [];
  if (m.pages) parts.push(`${m.pages} págs`);
  if (m.distanceKm) parts.push(`${m.distanceKm.toLocaleString("es-AR")} km`);
  if (m.reps) parts.push(`${m.reps.toLocaleString("es-AR")} reps`);
  return parts.join(" · ");
}
