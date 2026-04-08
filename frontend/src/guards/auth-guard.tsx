"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
  }, [status]);

  if (status === "loading" || status === "unauthenticated") return null;

  return children;
};
