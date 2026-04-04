export interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token: string;
  'not-before-policy': string;
  session_state: string;
  scope: string;
}
export interface IKeyCloakService {
  getUserFromToken(token?: string): Promise<User>;
  getToken(body: { username: string; password: string }): Promise<KeycloakTokenResponse>;
}

export const KEYCLOACK_PROVIDER = Symbol('IKeyCloakService');
