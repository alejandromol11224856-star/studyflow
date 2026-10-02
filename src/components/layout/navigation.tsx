"use client";

import { LogOut, Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/misc";
import { useProfile } from "@/hooks/use-data";
import { useProgression, useStreaks } from "@/hooks/use-metrics";
import { levelTitle } from "@/lib/domain/progression";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { MOBILE_PRIMARY, NAV_ITEMS, type NavItem, isActivePath } from "./nav-items";
import { ThemeSwitcher, ThemeToggleButton } from "./theme-toggle";
import { SidebarTimer } from "./timer-widgets";
import { UserMenu, useSignOut } from "./user-menu";

/** Tarjeta de "jugador": nivel, XP y racha, siempre a la vista en escritorio. */
function SidebarPlayer() {
  const { data: profile } = useProfile();
  const { progression } = useProgression();
  const streaks = useStreaks();
  const name = profile?.displayName.split(" ")[0] ?? "";
  return (
    <Link
      href="/progress"
      className="lift mx-3 block rounded-3xl border border-border bg-card p-3.5 shadow-card"
      aria-label="Ver tu progreso"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-base font-extrabold text-primary-foreground">
          {progression?.level.level ?? "·"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{name || "Tu progreso"}</p>
          <p className="truncate text-xs font-semibold text-muted-foreground">
            {progression ? `Nivel ${progression.level.level} · ${levelTitle(progression.level.level)}` : "Cargando…"}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold",
            streaks.current > 0 ? "bg-streak-soft text-streak-text" : "bg-muted text-muted-foreground",
          )}
          title="Racha actual"
        >
          🔥 {streaks.current}
        </span>
      </div>
      <Progress className="mt-3 h-2" tone="xp" value={progression?.level.ratio ?? 0} label="XP hacia el siguiente nivel" />
      {progression && (
        <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground tabular">
          {progression.level.current} / {progression.level.needed} XP
        </p>
      )}
    </Link>
  );
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActivePath(pathname, item.href);
  return (
    <Link
      href={item.href}
      data-tour={item.tour}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14.5px] font-semibold transition-colors",
        active ? "bg-primary-soft text-primary-text" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      <item.icon className={cn("size-5 transition-transform group-active:scale-90", active ? "text-primary-text" : "group-hover:text-foreground")} />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const dialogs = useDialogs();
  const main = NAV_ITEMS.filter((i) => i.group === "main");
  const more = NAV_ITEMS.filter((i) => i.group === "more");
  const settings = NAV_ITEMS.filter((i) => i.group === "settings");
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/70 backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/dashboard" aria-label="Ir a Hoy">
          <Logo />
        </Link>
        <ThemeToggleButton />
      </div>
      <SidebarPlayer />
      <div className="mt-3 px-3">
        <Button variant="gradient" size="lg" className="w-full" onClick={dialogs.openQuickAdd}>
          <Plus /> Registrar o empezar
        </Button>
      </div>
      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-2" aria-label="Principal">
        {main.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
        <p className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Más</p>
        {more.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
        <div className="pt-2">
          {settings.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>
      <SidebarTimer />
      <div className="border-t border-border p-3">
        <UserMenu />
      </div>
    </aside>
  );
}

export function MobileHeader() {
  const streaks = useStreaks();
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" aria-label="Ir a Hoy">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/progress"
            className={cn(
              "mr-1 inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-bold transition active:scale-95",
              streaks.current > 0 ? "bg-streak-soft text-streak-text" : "bg-muted text-muted-foreground",
            )}
            aria-label={`Racha de ${streaks.current} días. Ver progreso`}
          >
            🔥 <span className="tabular">{streaks.current}</span>
          </Link>
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
      "group flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors",
      active ? "text-primary-text" : "text-muted-foreground active:text-foreground",
    );
  const iconWrap = (active: boolean) =>
    cn("flex h-8 w-14 items-center justify-center rounded-full transition-all group-active:scale-90", active && "bg-primary-soft");

  const renderTab = (item: NavItem) => {
    const active = isActivePath(pathname, item.href);
    return (
      <Link key={item.href} href={item.href} data-tour={item.tour} aria-current={active ? "page" : undefined} className={tab(active)}>
        <span className={iconWrap(active)}>
          <item.icon className="size-[22px]" />
        </span>
        {item.label}
      </Link>
    );
  };

  return (
    <>
      <nav
        aria-label="Navegación móvil"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto flex h-[68px] max-w-md items-stretch px-1">
          {primary.slice(0, 2).map(renderTab)}
          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={dialogs.openQuickAdd}
              aria-label="Registrar o empezar"
              className="-mt-7 inline-flex size-[60px] items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-background transition active:scale-90"
            >
              <Plus className="size-7" strokeWidth={2.6} />
            </button>
          </div>
          {primary.slice(2).map(renderTab)}
          <button type="button" onClick={() => setMoreOpen(true)} className={tab(moreActive)} aria-label="Más opciones">
            <span className={iconWrap(moreActive)}>
              <Menu className="size-[22px]" />
            </span>
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
                    "flex flex-col items-center gap-2 rounded-3xl border p-3.5 text-center text-[13px] font-bold transition active:scale-[0.97]",
                    active ? "border-primary/40 bg-primary-soft text-primary-text" : "border-border bg-card hover:bg-muted",
                  )}
                >
                  <span className={cn("flex size-11 items-center justify-center rounded-2xl", active ? "bg-card" : "bg-muted")}>
                    <item.icon className="size-[22px]" />
                  </span>
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
