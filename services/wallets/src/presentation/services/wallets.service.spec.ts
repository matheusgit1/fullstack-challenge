import { IWalletRepository } from '@/domain/orm/repositories/wallet.repository';
import { WalletsService } from './wallets.service';
import { genWalletEntity } from '@/util/tests/entities/gen-wallet-entity';

describe('WalletsService', () => {
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.clearAllMocks();
  });

  describe('sucess scenarios', () => {
    it('should create a wallet', async () => {
      const wallet = genWalletEntity();
      mockWalletRepository.createWallet.mockResolvedValueOnce(wallet);
      const response = await walletService.createWallet();
      expect(response).toBeDefined();
      expect(mockWalletRepository.createWallet).toHaveBeenCalledWith(userId);
      expect(mockWalletRepository.createWallet).toHaveBeenCalledTimes(1);
    });

    it('should get a wallet', async () => {
      const wallet = genWalletEntity();
      mockWalletRepository.findOrCreate.mockResolvedValueOnce(wallet);
      const response = await walletService.getWallet();
      expect(response).toBeDefined();
      expect(mockWalletRepository.findOrCreate).toHaveBeenCalledWith(userId);
      expect(mockWalletRepository.findOrCreate).toHaveBeenCalledTimes(1);
    });
  });
});
