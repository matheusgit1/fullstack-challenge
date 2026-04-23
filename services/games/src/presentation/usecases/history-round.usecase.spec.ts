import { PaginatedResponseDto } from '../dtos/response/paginated-reponse.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { HistoryRoundUsecase } from './history-round.usecase';
import { RoundHistoryQueryDto } from '../dtos/request/round-history-query.dto';
import { RoundHistoryItemDto } from '../dtos/response/round-history-response.dto';
import { IRoundRepository } from '@/domain/orm/repositories/round.repository';
import { genRound } from '@/util-teste/entitites/gen-round';
import { Round, RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';

describe('HistoryRoundUsecase', () => {
  const mockRoundRepository: jest.Mocked<IRoundRepository> = {
    findByRoundId: jest.fn(),
    findCurrentBettingRound: jest.fn(),
    findCurrentRunningRound: jest.fn(),
    findRoundWithBets: jest.fn(),
    findRoundsHistory: jest.fn(),
    saveRound: jest.fn(),
    createRound: jest.fn(),
  };

  const mockCompletedRound = genRound({ status: RoundStatus.CRASHED });

  const mockRunningRound = genRound({ status: RoundStatus.RUNNING });

  const historyRoundUsecase = new HistoryRoundUsecase(mockRoundRepository);

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Scenarios', () => {
    it('should return paginated history of rounds with default pagination', async () => {
      const query = new RoundHistoryQueryDto({
        page: 1,
        limit: 20,
      });
      const mockRounds = [mockCompletedRound, mockCompletedRound];
      const total = 25;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);

      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(1, 20);
      expect(result).toBeInstanceOf(PaginatedResponseDto);
      expect(result.data).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(2);
    });

    it('should return paginated history with custom pagination parameters', async () => {
      const query: RoundHistoryQueryDto = {
        page: 3,
        limit: 10,
      };
      const mockRounds = [mockCompletedRound, mockCompletedRound, mockCompletedRound];
      const total = 30;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);

      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(3, 10);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(30);
      expect(result.totalPages).toBe(3);
    });

    it('should return "secret" for crashPoint when round is still running', async () => {
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const mockRounds = [mockRunningRound, mockCompletedRound];
      const total = 2;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);

      expect(result.data[0].crashPoint).toBe('secret');
      expect(result.data[1].crashPoint).toBe(mockCompletedRound.crashPoint);
    });

    it('should handle empty result set', async () => {
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const mockRounds: any[] = [];
      const total = 0;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle last page with fewer items than limit', async () => {
      const query: RoundHistoryQueryDto = { page: 5, limit: 10 };
      const mockRounds = [mockCompletedRound, mockCompletedRound, mockCompletedRound];
      const total = 43; // 4 full pages (40) + 3 items on page 5

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.page).toBe(5);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(43);
      expect(result.totalPages).toBe(5); // Math.ceil(43 / 10) = 5
    });

    it('should correctly map round properties to RoundHistoryItemDto', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const mockRounds = [mockCompletedRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);

      expect(result.data[0]).toBeInstanceOf(RoundHistoryItemDto);
    });
  });

  describe('Pagination Edge Cases', () => {
    it('should use default page=1 when page is 0', async () => {
      const query: RoundHistoryQueryDto = { page: 0, limit: 20 };
      const mockRounds = [mockCompletedRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);

      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(1, 20);
      expect(result.page).toBe(1);
    });

    it('should use default page=1 when page is negative', async () => {
      const query: RoundHistoryQueryDto = { page: -5, limit: 20 };
      const mockRounds = [mockCompletedRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);
      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(1, 20);
      expect(result.page).toBe(1);
    });

    it('should use default limit=20 when limit is 0', async () => {
      const query = new RoundHistoryQueryDto({ page: 1, limit: 0 });
      const mockRounds = [mockCompletedRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);

      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(1, 20);
      expect(result.limit).toBe(20);
    });

    it('should use default limit=20 when limit is negative', async () => {
      const query = new RoundHistoryQueryDto({ page: 1, limit: -10 });
      const mockRounds = [mockCompletedRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);

      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(1, 20);
      expect(result.limit).toBe(20);
    });

    it('should handle maximum limit value', async () => {
      const query = new RoundHistoryQueryDto({ page: 1, limit: 1000 });
      const mockRounds = Array.from({ length: 500 }, (_, i) => genRound({ id: `round-${i}` }));
      const total = 500;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);

      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(1, 1000);
      expect(result.data).toHaveLength(500);
      expect(result.limit).toBe(1000);
    });

    it('should handle very large page numbers', async () => {
      const query: RoundHistoryQueryDto = { page: 9999, limit: 10 };
      const mockRounds: any[] = [];
      const total = 100;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);

      expect(result.data).toHaveLength(0);
      expect(result.page).toBe(9999);
      expect(result.totalPages).toBe(10);
    });
  });

  describe('Round Status Variations', () => {
    it('should handle multiple running rounds (theoretically)', async () => {
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const runningRound2 = genRound({ status: RoundStatus.RUNNING });
      const mockRounds = [mockRunningRound, runningRound2];
      const total = 2;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);

      expect(result.data[0].crashPoint).toBe('secret');
      expect(result.data[1].crashPoint).toBe('secret');
    });

    it('should handle rounds with different statuses', async () => {
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const bettingRound = genRound({ status: RoundStatus.BETTING });
      const mockRounds = [mockCompletedRound, mockRunningRound, bettingRound];
      const total = 3;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);

      expect(result.data[0].status).toBe(RoundStatus.CRASHED);
      expect(result.data[0].crashPoint).toBe(mockCompletedRound.crashPoint);
      expect(result.data[1].status).toBe(RoundStatus.RUNNING);
      expect(result.data[1].crashPoint).toBe('secret');
      expect(result.data[2].status).toBe(RoundStatus.BETTING);
      expect(result.data[2].crashPoint).toBeGreaterThan(0);
    });
  });

  describe('Error Scenarios', () => {
    it('should propagate error when repository findRoundsHistory fails', async () => {
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const dbError = new Error('Database connection failed');
      mockRoundRepository.findRoundsHistory.mockRejectedValueOnce(dbError);

      await expect(historyRoundUsecase.handler(query)).rejects.toThrow('Database connection failed');
    });

    it('should propagate error when repository returns invalid data structure', async () => {
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      mockRoundRepository.findRoundsHistory.mockRejectedValueOnce(new Error());

      await expect(historyRoundUsecase.handler(query)).rejects.toThrow();
    });

    it('should propagate timeout errors from repository', async () => {
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const timeoutError = new Error('Query timeout');
      mockRoundRepository.findRoundsHistory.mockRejectedValueOnce(timeoutError);

      await expect(historyRoundUsecase.handler(query)).rejects.toThrow('Query timeout');
    });
  });

  describe('Data Transformation', () => {
    it('should correctly map all round fields to DTO', async () => {
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const round = genRound({
        id: 'round-complex-123',
        status: RoundStatus.RUNNING,
        crashPoint: 5.75,
        serverSeedHash: '0xabcdef1234567890',
        bettingEndsAt: new Date('2024-01-15T15:30:00Z'),
      });
      const mockRounds = [round];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);

      expect(result.data[0]).toMatchObject({
        roundId: round.id,
        crashPoint: 'secret',
        serverSeedHash: round.serverSeedHash,
        endedAt: round.bettingEndsAt,
        status: round.status,
      });
    });

    it('should preserve date objects in endedAt field', async () => {
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const endedAt = new Date('2024-01-15T10:30:00Z');
      const round = genRound({ bettingEndsAt: endedAt });

      const mockRounds = [round];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);

      expect(result.data[0].endedAt).toBe(endedAt);
      expect(result.data[0].endedAt).toBeInstanceOf(Date);
    });
  });

  describe('Repository Method Verification', () => {
    it('should call findRoundsHistory with correct parameters', async () => {
      const query: RoundHistoryQueryDto = { page: 2, limit: 15 };
      const mockRounds = [mockCompletedRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      await historyRoundUsecase.handler(query);

      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledTimes(1);
      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(2, 15);
    });

    it('should not call any other repository methods', async () => {
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const mockRounds = [mockCompletedRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      await historyRoundUsecase.handler(query);

      expect(mockRoundRepository.findByRoundId).not.toHaveBeenCalled();
      expect(mockRoundRepository.findCurrentBettingRound).not.toHaveBeenCalled();
      expect(mockRoundRepository.findCurrentRunningRound).not.toHaveBeenCalled();
      expect(mockRoundRepository.findRoundWithBets).not.toHaveBeenCalled();
      expect(mockRoundRepository.saveRound).not.toHaveBeenCalled();
      expect(mockRoundRepository.createRound).not.toHaveBeenCalled();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large result sets efficiently', async () => {
      const query: RoundHistoryQueryDto = { page: 1, limit: 100 };
      const mockRounds = Array.from({ length: 100 }, (_, i) =>
        genRound({ id: `round-${i}`, status: RoundStatus.CRASHED }),
      );
      const total = 1000;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const startTime = Date.now();
      const result = await historyRoundUsecase.handler(query);
      const endTime = Date.now();

      expect(result.data).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should handle rounds with missing optional properties', async () => {
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const incompleteRound = genRound({ status: RoundStatus.CRASHED });
      const mockRounds = [incompleteRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);

      expect(result.data[0].crashPoint).toBeTruthy();
      expect(result.data[0].serverSeedHash).toBeTruthy();
      expect(result.data[0].endedAt).toBeTruthy();
    });

    it('should calculate totalPages correctly for various totals', async () => {
      const testCases = [
        { total: 0, limit: 10, expectedPages: 0 },
        { total: 1, limit: 10, expectedPages: 1 },
        { total: 10, limit: 10, expectedPages: 1 },
        { total: 11, limit: 10, expectedPages: 2 },
        { total: 100, limit: 20, expectedPages: 5 },
        { total: 101, limit: 20, expectedPages: 6 },
      ];

      for (const testCase of testCases) {
        const query: RoundHistoryQueryDto = { page: 1, limit: testCase.limit };
        mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([[], testCase.total]);

        const result = await historyRoundUsecase.handler(query);
        expect(result.totalPages).toBe(testCase.expectedPages);
      }
    });
  });

  describe('Integration with DTOs', () => {
    it('should return instance of PaginatedResponseDto', async () => {
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([[], 0]);

      const result = await historyRoundUsecase.handler(query);

      expect(result).toBeInstanceOf(PaginatedResponseDto);
    });

    it('should return array of RoundHistoryItemDto instances', async () => {
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const mockRounds = [mockCompletedRound, mockRunningRound];
      const total = 2;

      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([mockRounds, total]);

      const result = await historyRoundUsecase.handler(query);
      expect(result.data[0]).toBeInstanceOf(RoundHistoryItemDto);
      expect(result.data[1]).toBeInstanceOf(RoundHistoryItemDto);
    });
  });
});
