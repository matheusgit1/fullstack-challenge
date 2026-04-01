export const appConfig = {
  port: Number(process.env.PORT) || 4000,
  keycloakUrl: process.env.KEYCLOAK_URL || "http://localhost:8080",
  realm: process.env.KEYCLOAK_REALM || "crash-game",
  audience: process.env.KEYCLOAK_CLIENT_ID || "crash-game-client",
};
