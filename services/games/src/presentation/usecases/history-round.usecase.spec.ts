import { PaginatedResponseDto } from '../dtos/response/paginated-reponse.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { HistoryRoundUsecase } from './history-round.usecase';
import { RoundHistoryQueryDto } from '../dtos/request/round-history-query.dto';
import { RoundHistoryItemDto } from '../dtos/response/round-history-response.dto';
// import { PaginatedResponseDto } from '../dtos/response/round.dto';
import { ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';

describe('HistoryRoundUsecase', () => {
  let historyRoundUsecase: HistoryRoundUsecase;
  const mockRoundRepository = {
    findByRoundId: jest.fn(),
    findCurrentBettingRound: jest.fn(),
    findCurrentRunningRound: jest.fn(),
    findRoundWithBets: jest.fn(),
    findRoundsHistory: jest.fn(),
    saveRound: jest.fn(),
    createRound: jest.fn(),
  };

  const mockCompletedRound = {
    id: 'round-123',
    status: 'completed',
    crashPoint: 2.5,
    serverSeedHash: '0x7d4e7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
    bettingEndsAt: new Date('2024-01-15T10:30:00Z'),
    isRunning: jest.fn().mockReturnValue(false),
  };

  const mockRunningRound = {
    id: 'round-456',
    status: 'running',
    crashPoint: null,
    serverSeedHash: '0x8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
    bettingEndsAt: new Date('2024-01-15T11:00:00Z'),
    isRunning: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryRoundUsecase,
        {
          provide: ROUND_REPOSITORY,
          useValue: mockRoundRepository,
        },
      ],
    }).compile();

    historyRoundUsecase = module.get<HistoryRoundUsecase>(HistoryRoundUsecase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Scenarios', () => {
    it('should return paginated history of rounds with default pagination', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = {
        page: 1,
        limit: 20,
      };
      const mockRounds = [mockCompletedRound, mockCompletedRound];
      const total = 25;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(1, 20);
      expect(result).toBeInstanceOf(PaginatedResponseDto);
      expect(result.data).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(2); // Math.ceil(25 / 20) = 2
    });

    it('should return paginated history with custom pagination parameters', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = {
        page: 3,
        limit: 10,
      };
      const mockRounds = [mockCompletedRound, mockCompletedRound, mockCompletedRound];
      const total = 30;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(3, 10);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(30);
      expect(result.totalPages).toBe(3); // Math.ceil(30 / 10) = 3
    });

    it('should return "secret" for crashPoint when round is still running', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const mockRounds = [mockRunningRound, mockCompletedRound];
      const total = 2;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(result.data[0].crashPoint).toBe('secret');
      expect(result.data[1].crashPoint).toBe(mockCompletedRound.crashPoint);
    });

    it('should handle empty result set', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const mockRounds: any[] = [];
      const total = 0;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle last page with fewer items than limit', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 5, limit: 10 };
      const mockRounds = [mockCompletedRound, mockCompletedRound, mockCompletedRound];
      const total = 43; // 4 full pages (40) + 3 items on page 5

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

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

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(result.data[0]).toBeInstanceOf(RoundHistoryItemDto);
      expect(result.data[0]).toEqual({
        roundId: mockCompletedRound.id,
        crashPoint: mockCompletedRound.crashPoint,
        serverSeedHash: mockCompletedRound.serverSeedHash,
        endedAt: mockCompletedRound.bettingEndsAt,
        status: mockCompletedRound.status,
      });
    });
  });

  describe('Pagination Edge Cases', () => {
    it('should use default page=1 when page is 0', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 0, limit: 20 };
      const mockRounds = [mockCompletedRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(1, 20);
      expect(result.page).toBe(1);
    });

    it('should use default page=1 when page is negative', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: -5, limit: 20 };
      const mockRounds = [mockCompletedRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(1, 20);
      expect(result.page).toBe(1);
    });

    it('should use default limit=20 when limit is 0', async () => {
      // Arrange
      const query = new RoundHistoryQueryDto({ page: 1, limit: 0 });
      const mockRounds = [mockCompletedRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(1, 20);
      expect(result.limit).toBe(20);
    });

    it('should use default limit=20 when limit is negative', async () => {
      // Arrange
      const query = new RoundHistoryQueryDto({ page: 1, limit: -10 });
      const mockRounds = [mockCompletedRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(1, 20);
      expect(result.limit).toBe(20);
    });

    it('should handle maximum limit value', async () => {
      // Arrange
      const query = new RoundHistoryQueryDto({ page: 1, limit: 1000 });
      const mockRounds = Array.from({ length: 500 }, (_, i) => ({ ...mockCompletedRound, id: `round-${i}` }));
      const total = 500;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(1, 1000);
      expect(result.data).toHaveLength(500);
      expect(result.limit).toBe(1000);
    });

    it('should handle very large page numbers', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 9999, limit: 10 };
      const mockRounds: any[] = [];
      const total = 100;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.page).toBe(9999);
      expect(result.totalPages).toBe(10); // Math.ceil(100 / 10) = 10
    });
  });

  describe('Round Status Variations', () => {
    it('should handle multiple running rounds (theoretically)', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const runningRound2 = {
        ...mockRunningRound,
        id: 'round-789',
        isRunning: jest.fn().mockReturnValue(true),
      };
      const mockRounds = [mockRunningRound, runningRound2];
      const total = 2;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(result.data[0].crashPoint).toBe('secret');
      expect(result.data[1].crashPoint).toBe('secret');
    });

    it('should handle rounds with different statuses', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const cancelledRound = {
        ...mockCompletedRound,
        id: 'round-cancelled',
        status: 'cancelled',
        crashPoint: 0,
        isRunning: jest.fn().mockReturnValue(false),
      };
      const mockRounds = [mockCompletedRound, mockRunningRound, cancelledRound];
      const total = 3;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(result.data[0].status).toBe('completed');
      expect(result.data[0].crashPoint).toBe(2.5);
      expect(result.data[1].status).toBe('running');
      expect(result.data[1].crashPoint).toBe('secret');
      expect(result.data[2].status).toBe('cancelled');
      expect(result.data[2].crashPoint).toBe(0);
    });

    it('should handle round with null crashPoint when not running', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const roundWithNullCrash = {
        ...mockCompletedRound,
        crashPoint: null,
        isRunning: jest.fn().mockReturnValue(false),
      };
      const mockRounds = [roundWithNullCrash];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(result.data[0].crashPoint).toBeNull();
    });
  });

  describe('Error Scenarios', () => {
    it('should propagate error when repository findRoundsHistory fails', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const dbError = new Error('Database connection failed');
      mockRoundRepository.findRoundsHistory.mockRejectedValue(dbError);

      // Act & Assert
      await expect(historyRoundUsecase.handler(query)).rejects.toThrow('Database connection failed');
    });

    it('should propagate error when repository returns invalid data structure', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      mockRoundRepository.findRoundsHistory.mockResolvedValue([null, 0]);

      // Act & Assert
      await expect(historyRoundUsecase.handler(query)).rejects.toThrow();
    });

    it('should propagate timeout errors from repository', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const timeoutError = new Error('Query timeout');
      mockRoundRepository.findRoundsHistory.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(historyRoundUsecase.handler(query)).rejects.toThrow('Query timeout');
    });
  });

  describe('Data Transformation', () => {
    it('should correctly map all round fields to DTO', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const complexRound = {
        id: 'round-complex-123',
        status: 'completed',
        crashPoint: 5.75,
        serverSeedHash: '0xabcdef1234567890',
        bettingEndsAt: new Date('2024-01-15T15:30:00Z'),
        isRunning: jest.fn().mockReturnValue(false),
      };
      const mockRounds = [complexRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(result.data[0]).toMatchObject({
        roundId: complexRound.id,
        crashPoint: complexRound.crashPoint,
        serverSeedHash: complexRound.serverSeedHash,
        endedAt: complexRound.bettingEndsAt,
        status: complexRound.status,
      });
    });

    it('should preserve date objects in endedAt field', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const endedAt = new Date('2024-01-15T10:30:00Z');
      const roundWithDate = {
        ...mockCompletedRound,
        bettingEndsAt: endedAt,
      };
      const mockRounds = [roundWithDate];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(result.data[0].endedAt).toBe(endedAt);
      expect(result.data[0].endedAt).toBeInstanceOf(Date);
    });
  });

  describe('Repository Method Verification', () => {
    it('should call findRoundsHistory with correct parameters', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 2, limit: 15 };
      const mockRounds = [mockCompletedRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      await historyRoundUsecase.handler(query);

      // Assert
      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledTimes(1);
      expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(2, 15);
    });

    it('should not call any other repository methods', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const mockRounds = [mockCompletedRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      await historyRoundUsecase.handler(query);

      // Assert
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
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 100 };
      const mockRounds = Array.from({ length: 100 }, (_, i) => ({
        ...mockCompletedRound,
        id: `round-${i}`,
        isRunning: jest.fn().mockReturnValue(false),
      }));
      const total = 1000;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const startTime = Date.now();
      const result = await historyRoundUsecase.handler(query);
      const endTime = Date.now();

      // Assert
      expect(result.data).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(500); // Should complete in less than 500ms
    });

    it('should handle rounds with missing optional properties', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const incompleteRound = {
        id: 'round-incomplete',
        status: 'completed',
        crashPoint: null,
        serverSeedHash: null,
        bettingEndsAt: null,
        isRunning: jest.fn().mockReturnValue(false),
      };
      const mockRounds = [incompleteRound];
      const total = 1;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(result.data[0].crashPoint).toBeNull();
      expect(result.data[0].serverSeedHash).toBeNull();
      expect(result.data[0].endedAt).toBeNull();
    });

    it('should calculate totalPages correctly for various totals', async () => {
      // Test multiple scenarios
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
        mockRoundRepository.findRoundsHistory.mockResolvedValue([[], testCase.total]);

        const result = await historyRoundUsecase.handler(query);
        expect(result.totalPages).toBe(testCase.expectedPages);
      }
    });
  });

  describe('Integration with DTOs', () => {
    it('should return instance of PaginatedResponseDto', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      mockRoundRepository.findRoundsHistory.mockResolvedValue([[], 0]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(result).toBeInstanceOf(PaginatedResponseDto);
    });

    it('should return array of RoundHistoryItemDto instances', async () => {
      // Arrange
      const query: RoundHistoryQueryDto = { page: 1, limit: 10 };
      const mockRounds = [mockCompletedRound, mockRunningRound];
      const total = 2;

      mockRoundRepository.findRoundsHistory.mockResolvedValue([mockRounds, total]);

      // Act
      const result = await historyRoundUsecase.handler(query);

      // Assert
      expect(result.data[0]).toBeInstanceOf(RoundHistoryItemDto);
      expect(result.data[1]).toBeInstanceOf(RoundHistoryItemDto);
    });
  });
});
