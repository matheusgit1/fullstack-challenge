import { signOut, useSession } from "next-auth/react";
import { useCallback } from "react";

export const useLogout = () => {
  const { data: session } = useSession();

  return useCallback(async () => {
    console.log("useLogout render:");
    const idToken = (session as any)?.idToken;

    const baseUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL!;
    const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM!;

    await signOut({ redirect: false });

    if (idToken) {
      const logoutUrl = new URL(
        `${baseUrl}/realms/${realm}/protocol/openid-connect/logout`,
      );
      logoutUrl.searchParams.set("id_token_hint", idToken);
      logoutUrl.searchParams.set(
        "post_logout_redirect_uri",
        window.location.origin,
      );
      window.location.href = logoutUrl.toString();
    } else {
      window.location.href = window.location.origin;
    }
  }, [session]);
};
