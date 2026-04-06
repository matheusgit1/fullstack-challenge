import { Test, TestingModule } from '@nestjs/testing';
import { KEYCLOACK_PROVIDER, IKeyCloakService } from '@/domain/keycloack/keycloack.service';
import { AuthService } from './auth.service';
import { LoginResponseDto } from './dtos/login-response.dto';
import { AuthModule } from './auth.module';
import { KeycloakModule } from '@/infrastructure/keycloack/keycloack.module';

describe('AuthService', () => {
  let service: AuthService;
  let keycloakService: IKeyCloakService;

  const mockKeycloakService = {
    getUserFromToken: jest.fn(),
    getToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideModule(KeycloakModule)
      .useModule(class {})
      .overrideProvider(KEYCLOACK_PROVIDER)
      .useValue(mockKeycloakService)
      .compile();

    service = module.get<AuthService>(AuthService);
    keycloakService = module.get<IKeyCloakService>(KEYCLOACK_PROVIDER);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return token response on successful login', async () => {
      const mockTokenResponse = {
        access_token: 'mock-access-token',
        expires_in: 300,
        refresh_expires_in: 1800,
        refresh_token: 'mock-refresh-token',
        token_type: 'Bearer',
        id_token: 'mock-id-token',
        'not-before-policy': '0',
        session_state: 'mock-session',
        scope: 'openid profile',
      };

      mockKeycloakService.getToken.mockResolvedValue(mockTokenResponse);

      const result = await service.getToken({
        username: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(
        new LoginResponseDto({
          accessToken: mockTokenResponse.access_token,
          expiresIn: mockTokenResponse.expires_in,
          refreshExpiresIn: mockTokenResponse.refresh_expires_in,
          refreshToken: mockTokenResponse.refresh_token,
          tokenType: mockTokenResponse.token_type,
          idToken: mockTokenResponse.id_token,
          notBeforePolicy: Number(mockTokenResponse['not-before-policy']),
          sessionState: mockTokenResponse.session_state,
          scopes: mockTokenResponse.scope,
        }),
      );
      expect(keycloakService.getToken).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      mockKeycloakService.getToken.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        service.getToken({
          username: 'wrong@example.com',
          password: 'wrong',
        }),
      ).rejects.toThrow(Error);
    });
  });

  describe('validateUser', () => {
    it('should return user when token is valid', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockToken = 'valid-token';

      mockKeycloakService.getUserFromToken.mockResolvedValue(mockUser);

      const result = await service.validateToken(mockToken);

      expect(result).toEqual(mockUser);
      expect(keycloakService.getUserFromToken).toHaveBeenCalledWith(mockToken);
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      mockKeycloakService.getUserFromToken.mockRejectedValue(new Error('Invalid token'));

      await expect(service.validateToken('invalid-token')).rejects.toThrow(Error);
    });
  });
});
