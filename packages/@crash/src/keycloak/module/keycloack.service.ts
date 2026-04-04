import { HttpService } from "@nestjs/axios";
import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { type User } from "../../types";
import {
  KEYCLOAK_MODULE_OPTIONS,
  type KeycloakModuleOptions,
  type KeycloakTokenResponse,
} from "../types/keycloack.types";

@Injectable()
export class KeycloakService {
  constructor(
    @Inject(KEYCLOAK_MODULE_OPTIONS)
    private readonly options: KeycloakModuleOptions,
    private readonly httpService: HttpService,
  ) {}

  public async getUserFromToken(token?: string): Promise<User> {
    try {
      const { baseUrl, realm } = this.options;

      const getKeyCloackUserInfoUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/userinfo`;
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
      const { baseUrl: keycloakUrl, realm, clientId: audience } = this.options;
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
      return response.data satisfies KeycloakTokenResponse;
    } catch (error) {
      console.error("Erro ao obter token", error);
      throw new UnauthorizedException("Erro ao obter token");
    }
  }
}
