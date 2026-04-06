import { TransactionRepository } from "../database/orm/repository/transaction.repository";
import { ITransactionRepository } from "@/domain/orm/repositories/transaction.repository";
import { RabbitmqService } from "./rabbitmq.service";
import { TransactionSource } from "@/domain/rabbitmq/rabbitmq.service";
import { TransactionType } from "../database/orm/entites/transaction.entity";

describe("RabbitmqService", () => {
  const mockTransactionRepository = {
    findByExternalIdAndSource: jest.fn(),
    processTransaction: jest.fn(),
  } as jest.Mocked<ITransactionRepository>;
  const rabbitmqService = new RabbitmqService(mockTransactionRepository);

  beforeAll(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sucess scenarios", () => {
    it("should process transaction", async () => {
      mockTransactionRepository.findByExternalIdAndSource.mockResolvedValueOnce(
        null,
      );
      await rabbitmqService.processReserve(
        { externalId: "externalId" } as any,
        "tracingId",
      );
      expect(
        mockTransactionRepository.findByExternalIdAndSource,
      ).toHaveBeenCalledWith("externalId", TransactionSource.BET_RESERVE);
      expect(
        mockTransactionRepository.processTransaction,
      ).toHaveBeenCalledTimes(1);
    });

    it("should stop process transaction if troansactio already exist", async () => {
      mockTransactionRepository.findByExternalIdAndSource.mockResolvedValueOnce(
        {
          id: "transactionId",
        } as any,
      );

      await rabbitmqService.processReserve(
        { externalId: "externalId" } as any,
        "tracingId",
      );
      expect(
        mockTransactionRepository.findByExternalIdAndSource,
      ).toHaveBeenCalledWith("externalId", TransactionSource.BET_RESERVE);

      expect(
        mockTransactionRepository.processTransaction,
      ).toHaveBeenCalledTimes(0);
    });

    it("should stop process cashin if transactio does not exist", async () => {
      mockTransactionRepository.findByExternalIdAndSource.mockResolvedValueOnce(
        null,
      );

      await rabbitmqService.processCashin(
        { externalId: "externalId" } as any,
        "tracingId",
      );
      expect(
        mockTransactionRepository.findByExternalIdAndSource,
      ).toHaveBeenCalledWith("externalId", TransactionSource.BET_RESERVE);

      expect(
        mockTransactionRepository.processTransaction,
      ).toHaveBeenCalledTimes(0);
    });

    it("should stop process cashin if transactio  exist", async () => {
      mockTransactionRepository.findByExternalIdAndSource.mockResolvedValueOnce(
        {
          id: "transactionId",
        } as any,
      );

      await rabbitmqService.processCashin(
        { externalId: "externalId" } as any,
        "tracingId",
      );
      expect(
        mockTransactionRepository.findByExternalIdAndSource,
      ).toHaveBeenCalledWith("externalId", TransactionSource.BET_RESERVE);

      expect(
        mockTransactionRepository.processTransaction,
      ).toHaveBeenCalledTimes(1);
    });

    it("should stop process cashout if transaction does not exist", async () => {
      mockTransactionRepository.findByExternalIdAndSource.mockResolvedValueOnce(
        null,
      );

      await rabbitmqService.processCashout(
        { externalId: "externalId" } as any,
        "tracingId",
      );
      expect(
        mockTransactionRepository.findByExternalIdAndSource,
      ).toHaveBeenCalledWith("externalId", TransactionSource.BET_RESERVE);

      expect(
        mockTransactionRepository.processTransaction,
      ).toHaveBeenCalledTimes(0);
    });

    it("should stop process cashout if transaction  exist", async () => {
      mockTransactionRepository.findByExternalIdAndSource.mockResolvedValueOnce(
        {
          id: "transactionId",
        } as any,
      );

      await rabbitmqService.processCashout(
        { externalId: "externalId" } as any,
        "tracingId",
      );
      expect(
        mockTransactionRepository.findByExternalIdAndSource,
      ).toHaveBeenCalledWith("externalId", TransactionSource.BET_RESERVE);

      expect(
        mockTransactionRepository.processTransaction,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
