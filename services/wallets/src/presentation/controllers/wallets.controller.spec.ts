import { mock } from 'node:test';
import { IWalletRepository } from '@/domain/orm/repositories/wallet.repository';
import { WalletsService } from '../services/wallets.service';
import { WalletsController } from './wallets.controller';
import { Wallet } from '@/infrastructure/database/orm/entites/wallet.entity';
import { HealthCheckResponseDto } from '../dtos/health-check-response.dto';
import { genWalletEntity } from '@/util/tests/entities/gen-wallet-entity';

describe('WalletsController', () => {
  const mockWalletRepository: jest.Mocked<IWalletRepository> = {
    createWallet: jest.fn(),
    findOrCreate: jest.fn(),
    findByUserId: jest.fn(),
    findById: jest.fn(),
    getTransactionByExternalId: jest.fn(),
  };

  const mockRequest = {
    user: {
      sub: 'userId',
    },
  } as any;
  const userId = mockRequest.user.sub;
  const walletService = new WalletsService(mockRequest, mockWalletRepository);
  const walletController = new WalletsController(walletService);

  describe('sucess scenarios', () => {
    it('should get a wallet', async () => {
      const wallet = genWalletEntity();
      mockWalletRepository.findOrCreate.mockResolvedValueOnce(wallet);
      const response = await walletController.getMyWallet();
      expect(response).toBeDefined();
      expect(mockWalletRepository.findOrCreate).toHaveBeenCalledWith(userId);
      expect(mockWalletRepository.findOrCreate).toHaveBeenCalledTimes(1);
    });

    it('should create a wallet', async () => {
      const wallet = genWalletEntity();
      mockWalletRepository.createWallet.mockResolvedValueOnce(wallet);
      const respnnse = await walletController.createWallet();
      expect(respnnse).toBeDefined();
      expect(mockWalletRepository.createWallet).toHaveBeenCalledWith(userId);
      expect(mockWalletRepository.createWallet).toHaveBeenCalledTimes(1);
    });

    it('should get helth', async () => {
      const helth = await walletController.check();
      expect(helth).toBeInstanceOf(HealthCheckResponseDto);
      expect(helth.service).toBe('wallets');
      expect(helth).toBeDefined();
    });
  });
});
