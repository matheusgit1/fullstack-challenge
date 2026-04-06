import { IKeyCloakService } from '@/domain/keycloack/keycloack.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const mockKeycloakService: jest.Mocked<IKeyCloakService> = {
    getUserFromToken: jest.fn(),
    getToken: jest.fn(),
  };

  const authService = new AuthService(mockKeycloakService);
  const controller = new AuthController(authService);

  beforeAll(async () => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('success scenarios', () => {
    it('should login', async () => {
      const body = { username: 'username', password: 'password' };
      mockKeycloakService.getToken.mockResolvedValue({
        access_token: 'token',
        expires_in: 3600,
        refresh_token: 'refresh_token',
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        id_token: 'id_token',
        'not-before-policy': '0',
        session_state: 'session_state',
        scope: 'scope',
      });
      const response = await controller.login(body);
      expect(response).toBeDefined();
      expect(mockKeycloakService.getToken).toHaveBeenCalledWith(body);
      expect(mockKeycloakService.getUserFromToken).not.toHaveBeenCalled();
    });

    it('should validate token', async () => {
      const token = 'token';
      await authService.validateToken(token);
      expect(mockKeycloakService.getUserFromToken).toHaveBeenCalledWith(token);
      expect(mockKeycloakService.getToken).not.toHaveBeenCalled();
    });
  });

  describe('fail scenarios', () => {
    it('should validate token', async () => {
      const token = 'token';
      mockKeycloakService.getUserFromToken.mockRejectedValue(new Error('Token is invalid'));
      await expect(controller.validateToken(token)).rejects.toThrow('Token is invalid');
      expect(mockKeycloakService.getToken).not.toHaveBeenCalled();
    });

    it('should fail to login', async () => {
      const body = { username: 'username', password: 'password' };
      mockKeycloakService.getToken.mockRejectedValue(new Error('Keycloak error'));
      await expect(controller.login(body)).rejects.toThrow('Keycloak error');
      expect(mockKeycloakService.getUserFromToken).not.toHaveBeenCalled();
      expect(mockKeycloakService.getToken).toHaveBeenCalledWith(body);
    });
  });
});
