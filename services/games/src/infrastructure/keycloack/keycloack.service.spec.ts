// keycloack.module.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { KeycloakModule } from './keycloack.module';
import { KEYCLOACK_PROVIDER, IKeyCloakService } from '@/domain/keycloack/keycloack.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { appConfig } from '@/configs/app.config';

describe('KeycloakService', () => {
  let app: INestApplication;
  let keycloakService: IKeyCloakService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [KeycloakModule],
    })
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    keycloakService = app.get<IKeyCloakService>(KEYCLOACK_PROVIDER);
    httpService = app.get(HttpService);
    configService = app.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('KeycloakService behavior', () => {
    beforeEach(() => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          KEYCLOAK_URL: appConfig.KEY_CLOAK_URL,
          KEYCLOAK_REALM: appConfig.KEYCLOAK_REALM,
          KEYCLOAK_CLIENT_ID: appConfig.KEYCLOAK_CLIENT_ID,
          KEYCLOAK_CLIENT_SECRET: undefined,
        } as any;
        return config[key];
      });
    });

    it('should successfully get token from Keycloak', async () => {
      const mockAxiosResponse: AxiosResponse = {
        data: {
          access_token: 'mock-token-123',
          expires_in: 300,
          refresh_expires_in: 1800,
          refresh_token: 'mock-refresh-token',
          token_type: 'Bearer',
          id_token: 'mock-id-token',
          'not-before-policy': '0',
          session_state: 'abc123',
          scope: 'openid profile email',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as any },
      };

      mockHttpService.post.mockReturnValue(of(mockAxiosResponse));

      const body = {
        username: 'test@example.com',
        password: 'password123',
      };

      const result = await keycloakService.getToken(body);

      expect(result).toEqual(mockAxiosResponse.data);
      expect(mockHttpService.post).toHaveBeenCalledTimes(1);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        appConfig.KEY_CLOAK_URL + '/realms/' + appConfig.KEYCLOAK_REALM + '/protocol/openid-connect/token',
        {
          client_id: appConfig.KEYCLOAK_CLIENT_ID,
          grant_type: 'password',
          password: body.password,
          scope: 'openid profile email',
          username: body.username,
        },
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
    });

    it('should handle token request failure', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('Network error')));

      await expect(
        keycloakService.getToken({
          username: 'test@example.com',
          password: 'wrong',
        }),
      ).rejects.toThrow('Erro ao obter token');
    });

    it('should get user from valid token', async () => {
      const mockUser = {
        sub: '12345',
        email: 'user@example.com',
        preferred_username: 'user123',
      };

      // Mock the token introspection or user info endpoint
      const mockAxiosResponse: AxiosResponse = {
        data: mockUser,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as any },
      };

      mockHttpService.get.mockReturnValue(of(mockAxiosResponse));

      const result = await keycloakService.getUserFromToken('valid-token');

      expect(result).toEqual(mockUser);
    });
  });
});
