"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/query-keys";
import { Wallet } from "@/types/wallet";

export const AuthGuard = ({ children }: any) => {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("keycloak");
      return;
    }

    if (session?.error === "RefreshAccessTokenError") {
      signIn("keycloak", { prompt: "login" });
      return;
    }

    if (status === "authenticated") {
      queryClient.prefetchQuery({
        queryKey: queryKeys.wallet.me,
        queryFn: async () => {
          const { apiFetch } = await import("../app/lib/api");
          const { response, status } = await apiFetch<any>("/wallets/me", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
            },
          });

          if (!response.success) throw new Error(response.error.message);
          return response;
        },
      });
    }
  }, [status, session]);

  if (status === "loading" || status === "unauthenticated") return null;

  return children;
};
