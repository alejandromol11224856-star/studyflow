"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

interface DialogContentProps {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Oculta visualmente el título (sigue disponible para lectores de pantalla). */
  hideHeader?: boolean;
  onOpenAutoFocus?: (e: Event) => void;
}

const SIZE = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl" };

/**
 * Modal responsive: hoja inferior (bottom sheet) en móvil y diálogo centrado
 * en escritorio.
 */
export function DialogContent({
  title,
  description,
  children,
  className,
  size = "md",
  hideHeader,
  onOpenAutoFocus,
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-50 bg-[#0b0a12]/50 backdrop-blur-[3px]" />
      <DialogPrimitive.Content
        onOpenAutoFocus={onOpenAutoFocus}
        className={cn(
          "dialog-content fixed z-50 flex max-h-[92dvh] w-full flex-col overflow-hidden border border-border bg-popover shadow-elevated outline-none",
          "inset-x-0 bottom-0 rounded-t-[28px]",
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px]",
          SIZE[size],
          className,
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden" aria-hidden />
        <div className={cn("flex items-start justify-between gap-4 px-5 pt-4 sm:px-6 sm:pt-6", hideHeader && "sr-only")}>
          <div className="min-w-0">
            <DialogPrimitive.Title className="font-display text-[22px] font-semibold">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            className="-mr-1.5 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-6">
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>button]:w-full sm:[&>button]:w-auto", className)}>
      {children}
    </div>
  );
}
