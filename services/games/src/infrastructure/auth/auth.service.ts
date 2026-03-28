
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";

@Injectable()
export class AuthService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async validateToken(token: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(
          `http://localhost:8080/realms/crash-game/protocol/openid-connect/certs`,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      console.log("Resposta do Keycloak:", response.data);

      if (!response.data.active) {
        throw new UnauthorizedException("Token inválido ou expirado");
      }

      return response.data;
    } catch (error) {
      console.error(
        "Erro ao validar token:",
        error.response.data,
        error.message,
      );
      throw new UnauthorizedException("Erro ao validar token");
    }
  }

  async getUserInfo(token: string) {
    try {
      const keycloakUrl = this.configService.get<string>("KEYCLOAK_URL");
      const realm = this.configService.get<string>("KEYCLOAK_REALM");

      const response = await lastValueFrom(
        this.httpService.get(
          `${keycloakUrl}/realms/${realm}/protocol/openid-connect/userinfo`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      throw new UnauthorizedException("Erro ao obter informações do usuário");
    }
  }

  async login(username: string, password: string) {
    try {
      const keycloakUrl = this.configService.get<string>("KEYCLOAK_URL");
      const realm = this.configService.get<string>("KEYCLOAK_REALM");
      const clientId =
        this.configService.get<string>("KEYCLOAK_CLIENT_ID") ||
        "crash-game-client";

      const response = await lastValueFrom(
        this.httpService.post(
          `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
          new URLSearchParams({
            client_id: clientId,
            grant_type: "password",
            username,
            password,
            scope: "openid profile email",
          }).toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        ),
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
      };
    } catch (error) {
      throw new UnauthorizedException("Credenciais inválidas");
    }
  }
}
