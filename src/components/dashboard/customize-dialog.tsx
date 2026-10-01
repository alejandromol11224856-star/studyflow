"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { usePreferences, useUpdatePreferences } from "@/hooks/use-data";
import { type WidgetPreference, defaultWidgets, widgetDefinition } from "@/lib/preferences";
import { cn } from "@/lib/utils";

/** Mostrar/ocultar y reordenar widgets. Cada cambio se guarda al instante. */
export function CustomizeDashboardDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { widgets } = usePreferences();
  const update = useUpdatePreferences();
  const save = (next: WidgetPreference[]) => update.mutate({ widgets: next });

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= widgets.length) return;
    const next = [...widgets];
    [next[index], next[target]] = [next[target], next[index]];
    save(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Personalizar Hoy" description="Elegí qué ver y en qué orden. Se sincroniza en todos tus dispositivos.">
        <ul className="-mx-1 divide-y divide-border">
          {widgets.map((w, i) => {
            const def = widgetDefinition(w.id);
            return (
              <li key={w.id} className={cn("flex items-center gap-3 px-1 py-2.5", !w.visible && "opacity-60")}>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                    aria-label={`Subir ${def.title}`}
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === widgets.length - 1}
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                    aria-label={`Bajar ${def.title}`}
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{def.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{def.description}</p>
                </div>
                <Switch
                  checked={w.visible}
                  label={`Mostrar ${def.title}`}
                  onChange={(visible) => save(widgets.map((x) => (x.id === w.id ? { ...x, visible } : x)))}
                />
              </li>
            );
          })}
        </ul>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => save(defaultWidgets())}>
            Restablecer
          </Button>
          <Button onClick={() => onOpenChange(false)}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
