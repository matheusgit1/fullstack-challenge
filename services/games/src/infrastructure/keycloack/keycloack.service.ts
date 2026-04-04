import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { appConfig } from '../../configs/app.config';
import type { IKeyCloakService, KeycloakTokenResponse } from '@/domain/keycloack/keycloack.service';

@Injectable()
export class KeycloakService implements IKeyCloakService {
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
      console.error('Erro ao validar token', error);
      throw new UnauthorizedException('Erro ao validar token');
    }
  }

  async getToken(body: { username: string; password: string }): Promise<KeycloakTokenResponse> {
    try {
      const keycloakUrl = appConfig.keycloakUrl;
      const realm = appConfig.realm;
      const audience = appConfig.audience;

      const getTokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;
      const response = await lastValueFrom(
        this.httpService.post(
          getTokenUrl,
          {
            grant_type: 'password',
            client_id: audience,
            username: body.username,
            password: body.password,
            scope: 'openid profile email',
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );
      return response.data satisfies KeycloakTokenResponse;
    } catch (error) {
      console.error('Erro ao obter token', error);
      throw new UnauthorizedException('Erro ao obter token');
    }
  }
}
