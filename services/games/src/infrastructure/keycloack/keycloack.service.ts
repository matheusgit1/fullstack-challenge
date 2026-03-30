import { HttpService } from "@nestjs/axios";
import { appConfig } from "../../../configs/app.config";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { User } from "@/types/user";

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
      throw new UnauthorizedException("Erro ao validar token");
    }
  }
}
