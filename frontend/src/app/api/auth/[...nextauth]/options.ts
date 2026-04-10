import KeycloakProvider from "next-auth/providers/keycloak";
import { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: "",
      issuer: `${process.env.WELL_KNOW_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}`,
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.expiresAt = (account.expires_at ?? 0) * 1000;
        token.user = profile;
        return token;
      }

      if (Date.now() < (token.expiresAt as number)) {
        return token;
      }

      try {
        const response = await fetch(
          `${process.env.WELL_KNOW_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: process.env.KEYCLOAK_CLIENT_ID!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          },
        );

        const refreshed = await response.json();

        if (!response.ok) throw new Error();

        return {
          ...token,
          accessToken: refreshed.access_token,
          idToken: refreshed.id_token ?? token.idToken,
          refreshToken: refreshed.refresh_token ?? token.refreshToken,
          expiresAt: Date.now() + refreshed.expires_in * 1000,
        };
      } catch {
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },

    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      session.user = token.user;
      session.error = token.error;
      return session;
    },
  },

  session: {
    strategy: "jwt",
  },
};
