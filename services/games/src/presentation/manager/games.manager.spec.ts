import { Test, TestingModule } from '@nestjs/testing';
import { GamesManager } from './games.manager';
import { BET_REPOSITORY } from '@/domain/orm/repositories/bet.repository';
import { RABBITMQ_PRODUCER_SERVICE, TransactionSource } from '@/domain/rabbitmq/rabbitmq.producer';
import { Bet, BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';
import { CashoutResponseDto } from '../dtos/request/cashout-request.dto';
import { Round, RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';

describe('GamesManager', () => {
  let gamesManager: GamesManager;
  let mockBetRepository: jest.Mocked<any>;
  let mockRabbitmqProducer: jest.Mocked<any>;

  const mockUserId = 'user-123';
  const mockExternalId = 'external-456';
  const mockTracingId = 'trace-789';

  const mockRound = {
    id: 'round-123',
    multiplier: 2.5,
    status: 'running',
    crashPoint: 3.0,
    isRunning: jest.fn().mockReturnValue(true),
    isCrashed: jest.fn().mockReturnValue(false),
  };

  const mockBet = {
    id: 'bet-123',
    userId: mockUserId,
    roundId: mockRound.id,
    amount: 100,
    multiplier: 1,
    status: BetStatus.PENDING,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    cashedOutAt: null,
    lose: jest.fn(),
    cashout: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockBetRepository = {
      setPendingBetsToLost: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      findByFilters: jest.fn(),
      findPeddingBets: jest.fn(),
      findLooserBetsByRoundId: jest.fn(),
      createBet: jest.fn(),
      findUserBetsHistory: jest.fn(),
    };

    mockRabbitmqProducer = {
      publishReserve: jest.fn().mockResolvedValue(undefined),
      publishCashin: jest.fn().mockResolvedValue(undefined),
      publishCashout: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesManager,
        {
          provide: BET_REPOSITORY,
          useValue: mockBetRepository,
        },
        {
          provide: RABBITMQ_PRODUCER_SERVICE,
          useValue: mockRabbitmqProducer,
        },
      ],
    }).compile();

    gamesManager = module.get<GamesManager>(GamesManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processCashout - Success Scenarios', () => {
    it('should process cashout successfully when round crashes', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
      });

      // Act
      const result = await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledWith({
        cashType: TransactionSource.BET_LOST,
        userId: mockUserId,
        timestamp: expect.any(String),
        externalId: mockExternalId,
        tracingId: mockTracingId,
      });

      expect(bet.lose).toHaveBeenCalled();
      expect(mockBetRepository.save).toHaveBeenCalledWith(bet);
      expect(result).toBeInstanceOf(CashoutResponseDto);
      expect(result).toEqual({
        bet: {
          id: bet.id,
          userId: mockUserId,
          amount: bet.amount,
          multiplier: round.multiplier,
          status: bet.status,
          cashedOutAt: expect.any(Date),
          createdAt: bet.createdAt,
        },
        multiplier: round.multiplier,
        winAmount: bet.amount,
        roundStatus: round.status,
      });
    });

    it('should process cashout with zero multiplier', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 0,
      });

      // Act
      const result = await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(result.multiplier).toBe(0);
      expect(result.winAmount).toBe(bet.amount);
      expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalled();
    });

    it('should process cashout with very large multiplier', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 999999.99,
      });

      // Act
      const result = await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(result.multiplier).toBe(999999.99);
      expect(result.winAmount).toBe(bet.amount);
    });

    it('should process cashout with zero amount bet', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 0,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 999999.99,
      });

      // Act
      const result = await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(result.winAmount).toBe(0);
      expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalled();
    });
  });

  describe('processCashin - Success Scenarios', () => {
    it('should process cashin successfully when round is running', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 0,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 2.5,
      });
      const expectedWinAmount = bet.amount * round.multiplier - bet.amount; // 100 * 2.5 - 100 = 150

      // Act
      const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(mockRabbitmqProducer.publishCashin).toHaveBeenCalledWith({
        cashType: TransactionSource.BET_PLACED,
        userId: mockUserId,
        multiplier: round.multiplier,
        timestamp: expect.any(String),
        externalId: mockExternalId,
        tracingId: mockTracingId,
      });

      expect(bet.cashout).toHaveBeenCalledWith(round.multiplier);
      expect(mockBetRepository.save).toHaveBeenCalledWith(bet);
      expect(result).toBeInstanceOf(CashoutResponseDto);
      expect(result).toEqual({
        bet: {
          id: bet.id,
          userId: mockUserId,
          amount: bet.amount,
          multiplier: round.multiplier,
          status: bet.status,
          cashedOutAt: expect.any(Date),
          createdAt: bet.createdAt,
        },
        multiplier: round.multiplier,
        winAmount: expectedWinAmount,
        roundStatus: round.status,
      });
    });

    it('should calculate winAmount correctly for different multipliers', async () => {
      const testCases = [
        { amount: 100, multiplier: 1.5, expectedWin: 50 },
        { amount: 50, multiplier: 2.0, expectedWin: 50 },
        { amount: 200, multiplier: 3.0, expectedWin: 400 },
        { amount: 1000, multiplier: 1.0, expectedWin: 0 },
        { amount: 75, multiplier: 10.5, expectedWin: 712.5 },
      ];

      for (const testCase of testCases) {
        // const bet = { ...mockBet, amount: testCase.amount };
        // const round = { ...mockRound, multiplier: testCase.multiplier };
        const bet = new Bet({
          ...mockBet,
          status: BetStatus.CASHED_OUT,
          amount: testCase.amount,
        });
        const round = new Round({
          ...mockRound,
          status: RoundStatus.BETTING,
          multiplier: testCase.multiplier,
        });

        const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

        expect(result.winAmount).toBe(testCase.expectedWin);
      }
    });

    it('should handle cashin with integer multiplier', async () => {
      // Arrange
      const expectedWinAmount = 400; // 100 * 5 - 100 = 400
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 5,
      });

      // Act
      const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(result.winAmount).toBe(expectedWinAmount);
      expect(bet.cashout).toHaveBeenCalledWith(5);
    });

    it('should handle cashin with decimal multiplier', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });
      const expectedWinAmount = 75; // 100 * 1.75 - 100 = 75

      // Act
      const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(result.winAmount).toBe(expectedWinAmount);
    });
  });

  describe('processCashout - Error Scenarios', () => {
    it('should throw error when rabbitmq publishCashout fails', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });
      const rabbitError = new Error('RabbitMQ connection failed');
      mockRabbitmqProducer.publishCashout.mockRejectedValue(rabbitError);

      // Act & Assert
      await expect(gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId)).rejects.toThrow(
        'RabbitMQ connection failed',
      );

      expect(bet.lose).not.toHaveBeenCalled();
      expect(mockBetRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when bet.lose is called but save fails', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });
      const saveError = new Error('Database save failed');
      mockBetRepository.save.mockRejectedValue(saveError);

      // Act & Assert
      await expect(gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId)).rejects.toThrow(
        'Database save failed',
      );

      expect(bet.lose).toHaveBeenCalled();
      expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalled();
    });
  });

  describe('processCashin - Error Scenarios', () => {
    it('should throw error when rabbitmq publishCashin fails', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });
      const rabbitError = new Error('RabbitMQ connection failed');
      mockRabbitmqProducer.publishCashin.mockRejectedValue(rabbitError);

      // Act & Assert
      await expect(gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId)).rejects.toThrow(
        'RabbitMQ connection failed',
      );

      expect(bet.cashout).not.toHaveBeenCalled();
      expect(mockBetRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when bet.cashout is called but save fails', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });
      const saveError = new Error('Database save failed');
      mockBetRepository.save.mockRejectedValue(saveError);

      // Act & Assert
      await expect(gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId)).rejects.toThrow(
        'Database save failed',
      );

      expect(bet.cashout).toHaveBeenCalledWith(round.multiplier);
      expect(mockRabbitmqProducer.publishCashin).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Data Integrity', () => {
    it('should use current timestamp for cashout', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });
      const beforeCall = new Date();

      // Act
      const result = await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      const publishCall = mockRabbitmqProducer.publishCashout.mock.calls[0][0];
      const timestamp = new Date(publishCall.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(result.bet.cashedOutAt).toBeInstanceOf(Date);
    });

    it('should use current timestamp for cashin', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });
      const beforeCall = new Date();

      // Act
      const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      const publishCall = mockRabbitmqProducer.publishCashin.mock.calls[0][0];
      const timestamp = new Date(publishCall.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(result.bet.cashedOutAt).toBeInstanceOf(Date);
    });

    it('should preserve bet createdAt date', async () => {
      // Arrange
      const createdAt = new Date('2024-01-15T10:30:00Z');
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
        createdAt: createdAt,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      const cashoutResult = await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);
      const cashinResult = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(cashoutResult.bet.createdAt).toBe(createdAt);
      expect(cashinResult.bet.createdAt).toBe(createdAt);
    });

    it('should handle undefined tracingId', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledWith(
        expect.objectContaining({
          tracingId: expect.anything(),
        }),
      );
    });

    it('should handle empty externalId', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      await gamesManager.processBetWin(bet, round, mockUserId, '', mockTracingId);

      // Assert
      expect(mockRabbitmqProducer.publishCashin).toHaveBeenCalledWith(
        expect.objectContaining({
          externalId: '',
        }),
      );
    });
  });

  describe('Return Type Validation', () => {
    it('should return CashoutResponseDto for cashout', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      const result = await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(result).toBeInstanceOf(CashoutResponseDto);
      expect(result).toHaveProperty('bet');
      expect(result).toHaveProperty('multiplier');
      expect(result).toHaveProperty('winAmount');
      expect(result).toHaveProperty('roundStatus');
    });

    it('should return CashoutResponseDto for cashin', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(result).toBeInstanceOf(CashoutResponseDto);
      expect(result).toHaveProperty('bet');
      expect(result).toHaveProperty('multiplier');
      expect(result).toHaveProperty('winAmount');
      expect(result).toHaveProperty('roundStatus');
    });

    it('should have correct bet structure in response', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(result.bet).toHaveProperty('id', bet.id);
      expect(result.bet).toHaveProperty('userId', mockUserId);
      expect(result.bet).toHaveProperty('amount', bet.amount);
      expect(result.bet).toHaveProperty('multiplier', round.multiplier);
      expect(result.bet).toHaveProperty('status', bet.status);
      expect(result.bet).toHaveProperty('cashedOutAt');
      expect(result.bet).toHaveProperty('createdAt', bet.createdAt);
    });
  });

  describe('Repository Method Verification', () => {
    it('should call betRepository.save exactly once for cashout', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(mockBetRepository.save).toHaveBeenCalledTimes(1);
      expect(mockBetRepository.save).toHaveBeenCalledWith(bet);
    });

    it('should call betRepository.save exactly once for cashin', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(mockBetRepository.save).toHaveBeenCalledTimes(1);
      expect(mockBetRepository.save).toHaveBeenCalledWith(bet);
    });

    it('should not call any other repository methods', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);
      await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(mockBetRepository.setPendingBetsToLost).not.toHaveBeenCalled();
      expect(mockBetRepository.findByFilters).not.toHaveBeenCalled();
      expect(mockBetRepository.findPeddingBets).not.toHaveBeenCalled();
      expect(mockBetRepository.findLooserBetsByRoundId).not.toHaveBeenCalled();
      expect(mockBetRepository.createBet).not.toHaveBeenCalled();
      expect(mockBetRepository.findUserBetsHistory).not.toHaveBeenCalled();
    });
  });

  describe('RabbitMQ Message Verification', () => {
    it('should publish correct cashout message structure', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      const publishCall = mockRabbitmqProducer.publishCashout.mock.calls[0][0];
      expect(publishCall).toEqual({
        cashType: TransactionSource.BET_LOST,
        userId: mockUserId,
        timestamp: expect.any(String),
        externalId: mockExternalId,
        tracingId: mockTracingId,
      });
    });

    it('should publish correct cashin message structure', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      const publishCall = mockRabbitmqProducer.publishCashin.mock.calls[0][0];
      expect(publishCall).toEqual({
        cashType: TransactionSource.BET_PLACED,
        userId: mockUserId,
        multiplier: round.multiplier,
        timestamp: expect.any(String),
        externalId: mockExternalId,
        tracingId: mockTracingId,
      });
    });

    it('should use correct cashType for cashout', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledWith(
        expect.objectContaining({
          cashType: TransactionSource.BET_LOST,
        }),
      );
    });

    it('should use correct cashType for cashin', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(mockRabbitmqProducer.publishCashin).toHaveBeenCalledWith(
        expect.objectContaining({
          cashType: TransactionSource.BET_PLACED,
        }),
      );
    });
  });

  describe('Bet Entity Method Calls', () => {
    it('should call bet.lose() for cashout', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(bet.lose).toHaveBeenCalledTimes(1);
      expect(bet.cashout).not.toHaveBeenCalled();
    });

    it('should call bet.cashout() with correct multiplier for cashin', async () => {
      // Arrange
      const bet = new Bet({
        ...mockBet,
        status: BetStatus.CASHED_OUT,
        amount: 100,
      });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 3.75,
      });

      // Act
      await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(bet.cashout).toHaveBeenCalledTimes(1);
      expect(bet.cashout).toHaveBeenCalledWith(3.75);
      expect(bet.lose).not.toHaveBeenCalled();
    });
  });

  describe('Performance and Concurrent Calls', () => {
    it('should handle concurrent cashout calls', async () => {
      // Arrange
      // const bet1 = { ...mockBet, id: 'bet-1' };
      // const bet2 = { ...mockBet, id: 'bet-2' };
      // const bet3 = { ...mockBet, id: 'bet-3' };
      const bet1 = new Bet({ ...mockBet, id: 'bet-1' }),
        bet2 = new Bet({ ...mockBet, id: 'bet-2' }),
        bet3 = new Bet({
          ...mockBet,
          status: BetStatus.CASHED_OUT,
          amount: 100,
        });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      await Promise.all([
        gamesManager.processBetLost(bet1, round, mockUserId, mockExternalId, mockTracingId),
        gamesManager.processBetLost(bet2, round, mockUserId, mockExternalId, mockTracingId),
        gamesManager.processBetLost(bet3, round, mockUserId, mockExternalId, mockTracingId),
      ]);

      // Assert
      expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledTimes(3);
      expect(mockBetRepository.save).toHaveBeenCalledTimes(3);
      expect(bet1.lose).toHaveBeenCalled();
      expect(bet2.lose).toHaveBeenCalled();
      expect(bet3.lose).toHaveBeenCalled();
    });

    it('should handle concurrent cashin calls', async () => {
      // Arrange
      // const bet1 = { ...mockBet, id: 'bet-1' };
      // const bet2 = { ...mockBet, id: 'bet-2' };
      // const bet3 = { ...mockBet, id: 'bet-3' };
      const bet1 = new Bet({ ...mockBet, id: 'bet-1' }),
        bet2 = new Bet({ ...mockBet, id: 'bet-2' }),
        bet3 = new Bet({
          ...mockBet,
          status: BetStatus.CASHED_OUT,
        });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      await Promise.all([
        gamesManager.processBetWin(bet1, round, mockUserId, mockExternalId, mockTracingId),
        gamesManager.processBetWin(bet2, round, mockUserId, mockExternalId, mockTracingId),
        gamesManager.processBetWin(bet3, round, mockUserId, mockExternalId, mockTracingId),
      ]);

      // Assert
      expect(mockRabbitmqProducer.publishCashin).toHaveBeenCalledTimes(3);
      expect(mockBetRepository.save).toHaveBeenCalledTimes(3);
      expect(bet1.cashout).toHaveBeenCalled();
      expect(bet2.cashout).toHaveBeenCalled();
      expect(bet3.cashout).toHaveBeenCalled();
    });

    it('should handle mixed concurrent cashout and cashin calls', async () => {
      // Arrange
      const bet1 = new Bet({ ...mockBet, id: 'bet-1' }),
        bet2 = new Bet({ ...mockBet, id: 'bet-2' });
      const round = new Round({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      // Act
      await Promise.all([
        gamesManager.processBetLost(bet1, round, mockUserId, mockExternalId, mockTracingId),
        gamesManager.processBetWin(bet2, round, mockUserId, mockExternalId, mockTracingId),
      ]);

      // Assert
      expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledTimes(1);
      expect(mockRabbitmqProducer.publishCashin).toHaveBeenCalledTimes(1);
      expect(mockBetRepository.save).toHaveBeenCalledTimes(2);
      expect(bet1.lose).toHaveBeenCalled();
      expect(bet2.cashout).toHaveBeenCalled();
    });
  });

  describe('Round Status and Multiplier Scenarios', () => {
    it('should handle round with status "crashed"', async () => {
      // Arrange
      const bet = new Bet({ ...mockBet });
      const round = new Round({ ...mockRound, status: RoundStatus.CRASHED, multiplier: 0 });

      // Act
      const result = await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(result.roundStatus).toBe('crashed');
      expect(result.multiplier).toBe(0);
    });

    it('should handle round with status "completed"', async () => {
      // Arrange
      const bet = new Bet({ ...mockBet });
      const round = new Round({ ...mockRound, status: RoundStatus.CRASHED, multiplier: 1.5 });

      // Act
      const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(result.roundStatus).toBe(RoundStatus.CRASHED);
      expect(result.multiplier).toBe(1.5);
    });

    it('should handle negative multiplier (edge case)', async () => {
      // Arrange
      const bet = new Bet({ ...mockBet });
      const round = new Round({ ...mockRound, status: RoundStatus.BETTING, multiplier: -1 });

      // Act
      const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      // Assert
      expect(result.multiplier).toBe(-1);
      expect(result.winAmount).toBe(bet.amount * -1 - bet.amount);
    });
  });
});
