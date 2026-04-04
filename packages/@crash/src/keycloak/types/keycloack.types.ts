export interface KeycloakModuleOptions {
  baseUrl: string;
  realm: string;
  clientId: string;
  clientSecret?: string;
  timeout?: number;
  maxRedirects?: number;
}

export interface KeycloakModuleAsyncOptions {
  useFactory: (
    ...args: any[]
  ) => Promise<KeycloakModuleOptions> | KeycloakModuleOptions;
  inject?: any[];
  imports?: any[];
}

export interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token: string;
  "not-before-policy": string;
  session_state: string;
  scope: string;
}

export const KEYCLOAK_MODULE_OPTIONS = "KEYCLOAK_MODULE_OPTIONS";
