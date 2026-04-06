import { IWalletRepository } from "@/domain/orm/repositories/wallet.repository";
import { WalletsService } from "./wallets.service";

describe("WalletsService", () => {
  const mockWalletRepository: jest.Mocked<IWalletRepository> = {
    createWallet: jest.fn(),
    findOrCreate: jest.fn(),
    findByUserId: jest.fn(),
    findById: jest.fn(),
    getTransactionByExternalId: jest.fn(),
  };
  const mockRequest = {
    user: {
      sub: "userId",
    },
  } as any;
  const walletService = new WalletsService(mockRequest, mockWalletRepository);
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.clearAllMocks();
  });

  describe("sucess scenarios", () => {
    it("should create a wallet", async () => {
      const userId = "userId";
      mockWalletRepository.createWallet.mockResolvedValueOnce({
        id: "walletId",
        userId,
        balanceInCents: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        getBalance: () => 0,
        setBalance: () => {},
        canDebit: () => true,
        debit: () => {},
        credit: () => {},
      });
      const wallet = await walletService.createWallet();
      expect(wallet).toBeDefined();
      expect(mockWalletRepository.createWallet).toHaveBeenCalledWith(userId);
      expect(mockWalletRepository.createWallet).toHaveBeenCalledTimes(1);
    });

    it("should get a wallet", async () => {
      const userId = "userId";
      mockWalletRepository.findOrCreate.mockResolvedValueOnce({
        id: "walletId",
        userId,
        balanceInCents: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        getBalance: () => 0,
        setBalance: () => {},
        canDebit: () => true,
        debit: () => {},
        credit: () => {},
      });
      const wallet = await walletService.getWallet();
      expect(wallet).toBeDefined();
      expect(mockWalletRepository.findOrCreate).toHaveBeenCalledWith(userId);
      expect(mockWalletRepository.findOrCreate).toHaveBeenCalledTimes(1);
    });
  });
});
