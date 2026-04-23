export const appConfig = {
  PORT: 4001,
  KEY_CLOAK_URL: process.env.KEYCLOAK_URL || 'http://localhost:8080',
  KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || 'crash-game',
  KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID || 'crash-game-client',
  API_WALLETS_URL: process.env.API_WALLETS_URL || 'http://localhost:4002',
  HOUSE_EDGE_PERCENT: isNaN(Number(process.env.HOUSE_EDGE_PERCENT)) ? 1 : Number(process.env.HOUSE_EDGE_PERCENT),
  // BETTING_DURATION_IN_SECONDS: 15 * 1000,
  // BETTING_RUNNING_CHECK_INTERVAL_SECONDS: 15 * 1000,
};
