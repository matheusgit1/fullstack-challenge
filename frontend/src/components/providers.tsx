"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
import { GameProvider } from "@/context/game-context";
import { ErrorBoundary } from "./error-boundary";
// import { ErrorBoundary } from "@/components/error-boundary";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <GameProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </GameProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
