// app/lib/auth-options.ts
import { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  providers: [
    {
      id: "keycloak",
      name: "Keycloak",
      type: "oauth",
      wellKnown: `${process.env.WELL_KNOW_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`,
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      checks: ["pkce", "state"],
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET, 
      token: {
        params: {
          grant_type: "authorization_code",
        },
      },

      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
        };
      },
    },
  ],

  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = (account.expires_at ?? 0) * 1000;
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
              ...(process.env.KEYCLOAK_CLIENT_SECRET && {
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
              }),
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          },
        );

        const refreshed = await response.json();

        if (!response.ok) {
          throw new Error(
            refreshed.error_description || "Failed to refresh token",
          );
        }

        return {
          ...token,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? token.refreshToken,
          expiresAt: Date.now() + refreshed.expires_in * 1000,
        };
      } catch (error) {
        console.error("Token refresh error:", error);
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },

    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },

  session: {
    strategy: "jwt",
  },

  debug: process.env.NODE_ENV === "development",
};
