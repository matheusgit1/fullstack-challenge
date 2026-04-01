import { HttpService } from "@nestjs/axios";
import { appConfig } from "../../../configs/app.config";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { User } from "@/types/user";

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

@Injectable()
export class KeycloakService {
  constructor(private httpService: HttpService) {}

  public async getUserFromToken(token?: string): Promise<User> {
    try {
      const keycloakUrl = appConfig.keycloakUrl;
      const realm = appConfig.realm;

      const getKeyCloackUserInfoUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/userinfo`;
      const response = await lastValueFrom(
        this.httpService.get(getKeyCloackUserInfoUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      return response.data satisfies User;
    } catch (error) {
      console.error("Erro ao validar token", error);
      throw new UnauthorizedException("Erro ao validar token");
    }
  }

  async getToken(body: {
    username: string;
    password: string;
  }): Promise<KeycloakTokenResponse> {
    try {
      const keycloakUrl = appConfig.keycloakUrl;
      const realm = appConfig.realm;
      const audience = appConfig.audience;

      const getTokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;
      const response = await lastValueFrom(
        this.httpService.post(
          getTokenUrl,
          {
            grant_type: "password",
            client_id: audience,
            username: body.username,
            password: body.password,
            scope: "openid profile email",
          },
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        ),
      );
      console.log("Resposta do Keycloak:", response.data);
      return response.data satisfies KeycloakTokenResponse;
    } catch (error) {
      console.error("Erro ao obter token", error);
      throw new UnauthorizedException("Erro ao obter token");
    }
  }
}
