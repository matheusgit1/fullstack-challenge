export const appConfig = {
  port: 4001,
  keycloakUrl: process.env.KEYCLOAK_URL || "http://localhost:8080",
  realm: process.env.KEYCLOAK_REALM || "crash-game",
  audience: process.env.KEYCLOAK_CLIENT_ID || "crash-game-client",
  apiWalletsUrl: process.env.API_WALLETS_URL || "http://localhost:4002",
  houseEdgePercent: isNaN(Number(process.env.HOUSE_EDGE_PERCENT))
    ? 1
    : Number(process.env.HOUSE_EDGE_PERCENT),
  bettingDurationSeconds: 15,
  bettingRunningCheckIntervalSeconds: 15,
};
