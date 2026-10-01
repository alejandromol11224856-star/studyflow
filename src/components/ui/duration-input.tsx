"use client";

import { useState } from "react";
import { formatMinutes, secondsToHm } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "./input";

function toInt(value: string, max: number) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

/**
 * Selector de duración (horas + minutos) con atajos. No controlado: toma
 * `defaultSeconds` al montarse y notifica cada cambio en segundos.
 */
export function DurationInput({
  defaultSeconds,
  onChange,
  presets = [15, 30, 45, 60, 90, 120],
  maxHours = 24,
  invalid,
  idPrefix,
}: {
  defaultSeconds: number;
  onChange: (seconds: number) => void;
  presets?: number[];
  maxHours?: number;
  invalid?: boolean;
  idPrefix?: string;
}) {
  const initial = secondsToHm(defaultSeconds);
  const [hours, setHours] = useState(initial.hours ? String(initial.hours) : "");
  const [minutes, setMinutes] = useState(initial.minutes || !initial.hours ? String(initial.minutes || "") : "");

  const emit = (h: string, m: string) => onChange(toInt(h, maxHours) * 3600 + toInt(m, 59) * 60);
  const total = toInt(hours, maxHours) * 60 + toInt(minutes, 59);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            id={idPrefix ? `${idPrefix}-h` : undefined}
            type="number"
            inputMode="numeric"
            min={0}
            max={maxHours}
            placeholder="0"
            value={hours}
            aria-label="Horas"
            aria-invalid={invalid || undefined}
            onChange={(e) => {
              setHours(e.target.value);
              emit(e.target.value, minutes);
            }}
            className="pr-12 tabular"
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">h</span>
        </div>
        <div className="relative flex-1">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            placeholder="0"
            value={minutes}
            aria-label="Minutos"
            aria-invalid={invalid || undefined}
            onChange={(e) => {
              setMinutes(e.target.value);
              emit(hours, e.target.value);
            }}
            className="pr-12 tabular"
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">min</span>
        </div>
      </div>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                const h = Math.floor(preset / 60);
                const m = preset % 60;
                setHours(h ? String(h) : "");
                setMinutes(m ? String(m) : h ? "" : "0");
                onChange(preset * 60);
              }}
              className={cn(
                "h-7 rounded-full border px-2.5 text-xs font-medium transition-colors",
                total === preset
                  ? "border-primary bg-primary-soft text-primary-text"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {formatMinutes(preset)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
