"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { useState } from "react";
import { Toaster, toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { AuthProvider } from "./auth-provider";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          const message = getErrorMessage(error, "");
          if (/sesión expiró|no se encontró/i.test(message)) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: true,
      },
    },
    mutationCache: new MutationCache({
      // Todo error de una acción se avisa (aunque la mutación haga rollback
      // optimista), salvo las que muestran su propio aviso (meta.silent).
      onError: (error, _vars, _ctx, mutation) => {
        if (mutation.options.meta?.silent) return;
        toast.error(getErrorMessage(error));
      },
    }),
  });
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-center"
      richColors
      closeButton
      toastOptions={{ className: "font-sans" }}
      offset={16}
      mobileOffset={{ top: 12 }}
    />
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
        <ThemedToaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
