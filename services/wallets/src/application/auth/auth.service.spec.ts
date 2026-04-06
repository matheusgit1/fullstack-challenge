import { AuthService } from './auth.service';
import { IKeyCloakService } from '@/domain/keycloack/keycloack.service';

const mockKeycloakService: jest.Mocked<IKeyCloakService> = {
  getUserFromToken: jest.fn(),
  getToken: jest.fn(),
};

const authService = new AuthService(mockKeycloakService);

describe(`${AuthService.name} scenarios`, () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('happy scenario', () => {
    it('should validate token', async () => {
      const token = 'token';
      await authService.validateToken(token);

      expect(mockKeycloakService.getUserFromToken).toHaveBeenCalledWith(token);
    });

    it('should return token', async () => {
      const token = 'token';
      mockKeycloakService.getToken.mockResolvedValue({
        access_token: token,
        expires_in: 3600,
        refresh_token: 'refresh_token',
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        id_token: 'id_token',
        'not-before-policy': '0',
        session_state: 'session_state',
        scope: 'scope',
      });
      const response = await authService.getToken({ username: 'username', password: 'password' });

      expect(response).toBeDefined();
      expect(mockKeycloakService.getToken).toHaveBeenCalledWith({ username: 'username', password: 'password' });
      expect(mockKeycloakService.getToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('sad scenario', () => {
    it('should return error if token is invalid', async () => {
      const token = 'invalid_token';
      const errorMessage = 'Invalid token';

      mockKeycloakService.getUserFromToken.mockRejectedValue(new Error(errorMessage));

      await expect(authService.validateToken(token)).rejects.toThrow(errorMessage);
    });

    it('should return error if token is not provided', async () => {
      const errorMessage = 'Token not provided';

      await expect(authService.validateToken(undefined)).rejects.toThrow('Token não fornecido');
      await expect(authService.validateToken('')).rejects.not.toThrow(errorMessage);
      await expect(mockKeycloakService.getUserFromToken).toHaveBeenCalledTimes(0);
    });
  });
});
