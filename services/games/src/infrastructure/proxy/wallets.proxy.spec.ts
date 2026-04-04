import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { WalletProxy } from './wallets.proxy';

describe('WalletProxy', () => {
  let service: WalletProxy;

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeAll(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WalletProxy,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get(WalletProxy);

    jest.clearAllMocks();
  });

  describe('success scenarios', () => {
    it('should return user balance', async () => {
      const mockResponse = {
        data: {
          balance: 100,
          currency: 'BRL',
        },
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getUserBalance('token-123');

      expect(mockHttpService.get).toHaveBeenCalledWith(expect.stringContaining('/wallets/me'), {
        headers: {
          Authorization: 'Bearer token-123',
        },
      });

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('failure scenarios', () => {
    it('should throw error when request fails', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('HTTP Error')));

      await expect(service.getUserBalance('token-123')).rejects.toThrow('Failed to fetch user balance');
    });
  });
});
