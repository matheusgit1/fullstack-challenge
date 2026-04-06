import { Test, TestingModule } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { type Request } from 'express';
import { BetsHistoryQueryDto } from '../dtos/request/bet-history-query.dto';
import { BetHistoryItemDto } from '../dtos/response/bets-history-response.dto';
import { PaginatedResponseDto } from '../dtos/response/paginated-reponse.dto';
import { BET_REPOSITORY, IBetRepository } from '@/domain/orm/repositories/bet.repository';
import { Bet, BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';
import { GetMyBetsUseCase } from './my-bets.usecase';
import { Round } from '@/infrastructure/database/orm/entites/round.entity';

describe('GetMyBetsUseCase', () => {
  const mockRequest = {} as jest.Mocked<Request>;

  const mockBetRepository: jest.Mocked<IBetRepository> = {
    findUserBetsHistory: jest.fn(),
    createBet: jest.fn(),
    setPendingBetsToLost: jest.fn(),
    save: jest.fn(),
    findByFilters: jest.fn(),
    findPeddingBets: jest.fn(),
    findLooserBetsByRoundId: jest.fn(),
  };
  const getMyBetsUseCase = new GetMyBetsUseCase(mockRequest, mockBetRepository);

  const mockUser = {
    sub: 'user-123',
  };

  const mockToken = 'mock-jwt-token';
  const mockHash = 'mock-trace-hash';

  const mockRound = {
    id: 'round-123',
    crashPoint: 2.5,
  };

  const mockBet = new Bet({
    id: 'bet-123',
    userId: mockUser.sub,
    roundId: mockRound.id,
    amount: 100,
    multiplier: 2.5,
    status: BetStatus.CASHED_OUT,
    cashedOutAt: new Date('2024-01-15T10:35:00Z'),
    createdAt: new Date('2024-01-15T10:30:00Z'),
    round: new Round({
      crashPoint: 2.5,
    }),
  });

  const mockPendingBet = new Bet({
    id: 'bet-123',
    userId: mockUser.sub,
    roundId: mockRound.id,
    amount: 100,
    multiplier: 2.5,
    status: BetStatus.PENDING,
    cashedOutAt: new Date('2024-01-15T10:35:00Z'),
    createdAt: new Date('2024-01-15T10:30:00Z'),
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Scenarios', () => {
    it('should return paginated bets history with default pagination', async () => {
      const query = new BetsHistoryQueryDto({});
      const total = 25;
      const mockResult = [mockBet, mockBet];

      mockBetRepository.findUserBetsHistory.mockResolvedValue([mockResult, total]);

      const result = await getMyBetsUseCase.handler(query);

      expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith(expect.any(String), 1, 20, undefined);
      expect(result).toBeInstanceOf(PaginatedResponseDto);
      expect(result.data).toHaveLength(mockResult.length);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(2);
    });

    it('should return paginated history with custom pagination parameters', async () => {
      // Arrange
      const query = new BetsHistoryQueryDto({
        page: 3,
        limit: 10,
      });
      const mockBets = [mockBet, mockBet, mockBet];
      const total = 30;

      mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

      // Act
      const result = await getMyBetsUseCase.handler(query);

      // Assert
      expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith(expect.any(String), 3, 10, undefined);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(30);
      expect(result.totalPages).toBe(3);
    });

    it('should filter bets by status when provided', async () => {
      // Arrange
      const query: BetsHistoryQueryDto = {
        page: 1,
        limit: 10,
        status: BetStatus.CASHED_OUT,
      };
      const mockBets = [mockBet];
      const total = 5;

      mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);
      mockRequest.user = { sub: mockUser.sub } as any;
      mockRequest.headers = { authorization: mockToken, traceparent: mockHash } as any;

      // Act
      const result = await getMyBetsUseCase.handler(query);

      // Assert
      expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith(mockUser.sub, 1, 10, BetStatus.CASHED_OUT);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(BetStatus.CASHED_OUT);
    });

    it('should handle anonymous user correctly', async () => {
      // Arrange
      mockRequest.user = undefined;

      const query: BetsHistoryQueryDto = { page: 1, limit: 10 };
      const mockBets = [
        {
          ...mockBet,
          userId: 'anonymous',
        },
      ];
      const total = 1;

      mockBetRepository.findUserBetsHistory.mockResolvedValue([[mockBet], total]);

      // Act
      const result = await getMyBetsUseCase.handler(query);

      // Assert
      expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith('anonymous', 1, 10, undefined);
      expect(result.data[0].userId).toBe('anonymous');
    });

    it('should handle empty result set', async () => {
      // Arrange
      const query: BetsHistoryQueryDto = { page: 1, limit: 10 };
      const mockBets: any[] = [];
      const total = 0;

      mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

      // Act
      const result = await getMyBetsUseCase.handler(query);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle last page with fewer items than limit', async () => {
      // Arrange
      const query: BetsHistoryQueryDto = { page: 5, limit: 10 };
      const mockBets = [mockBet, mockBet, mockBet];
      const total = 43;

      mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

      // Act
      const result = await getMyBetsUseCase.handler(query);

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.page).toBe(5);
      expect(result.totalPages).toBe(5);
    });
  });

  describe('Pagination Edge Cases', () => {
    it('should use default page=1 when page is 0', async () => {
      // Arrange
      const query: BetsHistoryQueryDto = { page: 0, limit: 20 };
      const mockBets = [mockBet];
      const total = 1;

      mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

      // Act
      const result = await getMyBetsUseCase.handler(query);

      // Assert
      expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith(expect.any(String), 1, 20, undefined);
      expect(result.page).toBe(1);
    });

    it('should use default page=1 when page is negative', async () => {
      // Arrange
      const query: BetsHistoryQueryDto = { page: -5, limit: 20 };
      const mockBets = [mockBet];
      const total = 1;

      mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

      // Act
      const result = await getMyBetsUseCase.handler(query);

      // Assert
      expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith(expect.any(String), 1, 20, undefined);
      expect(result.page).toBe(1);
    });

    it('should use default limit=20 when limit is 0', async () => {
      // Arrange
      const query: BetsHistoryQueryDto = { page: 1, limit: 0 };
      const mockBets = [mockBet];
      const total = 1;

      mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

      // Act
      const result = await getMyBetsUseCase.handler(query);

      // Assert
      expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith(expect.any(String), 1, 20, undefined);
      expect(result.limit).toBe(20);
    });

    it('should use default limit=20 when limit is negative', async () => {
      // Arrange
      const query: BetsHistoryQueryDto = { page: 1, limit: -10 };
      const mockBets = [mockBet];
      const total = 1;

      mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

      // Act
      const result = await getMyBetsUseCase.handler(query);

      // Assert
      expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith(expect.any(String), 1, 20, undefined);
      expect(result.limit).toBe(20);
    });

    it('should handle maximum limit value', async () => {
      // Arrange
      const query: BetsHistoryQueryDto = { page: 1, limit: 1000 };
      const mockBets = Array.from({ length: 500 }, (_, i) => ({
        ...mockBet,
        id: `bet-${i}`,
      }));
      const total = 500;

      mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets as any, total]);

      // Act
      const result = await getMyBetsUseCase.handler(query);

      // Assert
      expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith(expect.any(String), 1, 1000, undefined);
      expect(result.data).toHaveLength(500);
      expect(result.limit).toBe(1000);
    });

    it('should handle very large page numbers', async () => {
      // Arrange
      const query: BetsHistoryQueryDto = { page: 9999, limit: 10 };
      const mockBets: any[] = [];
      const total = 100;

      mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

      // Act
      const result = await getMyBetsUseCase.handler(query);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.page).toBe(9999);
      expect(result.totalPages).toBe(10);
    });
  });

  // describe('Bet Status Filtering', () => {
  //   it('should filter by PENDING status', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = {
  //       page: 1,
  //       limit: 10,
  //       status: BetStatus.PENDING,
  //     };
  //     const mockBets = [mockPendingBet];
  //     const total = 3;

  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

  //     // Act
  //     const result = await getMyBetsUseCase.handler(query);

  //     // Assert
  //     expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith(mockUser.sub, 1, 10, BetStatus.PENDING);
  //     expect(result.data[0].status).toBe(BetStatus.PENDING);
  //     expect(result.data[0].multiplier).toBe(1);
  //     expect(result.data[0].cashedOutAt).toBeNull();
  //   });

  //   it('should filter by LOST status', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = {
  //       page: 1,
  //       limit: 10,
  //       status: BetStatus.LOST,
  //     };
  //     const lostBet = {
  //       ...mockBet,
  //       status: BetStatus.LOST,
  //       multiplier: 0,
  //     };
  //     const mockBets = [lostBet];
  //     const total = 2;

  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

  //     // Act
  //     const result = await getMyBetsUseCase.handler(query);

  //     // Assert
  //     expect(result.data[0].status).toBe(BetStatus.LOST);
  //   });

  //   it('should filter by CASHED_OUT status', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = {
  //       page: 1,
  //       limit: 10,
  //       status: BetStatus.CASHED_OUT,
  //     };
  //     const mockBets = [mockBet];
  //     const total = 5;

  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

  //     // Act
  //     const result = await getMyBetsUseCase.handler(query);

  //     // Assert
  //     expect(result.data[0].status).toBe(BetStatus.CASHED_OUT);
  //   });

  //   it('should handle multiple status values', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = {
  //       page: 1,
  //       limit: 10,
  //       status: [BetStatus.CASHED_OUT, BetStatus.LOST] as any,
  //     };
  //     const mockBets = [mockBet, { ...mockBet, status: BetStatus.LOST }];
  //     const total = 2;

  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

  //     // Act
  //     const result = await getMyBetsUseCase.handler(query);

  //     // Assert
  //     expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith(mockUser.sub, 1, 10, [
  //       BetStatus.CASHED_OUT,
  //       BetStatus.LOST,
  //     ]);
  //     expect(result.data).toHaveLength(2);
  //   });
  // });

  // describe('Data Transformation', () => {
  //   it('should correctly map all bet fields to BetHistoryItemDto', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = { page: 1, limit: 10 };
  //     const complexBet = {
  //       id: 'bet-complex-123',
  //       userId: mockUser.sub,
  //       roundId: mockRound.id,
  //       amount: 250,
  //       multiplier: 3.5,
  //       status: BetStatus.CASHED_OUT,
  //       cashedOutAt: new Date('2024-01-15T10:35:00Z'),
  //       createdAt: new Date('2024-01-15T10:30:00Z'),
  //       round: {
  //         id: 'round-complex-456',
  //         crashPoint: 3.5,
  //       },
  //     };
  //     const mockBets = [complexBet];
  //     const total = 1;

  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

  //     // Act
  //     const result = await getMyBetsUseCase.handler(query);

  //     // Assert
  //     expect(result.data[0]).toBeInstanceOf(BetHistoryItemDto);
  //     expect(result.data[0]).toEqual({
  //       roundCrashPoint: complexBet.round.crashPoint,
  //       roundId: complexBet.roundId,
  //       id: complexBet.id,
  //       userId: mockUser.sub,
  //       amount: complexBet.amount,
  //       multiplier: complexBet.multiplier,
  //       status: complexBet.status,
  //       cashedOutAt: complexBet.cashedOutAt,
  //       createdAt: complexBet.createdAt,
  //     });
  //   });

  //   it('should preserve date objects', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = { page: 1, limit: 10 };
  //     const cashedOutAt = new Date('2024-01-15T10:35:00Z');
  //     const createdAt = new Date('2024-01-15T10:30:00Z');
  //     const betWithDates = {
  //       ...mockBet,
  //       cashedOutAt,
  //       createdAt,
  //     };
  //     const mockBets = [betWithDates];
  //     const total = 1;

  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

  //     // Act
  //     const result = await getMyBetsUseCase.handler(query);

  //     // Assert
  //     expect(result.data[0].cashedOutAt).toBe(cashedOutAt);
  //     expect(result.data[0].createdAt).toBe(createdAt);
  //     expect(result.data[0].cashedOutAt).toBeInstanceOf(Date);
  //     expect(result.data[0].createdAt).toBeInstanceOf(Date);
  //   });

  //   it('should handle null cashedOutAt', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = { page: 1, limit: 10 };
  //     const betWithoutCashout = {
  //       ...mockPendingBet,
  //       cashedOutAt: null,
  //     };
  //     const mockBets = [betWithoutCashout];
  //     const total = 1;

  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

  //     // Act
  //     const result = await getMyBetsUseCase.handler(query);

  //     // Assert
  //     expect(result.data[0].cashedOutAt).toBeNull();
  //   });
  // });

  // describe('Error Scenarios', () => {
  //   it('should propagate error when repository findUserBetsHistory fails', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = { page: 1, limit: 10 };
  //     const dbError = new Error('Database connection failed');
  //     mockBetRepository.findUserBetsHistory.mockRejectedValue(dbError);

  //     // Act & Assert
  //     await expect(getMyBetsUseCase.handler(query)).rejects.toThrow('Database connection failed');
  //   });

  //   it('should propagate error when repository returns invalid data structure', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = { page: 1, limit: 10 };
  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([null, 0]);

  //     // Act & Assert
  //     await expect(getMyBetsUseCase.handler(query)).rejects.toThrow();
  //   });

  //   it('should propagate timeout errors', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = { page: 1, limit: 10 };
  //     const timeoutError = new Error('Query timeout');
  //     mockBetRepository.findUserBetsHistory.mockRejectedValue(timeoutError);

  //     // Act & Assert
  //     await expect(getMyBetsUseCase.handler(query)).rejects.toThrow('Query timeout');
  //   });
  // });

  // describe('Repository Method Verification', () => {
  //   it('should call findUserBetsHistory with correct parameters', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = {
  //       page: 2,
  //       limit: 15,
  //       status: BetStatus.PENDING,
  //     };
  //     const mockBets = [mockPendingBet];
  //     const total = 1;

  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

  //     // Act
  //     await getMyBetsUseCase.handler(query);

  //     // Assert
  //     expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledTimes(1);
  //     expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith(mockUser.sub, 2, 15, BetStatus.PENDING);
  //   });

  //   it('should not call any other repository methods', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = { page: 1, limit: 10 };
  //     const mockBets = [mockBet];
  //     const total = 1;

  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

  //     // Act
  //     await getMyBetsUseCase.handler(query);

  //     // Assert
  //     expect(mockBetRepository.createBet).not.toHaveBeenCalled();
  //     expect(mockBetRepository.setPendingBetsToLost).not.toHaveBeenCalled();
  //     expect(mockBetRepository.save).not.toHaveBeenCalled();
  //     expect(mockBetRepository.findByFilters).not.toHaveBeenCalled();
  //   });
  // });

  // describe('Performance and Edge Cases', () => {
  //   it('should handle large result sets efficiently', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = { page: 1, limit: 100 };
  //     const mockBets = Array.from({ length: 100 }, (_, i) => ({
  //       ...mockBet,
  //       id: `bet-${i}`,
  //       round: { ...mockRound, id: `round-${i}` },
  //     }));
  //     const total = 1000;

  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

  //     // Act
  //     const startTime = Date.now();
  //     const result = await getMyBetsUseCase.handler(query);
  //     const endTime = Date.now();

  //     // Assert
  //     expect(result.data).toHaveLength(100);
  //     expect(endTime - startTime).toBeLessThan(500);
  //   });

  //   it('should handle bets with missing round data', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = { page: 1, limit: 10 };
  //     const betWithoutRound = {
  //       ...mockBet,
  //       round: null,
  //     };
  //     const mockBets = [betWithoutRound];
  //     const total = 1;

  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

  //     // Act & Assert
  //     await expect(getMyBetsUseCase.handler(query)).rejects.toThrow();
  //   });

  //   it('should calculate totalPages correctly for various totals', async () => {
  //     const testCases = [
  //       { total: 0, limit: 10, expectedPages: 0 },
  //       { total: 1, limit: 10, expectedPages: 1 },
  //       { total: 10, limit: 10, expectedPages: 1 },
  //       { total: 11, limit: 10, expectedPages: 2 },
  //       { total: 100, limit: 20, expectedPages: 5 },
  //       { total: 101, limit: 20, expectedPages: 6 },
  //     ];

  //     for (const testCase of testCases) {
  //       const query: BetsHistoryQueryDto = { page: 1, limit: testCase.limit };
  //       mockBetRepository.findUserBetsHistory.mockResolvedValue([[], testCase.total]);

  //       const result = await getMyBetsUseCase.handler(query);
  //       expect(result.totalPages).toBe(testCase.expectedPages);
  //     }
  //   });
  // });

  // describe('Integration with DTOs', () => {
  //   it('should return instance of PaginatedResponseDto', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = { page: 1, limit: 10 };
  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([[], 0]);

  //     // Act
  //     const result = await getMyBetsUseCase.handler(query);

  //     // Assert
  //     expect(result).toBeInstanceOf(PaginatedResponseDto);
  //   });

  //   it('should return array of BetHistoryItemDto instances', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = { page: 1, limit: 10 };
  //     const mockBets = [mockBet, mockPendingBet];
  //     const total = 2;

  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([mockBets, total]);

  //     // Act
  //     const result = await getMyBetsUseCase.handler(query);

  //     // Assert
  //     expect(result.data[0]).toBeInstanceOf(BetHistoryItemDto);
  //     expect(result.data[1]).toBeInstanceOf(BetHistoryItemDto);
  //   });
  // });

  // describe('Request Data Handling', () => {
  //   it('should use user.sub from request', async () => {
  //     // Arrange
  //     const query: BetsHistoryQueryDto = { page: 1, limit: 10 };
  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([[], 0]);

  //     // Act
  //     await getMyBetsUseCase.handler(query);

  //     // Assert
  //     expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith(
  //       mockUser.sub,
  //       expect.any(Number),
  //       expect.any(Number),
  //       undefined,
  //     );
  //   });

  //   it('should use "anonymous" when user is undefined', async () => {
  //     // Arrange
  //     mockRequest.user = undefined;
  //     const query: BetsHistoryQueryDto = { page: 1, limit: 10 };
  //     mockBetRepository.findUserBetsHistory.mockResolvedValue([[], 0]);

  //     // Act
  //     const res = await getMyBetsUseCase.handler(query);

  //     // Assert
  //     expect(res.data).toHaveLength(0);
  //     expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith('anonymous', 1, 10, undefined);
  //   });
  // });
});
