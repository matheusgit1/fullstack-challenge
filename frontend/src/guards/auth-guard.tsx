"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";

export const AuthGuard = ({ children }: any) => {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("keycloak");
      return;
    }

    if (session?.error === "RefreshAccessTokenError") {
      signIn("keycloak", { prompt: "login" });
    }
  }, [session, status]);

  if (status === "loading" || status === "unauthenticated") return null;

  return children;
};
