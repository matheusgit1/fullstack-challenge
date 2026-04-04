import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { AuthGuardType, AUTH_GUARD_TYPE } from './auth.decorator';
import { Request } from 'express';
import { IKeyCloakService } from '@/domain/keycloack/keycloack.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const mockKeycloakService: jest.Mocked<IKeyCloakService> = {
    getUserFromToken: jest.fn(),
    getToken: jest.fn(),
  };

  const mockUser: User = {
    sub: 'string',
    email_verified: true,
    name: 'string',
    preferred_username: 'string',
    given_name: 'string',
    family_name: 'string',
    email: 'string',
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as jest.Mocked<Reflector>;

  const mockContext = (headers: any = {}, authGuardType: AuthGuardType = AuthGuardType.GUARD) => {
    const request = {
      headers,
    } as Request;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    guard = new AuthGuard(mockReflector, mockKeycloakService);
  });

  beforeAll(async () => {
    jest.clearAllMocks();
    
  });

  describe('GUARD type', () => {
    it('should return true and set user/token when valid token is provided', async () => {
      const token = 'valid-token-123';
      const authHeader = `Bearer ${token}`;

      const context = mockContext({ authorization: authHeader }, AuthGuardType.GUARD);

      mockReflector.getAllAndOverride.mockReturnValue(AuthGuardType.GUARD);
      mockKeycloakService.getUserFromToken.mockResolvedValue(mockUser);

      const result = await guard.canActivate(context);
      const request = context.switchToHttp().getRequest();

      expect(result).toBe(true);
      expect(request.user).toEqual(mockUser);
      expect(request.token).toBe(token);
      expect(mockKeycloakService.getUserFromToken).toHaveBeenCalledWith(token);
    });

    it('should return false when token is missing', async () => {
      const mockUser: User = {
        sub: 'string',
        email_verified: true,
        name: 'string',
        preferred_username: 'string',
        given_name: 'string',
        family_name: 'string',
        email: 'string',
      };
      const context = mockContext({}, AuthGuardType.GUARD);
      mockReflector.getAllAndOverride.mockReturnValue(AuthGuardType.GUARD);
      mockKeycloakService.getUserFromToken.mockResolvedValue(mockUser);


      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(mockKeycloakService.getUserFromToken).toHaveBeenCalledWith(undefined);
    });

    it('should throw error when Keycloak service fails', async () => {
      const token = 'valid-token';
      const authHeader = `Bearer ${token}`;
      const context = mockContext({ authorization: authHeader }, AuthGuardType.GUARD);

      mockReflector.getAllAndOverride.mockReturnValue(AuthGuardType.GUARD);
      mockKeycloakService.getUserFromToken.mockRejectedValue(new Error('Keycloak error'));

      await expect(guard.canActivate(context)).rejects.toThrow('Keycloak error');
    });

    it('should extract token correctly from authorization header', async () => {
      const token = 'extract-test-token';
      const authHeader = `Bearer ${token}`;
      const context = mockContext({ authorization: authHeader }, AuthGuardType.GUARD);

      mockReflector.getAllAndOverride.mockReturnValue(AuthGuardType.GUARD);
      mockKeycloakService.getUserFromToken.mockResolvedValue(mockUser);

      await guard.canActivate(context);

      expect(mockKeycloakService.getUserFromToken).toHaveBeenCalledWith(token);
    });
  });

  describe('NONE type', () => {
    it('should return true without validating token', async () => {
      const context = mockContext({}, AuthGuardType.NONE);
      mockReflector.getAllAndOverride.mockReturnValue(AuthGuardType.NONE);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockKeycloakService.getUserFromToken).not.toHaveBeenCalled();
    });

    it('should return true even with invalid token', async () => {
      const context = mockContext({ authorization: 'Bearer invalid' }, AuthGuardType.NONE);
      mockReflector.getAllAndOverride.mockReturnValue(AuthGuardType.NONE);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockKeycloakService.getUserFromToken).not.toHaveBeenCalled();
    });
  });

  describe('Default behavior', () => {
    it('should return false when authGuardType is not defined', async () => {
      const context = mockContext({});
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(mockKeycloakService.getUserFromToken).not.toHaveBeenCalled();
    });

    it('should return false for unknown authGuardType', async () => {
      const context = mockContext({});
      mockReflector.getAllAndOverride.mockReturnValue('UNKNOWN_TYPE' as unknown as AuthGuardType);

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });
  });

  describe('Reflector integration', () => {
    it('should get authGuardType from handler and class', async () => {
      const context = mockContext({ authorization: 'Bearer token' });
      const mockHandler = jest.fn();
      const mockClass = class TestController {};

      mockReflector.getAllAndOverride.mockReturnValue(AuthGuardType.GUARD);
      jest.spyOn(context, 'getHandler').mockReturnValue(mockHandler);
      jest.spyOn(context, 'getClass').mockReturnValue(mockClass);

      mockKeycloakService.getUserFromToken.mockResolvedValue(mockUser);

      await guard.canActivate(context);

      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(AUTH_GUARD_TYPE, [mockHandler, mockClass]);
    });
  });
});
