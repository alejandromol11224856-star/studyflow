"use client";

import { FullScreenLoader } from "@/components/ui/spinner";
import { AuthGate } from "./app-shell";

export function FocusShell({ children }: { children: React.ReactNode }) {
  return <AuthGate fallback={<FullScreenLoader />}>{children}</AuthGate>;
}
