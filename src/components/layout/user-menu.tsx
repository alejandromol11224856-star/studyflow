"use client";

import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/misc";
import { useProfile } from "@/hooks/use-data";
import { getErrorMessage } from "@/lib/errors";
import { getPlan } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/80 to-primary text-xs font-semibold text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function useSignOut() {
  const { signOut } = useAuth();
  const router = useRouter();
  return async () => {
    try {
      await signOut();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };
}

export function UserMenu({ compact }: { compact?: boolean }) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const signOut = useSignOut();
  const name = profile?.displayName || user?.email.split("@")[0] || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2.5 rounded-xl text-left outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
          compact ? "p-1" : "w-full p-2",
        )}
        aria-label="Menú de usuario"
      >
        <Avatar name={name} />
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} side={compact ? "bottom" : "top"} className="w-60">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span className="truncate">{user?.email}</span>
          <Badge tone="primary">{getPlan(profile?.plan).name}</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> Ajustes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => void signOut()}>
          <LogOut /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
