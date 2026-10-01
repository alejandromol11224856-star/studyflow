"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DATA_MODE } from "@/lib/config";
import { type Repository, type SignUpInput, getAuthService } from "@/lib/data";
import type { AuthUser } from "@/lib/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  mode: typeof DATA_MODE;
  repo: Repository | null;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (input: SignUpInput) => Promise<{ sessionCreated: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function sameUser(a: AuthUser | null, b: AuthUser | null) {
  return a?.id === b?.id && a?.email === b?.email;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const service = useMemo(() => getAuthService(), []);
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const applyUser = useCallback((next: AuthUser | null) => {
    setUser((prev) => (sameUser(prev, next) ? prev : next));
    setStatus(next ? "authenticated" : "unauthenticated");
  }, []);

  useEffect(() => {
    let active = true;
    service
      .getUser()
      .then((u) => active && applyUser(u))
      .catch(() => active && applyUser(null));
    const unsubscribe = service.onChange((u) => active && applyUser(u));
    return () => {
      active = false;
      unsubscribe();
    };
  }, [service, applyUser]);

  const repo = useMemo(() => (user ? service.createRepository(user) : null), [service, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      mode: DATA_MODE,
      repo,
      async signIn(email, password) {
        const u = await service.signIn(email, password);
        applyUser(u);
        return u;
      },
      async signUp(input) {
        const result = await service.signUp(input);
        if (result.sessionCreated) applyUser(await service.getUser());
        return result;
      },
      async signOut() {
        await service.signOut();
        queryClient.clear();
        applyUser(null);
      },
      sendPasswordReset: (email) => service.sendPasswordReset(email),
      updatePassword: (password) => service.updatePassword(password),
    }),
    [user, status, repo, service, applyUser, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
