import { HttpService } from "@nestjs/axios";
import { appConfig } from "../../../configs/app.config";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

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
  constructor(private httpService: HttpService) {}

  public async getUserFromToken(token?: string): Promise<UserInfo> {
    try {
      const keycloakUrl = appConfig.keycloakUrl;
      const realm = appConfig.realm;
      const audience = appConfig.audience;

      const getKeyCloackUserInfoUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/userinfo`;
      const response = await lastValueFrom(
        this.httpService.get(getKeyCloackUserInfoUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      return response.data satisfies UserInfo;
    } catch (error) {
      throw new UnauthorizedException("Erro ao validar token");
    }
  }
}
