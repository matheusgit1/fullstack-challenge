import { IWalletRepository } from "@/domain/orm/repositories/wallet.repository";
import { WalletsService } from "../services/wallets.service";
import { WalletsController } from "./wallets.controller";
import { Wallet } from "@/infrastructure/database/orm/entites/wallet.entity";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";

describe("WalletsController", () => {
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
  const walletController = new WalletsController(walletService);

  describe("sucess scenarios", () => {
    it("should get a wallet", async () => {
      const userId = "userId";
      mockWalletRepository.findOrCreate.mockResolvedValueOnce(
        new Wallet({
          id: "walletId",
          userId,
          balanceInCents: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        }),
      );
      const wallet = await walletController.getMyWallet();
      expect(wallet).toBeDefined();
      expect(mockWalletRepository.findOrCreate).toHaveBeenCalledWith(userId);
      expect(mockWalletRepository.findOrCreate).toHaveBeenCalledTimes(1);
    });

    it("should create a wallet", async () => {
      const userId = "userId";
      mockWalletRepository.createWallet.mockResolvedValueOnce(
        new Wallet({
          id: "walletId",
          userId,
          balanceInCents: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        }),
      );
      const wallet = await walletController.createWallet();
      expect(wallet).toBeDefined();
      expect(mockWalletRepository.createWallet).toHaveBeenCalledWith(userId);
      expect(mockWalletRepository.createWallet).toHaveBeenCalledTimes(1);
    });

    it("should get helth", async () => {
      const helth = await walletController.check();
      expect(helth).toBeInstanceOf(HealthCheckResponseDto);
      expect(helth.service).toBe("wallets");
      expect(helth).toBeDefined();
    });
  });
});
