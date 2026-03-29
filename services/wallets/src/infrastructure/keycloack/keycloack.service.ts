import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import type { Request } from "express";

export interface UserInfo {
  sub: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
}

@Injectable()
export class KeycloakService {
  constructor(
    private readonly configService: ConfigService,
    private httpService: HttpService,
  ) {}

  /***
   * @param {string} token valida um usuariio a partir de um token, caso token seja expirado ou invalidao
   * automaticamente retorna 401 (unauthorized)
   */
  public async getUserFromToken(token?: string): Promise<UserInfo> {
    try {
      const keycloakUrl = this.configService.get<string>(
        "KEYCLOAK_URL",
        "http://localhost:8080",
      );
      const realm = this.configService.get<string>(
        "KEYCLOAK_REALM",
        "crash-game",
      );
      const audience = this.configService.get<string>(
        "KEYCLOAK_CLIENT_ID",
        "crash-game-client",
      );

      const getKeyCloackUserInfoUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/userinfo`;
      console.log("URL do Keycloak:", getKeyCloackUserInfoUrl);
      console.log("Token enviado para validação:", token);
      const response = await lastValueFrom(
        this.httpService.get(getKeyCloackUserInfoUrl, {
          headers: {
            // "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      console.log("Resposta do Keycloak:", response.data);

      return response.data satisfies UserInfo;
    } catch (error) {
      console.error(
        "Erro ao validar token:",
        error,
        error.response.data,
        error.message,
      );
      throw new UnauthorizedException("Erro ao validar token");
    }
  }
}
