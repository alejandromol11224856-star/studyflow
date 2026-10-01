"use client";

import { Check, Layers } from "lucide-react";
import { createElement } from "react";
import {
  SECTION_COLORS,
  SECTION_COLOR_LABEL,
  SECTION_COLOR_ORDER,
  SECTION_ICONS,
  type SectionColor,
  type SectionIcon,
  sectionColor,
  sectionIconComponent,
} from "@/lib/sections";
import type { Section } from "@/lib/types";
import { cn } from "@/lib/utils";

const AVATAR_SIZES = {
  xs: "size-6 rounded-md [&_svg]:size-3.5",
  sm: "size-8 rounded-lg [&_svg]:size-4",
  md: "size-10 rounded-xl [&_svg]:size-5",
  lg: "size-12 rounded-2xl [&_svg]:size-6",
} as const;

export function SectionIconGlyph({ icon, className }: { icon: string | null | undefined; className?: string }) {
  return createElement(sectionIconComponent(icon), { className, "aria-hidden": true });
}

/** Ícono de la sección sobre un fondo suave de su color. */
export function SectionAvatar({
  section,
  size = "md",
  className,
}: {
  section: Pick<Section, "icon" | "color"> | null | undefined;
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
}) {
  const hex = sectionColor(section?.color);
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", AVATAR_SIZES[size], className)}
      style={{ backgroundColor: `color-mix(in srgb, ${hex} 15%, transparent)`, color: hex }}
    >
      {section ? <SectionIconGlyph icon={section.icon} /> : <Layers aria-hidden />}
    </span>
  );
}

export function SectionDot({ color, className }: { color: string | null | undefined; className?: string }) {
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", className)} style={{ background: sectionColor(color) }} />;
}

/** Chips horizontales para elegir sección (con opción "Sin sección"). */
export function SectionChips({
  sections,
  value,
  onChange,
  allowNone = true,
  className,
}: {
  sections: Section[];
  value: string | null;
  onChange: (id: string | null) => void;
  allowNone?: boolean;
  className?: string;
}) {
  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-all",
      active
        ? "border-transparent bg-foreground text-background shadow-sm"
        : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
    );
  return (
    <div className={cn("-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none", className)}>
      {sections.map((s) => (
        <button key={s.id} type="button" className={chip(value === s.id)} onClick={() => onChange(s.id)} aria-pressed={value === s.id}>
          <span style={{ color: value === s.id ? undefined : sectionColor(s.color) }} className="[&_svg]:size-4">
            <SectionIconGlyph icon={s.icon} />
          </span>
          {s.name}
        </button>
      ))}
      {allowNone && (
        <button type="button" className={chip(value === null)} onClick={() => onChange(null)} aria-pressed={value === null}>
          Sin sección
        </button>
      )}
    </div>
  );
}

export function ColorPicker({ value, onChange }: { value: SectionColor; onChange: (c: SectionColor) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
      {SECTION_COLOR_ORDER.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={SECTION_COLOR_LABEL[color]}
          onClick={() => onChange(color)}
          className={cn(
            "flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-popover transition-transform hover:scale-110",
            value === color && "ring-2 ring-foreground/70",
          )}
          style={{ background: SECTION_COLORS[color] }}
        >
          {value === color && <Check className="size-4 text-white" />}
        </button>
      ))}
    </div>
  );
}

export function IconPicker({
  value,
  color,
  onChange,
}: {
  value: SectionIcon;
  color: SectionColor;
  onChange: (i: SectionIcon) => void;
}) {
  const hex = SECTION_COLORS[color];
  return (
    <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10" role="radiogroup" aria-label="Ícono">
      {(Object.keys(SECTION_ICONS) as SectionIcon[]).map((icon) => {
        const active = value === icon;
        return (
          <button
            key={icon}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={icon}
            onClick={() => onChange(icon)}
            className={cn(
              "flex aspect-square items-center justify-center rounded-xl border transition-all [&_svg]:size-[18px]",
              active ? "border-transparent" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            style={active ? { background: `color-mix(in srgb, ${hex} 16%, transparent)`, color: hex, borderColor: hex } : undefined}
          >
            <SectionIconGlyph icon={icon} />
          </button>
        );
      })}
    </div>
  );
}
