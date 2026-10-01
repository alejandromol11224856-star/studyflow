"use client";

import { LogOut, Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { MOBILE_PRIMARY, NAV_ITEMS, isActivePath } from "./nav-items";
import { ThemeSwitcher, ThemeToggleButton } from "./theme-toggle";
import { SidebarTimer } from "./timer-widgets";
import { UserMenu, useSignOut } from "./user-menu";

export function Sidebar() {
  const pathname = usePathname();
  const dialogs = useDialogs();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/70 backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/dashboard" aria-label="Ir al inicio">
          <Logo />
        </Link>
        <ThemeToggleButton />
      </div>
      <div className="px-3">
        <Button className="w-full" onClick={() => dialogs.openActivityForm()}>
          <Plus /> Registrar actividad
        </Button>
      </div>
      <nav className="mt-5 flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Principal">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <item.icon className={cn("size-[18px] transition-colors", active ? "text-primary-text" : "group-hover:text-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <SidebarTimer />
      <div className="border-t border-border p-3">
        <UserMenu />
      </div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" aria-label="Ir al inicio">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggleButton />
          <UserMenu compact />
        </div>
      </div>
    </header>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const dialogs = useDialogs();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = NAV_ITEMS.filter((i) => MOBILE_PRIMARY.includes(i.href));
  const secondary = NAV_ITEMS.filter((i) => !MOBILE_PRIMARY.includes(i.href));
  const moreActive = secondary.some((i) => isActivePath(pathname, i.href));
  const signOut = useSignOut();

  const tab = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition-colors",
      active ? "text-primary-text" : "text-muted-foreground active:text-foreground",
    );

  return (
    <>
      <nav
        aria-label="Navegación móvil"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto flex h-16 max-w-md items-stretch px-2">
          {primary.slice(0, 2).map((item) => (
            <Link key={item.href} href={item.href} className={tab(isActivePath(pathname, item.href))}>
              <item.icon className="size-[22px]" />
              {item.label}
            </Link>
          ))}
          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={dialogs.openQuickAdd}
              aria-label="Agregar"
              className="-mt-6 inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/35 ring-4 ring-background transition active:scale-95"
            >
              <Plus className="size-6" />
            </button>
          </div>
          {primary.slice(2).map((item) => (
            <Link key={item.href} href={item.href} className={tab(isActivePath(pathname, item.href))}>
              <item.icon className="size-[22px]" />
              {item.label}
            </Link>
          ))}
          <button type="button" onClick={() => setMoreOpen(true)} className={tab(moreActive)}>
            <Menu className="size-[22px]" />
            Más
          </button>
        </div>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent title="Más opciones" size="sm">
          <div className="grid grid-cols-3 gap-2">
            {secondary.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col gap-2 rounded-2xl border p-3.5 text-sm font-medium transition active:scale-[0.98]",
                    active ? "border-primary/40 bg-primary-soft text-primary-text" : "border-border bg-card hover:bg-muted",
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-4 space-y-3">
            <ThemeSwitcher className="w-full" showLabels />
            <Button variant="danger-ghost" className="w-full" onClick={() => void signOut()}>
              <LogOut /> Cerrar sesión
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
