"use client";

import { LogOut, Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LevelBadge, StreakMark } from "@/components/brand/marks";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useProgression, useStreaks } from "@/hooks/use-metrics";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { MOBILE_PRIMARY, NAV_ITEMS, type NavItem, isActivePath } from "./nav-items";
import { ThemeSwitcher, ThemeToggleButton } from "./theme-toggle";
import { SidebarTimer } from "./timer-widgets";
import { UserMenu, useSignOut } from "./user-menu";

/** Nivel y constancia, discretos, al pie de la barra lateral. */
function SidebarProgress() {
  const { progression } = useProgression();
  const streaks = useStreaks();
  if (!progression) return null;
  return (
    <Link href="/progress" className="mx-3 mb-2 flex items-center gap-3 rounded-2xl px-2.5 py-2 transition hover:bg-muted/70" aria-label="Ver tu progreso">
      <LevelBadge level={progression.level.level} size={32} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold">Nivel {progression.level.level}</p>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-xp" style={{ width: `${Math.round(progression.level.ratio * 100)}%` }} />
        </div>
      </div>
      <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", streaks.current > 0 ? "text-streak-text" : "text-muted-foreground")} title="Días seguidos">
        <StreakMark className="size-3.5" /> {streaks.current}
      </span>
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
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[14.5px] font-semibold transition-colors",
        active ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {active && <span aria-hidden className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-primary" />}
      <item.icon className={cn("size-[19px] shrink-0", active ? "text-primary-text" : "group-hover:text-foreground")} />
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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-subtle/80 backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/dashboard" aria-label="Ir a Hoy">
          <Logo />
        </Link>
        <ThemeToggleButton />
      </div>
      <div className="px-3 pt-1">
        <Button variant="ink" size="lg" className="w-full" onClick={dialogs.openQuickAdd}>
          <Plus /> Registrar o empezar
        </Button>
      </div>
      <nav className="mt-5 flex-1 space-y-0.5 overflow-y-auto px-3 pb-2" aria-label="Principal">
        {main.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
        <p className="eyebrow px-3 pb-1.5 pt-5">Más</p>
        {more.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
        <div className="pt-3">
          {settings.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>
      <SidebarTimer />
      <SidebarProgress />
      <div className="border-t border-border p-3">
        <UserMenu />
      </div>
    </aside>
  );
}

export function MobileHeader() {
  const streaks = useStreaks();
  // En Hoy la racha ya está junto al saludo (con su nivel): no repetirla acá.
  const onToday = usePathname() === "/dashboard";
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" aria-label="Ir a Hoy">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          {!onToday && (
            <Link
              href="/progress"
              className={cn(
                "mr-1 inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition active:scale-95",
                streaks.current > 0 ? "bg-streak-soft text-streak-text" : "bg-muted text-muted-foreground",
              )}
              aria-label={`${streaks.current} días seguidos. Ver progreso`}
            >
              <StreakMark className="size-4" /> <span className="tabular">{streaks.current}</span>
            </Link>
          )}
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
      "group flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors",
      active ? "text-foreground" : "text-muted-foreground active:text-foreground",
    );
  const iconWrap = (active: boolean) =>
    cn("flex h-8 w-14 items-center justify-center rounded-full transition-all group-active:scale-90", active && "bg-primary-soft text-primary-text");

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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto flex h-[68px] max-w-md items-stretch px-1">
          {primary.slice(0, 2).map(renderTab)}
          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={dialogs.openQuickAdd}
              aria-label="Registrar o empezar"
              className="-mt-6 inline-flex size-[58px] items-center justify-center rounded-full bg-ink text-background shadow-[0_10px_24px_-10px_rgb(0_0_0/0.5)] ring-4 ring-background transition active:scale-90"
            >
              <Plus className="size-7" strokeWidth={2.4} />
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
        <DialogContent title="Más" size="sm">
          <div className="grid grid-cols-3 gap-2">
            {secondary.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-3 text-center text-[13px] font-semibold transition active:scale-[0.97]",
                    active ? "border-primary/40 bg-primary-soft text-primary-text" : "border-border bg-card hover:bg-muted",
                  )}
                >
                  <span className={cn("flex size-10 items-center justify-center rounded-xl", active ? "bg-card" : "bg-muted")}>
                    <item.icon className="size-5" />
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
