"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Código de verificación. Un solo input (accesible, pega el código entero y
 * el celular lo autocompleta con `one-time-code`) dibujado como casillas.
 * Acepta 6 a 10 dígitos: Supabase permite configurar el largo del código.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  invalid,
  label = "Código de verificación",
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Se llama cuando se completan al menos `length` dígitos. */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  label?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const boxes = Math.max(length, value.length);
  const active = Math.min(value.length, boxes - 1);

  return (
    <div className="relative" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={label}
        aria-invalid={invalid || undefined}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={10}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
          onChange(digits);
          if (digits.length >= length && digits.length !== value.length) onComplete?.(digits);
        }}
        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
      />
      <div className="flex justify-center gap-2 sm:gap-2.5" aria-hidden>
        {Array.from({ length: boxes }, (_, i) => {
          const char = value[i];
          const isActive = focused && i === active && !disabled;
          return (
            <span
              key={i}
              className={cn(
                "flex items-center justify-center rounded-2xl border-2 bg-card font-display font-semibold tabular transition-colors",
                // Más de 6 dígitos: casillas más angostas para que entren en el celular.
                boxes > 6 ? "h-12 w-7 text-xl sm:w-9" : "h-14 w-11 text-[26px] sm:h-16 sm:w-12",
                invalid ? "border-danger/60" : isActive ? "border-primary" : char ? "border-foreground/25" : "border-input",
                disabled && "opacity-60",
              )}
            >
              {char ?? (isActive ? <span className="h-6 w-0.5 animate-pulse-soft rounded-full bg-primary" /> : "")}
            </span>
          );
        })}
      </div>
    </div>
  );
}
