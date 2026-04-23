import { Test, TestingModule } from '@nestjs/testing';
import { GamesManager } from './games.manager';
import { BET_REPOSITORY } from '@/domain/orm/repositories/bet.repository';
import { RABBITMQ_PRODUCER_SERVICE, TransactionSource } from '@/domain/rabbitmq/rabbitmq.producer';
import { Bet, BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';
import { CashoutResponseDto } from '../dtos/request/cashout-request.dto';
import { Round, RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';
import { genRound } from '@/util-teste/entitites/gen-round';
import { genBets } from '@/util-teste/entitites/gen-bets';

describe('GamesManager', () => {
  let gamesManager: GamesManager;
  let mockBetRepository: jest.Mocked<any>;
  let mockRabbitmqProducer: jest.Mocked<any>;
  let mockEventEmitter = {
    emit: jest.fn(),
  } as any;

  const mockUserId = 'user-123';
  const mockExternalId = 'external-456';
  const mockTracingId = 'trace-789';

  const mockRound = genRound({
    id: 'round-123',
    status: RoundStatus.BETTING,
    multiplier: 1.5,
  });

  const mockBet = genBets({
    id: 'bet-123',
    status: BetStatus.PENDING,
    amount: 100,
  });

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

  beforeEach(async () => {
    gamesManager = new GamesManager(mockBetRepository, mockRabbitmqProducer, mockEventEmitter);
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    jest.clearAllMocks();
  });

  describe('processCashout - Success Scenarios', () => {
    it('should process cashout successfully when round crashes', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.RUNNING,
      });

      const result = await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledWith({
        cashType: TransactionSource.BET_LOST,
        userId: mockUserId,
        timestamp: expect.any(String),
        externalId: mockExternalId,
        tracingId: mockTracingId,
      });

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
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 0,
      });

      const result = await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      expect(result.multiplier).toBe(0);
      expect(result.winAmount).toBe(bet.amount);
      expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalled();
    });

    it('should process cashout with very large multiplier', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 999999.99,
      });

      const result = await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      expect(result.multiplier).toBe(999999.99);
      expect(result.winAmount).toBe(bet.amount);
    });

    it('should process cashout with zero amount bet', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 0,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 999999.99,
      });

      const result = await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      expect(result.winAmount).toBe(0);
      expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalled();
    });

    it('should throw error if betting pendding', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.LOST,
        amount: 0,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 999999.99,
      });

      await expect(
        gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId),
      ).rejects.toThrow();
    });
  });

  describe('processCashin - Success Scenarios', () => {
    it('should process bet win successfully when round is running', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 0,
      });

      const round = genRound({
        ...mockRound,
        status: RoundStatus.RUNNING,
        multiplier: 2.5,
      });

      const expectedWinAmount = bet.amount * round.multiplier - bet.amount;

      const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      expect(mockRabbitmqProducer.publishCashin).toHaveBeenCalledWith({
        cashType: TransactionSource.BET_PLACED,
        userId: mockUserId,
        multiplier: round.multiplier,
        timestamp: expect.any(String),
        externalId: mockExternalId,
        tracingId: mockTracingId,
      });

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
        const bet = genBets({
          ...mockBet,
          status: BetStatus.PENDING,
          amount: testCase.amount,
        });
        const round = genRound({
          ...mockRound,
          status: RoundStatus.RUNNING,
          multiplier: testCase.multiplier,
        });
        const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);
        expect(result.winAmount).toBe(testCase.expectedWin);
      }
    });

    it('should handle cashin with integer multiplier', async () => {
      const expectedWinAmount = 400; // 100 * 5 - 100 = 400
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 5,
      });

      const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      expect(result.winAmount).toBe(expectedWinAmount);
    });

    it('should handle cashin with decimal multiplier', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 100,
      });

      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });
      const expectedWinAmount = 75;

      const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      expect(result.winAmount).toBe(expectedWinAmount);
    });
  });

  describe('processCashout - Error Scenarios', () => {
    it('should throw error when rabbitmq publishCashout fails', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 100,
      });

      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });
      const rabbitError = new Error('RabbitMQ connection failed');
      mockRabbitmqProducer.publishCashout.mockRejectedValueOnce(rabbitError);

      await expect(gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId)).rejects.toThrow(
        'RabbitMQ connection failed',
      );

      expect(mockBetRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when bet.lose is called but save fails', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 100,
      });

      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      const saveError = new Error('Database save failed');
      mockBetRepository.save.mockRejectedValueOnce(saveError);

      await expect(gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId)).rejects.toThrow(
        'Database save failed',
      );

      expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalled();
    });
  });

  describe('processCashin - Error Scenarios', () => {
    it('should throw error when rabbitmq publishCashin fails', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });
      const rabbitError = new Error('RabbitMQ connection failed');
      mockRabbitmqProducer.publishCashin.mockRejectedValueOnce(rabbitError);

      await expect(gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId)).rejects.toThrow(
        'RabbitMQ connection failed',
      );

      expect(mockBetRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when bet.cashout is called but save fails', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });
      const saveError = new Error('Database save failed');
      mockBetRepository.save.mockRejectedValueOnce(saveError);

      await expect(gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId)).rejects.toThrow(
        'Database save failed',
      );

      expect(mockRabbitmqProducer.publishCashin).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Data Integrity', () => {
    it('should use current timestamp for cashout', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });
      const beforeCall = new Date();

      const result = await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      const publishCall = mockRabbitmqProducer.publishCashout.mock.calls[0][0];
      const timestamp = new Date(publishCall.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(result.bet.cashedOutAt).toBeInstanceOf(Date);
    });

    it('should use current timestamp for cashin', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });
      const beforeCall = new Date();

      const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      const publishCall = mockRabbitmqProducer.publishCashin.mock.calls[0][0];
      const timestamp = new Date(publishCall.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(result.bet.cashedOutAt).toBeInstanceOf(Date);
    });

    it('should handle undefined tracingId', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledWith(
        expect.objectContaining({
          tracingId: expect.anything(),
        }),
      );
    });

    it('should handle empty externalId', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      await gamesManager.processBetWin(bet, round, mockUserId, '', mockTracingId);

      expect(mockRabbitmqProducer.publishCashin).toHaveBeenCalledWith(
        expect.objectContaining({
          externalId: '',
        }),
      );
    });
  });

  describe('Return Type Validation', () => {
    it('should return CashoutResponseDto for cashout', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      const result = await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      expect(result).toBeInstanceOf(CashoutResponseDto);
      expect(result).toHaveProperty('bet');
      expect(result).toHaveProperty('multiplier');
      expect(result).toHaveProperty('winAmount');
      expect(result).toHaveProperty('roundStatus');
    });

    it('should return CashoutResponseDto for cashin', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      expect(result).toBeInstanceOf(CashoutResponseDto);
      expect(result).toHaveProperty('bet');
      expect(result).toHaveProperty('multiplier');
      expect(result).toHaveProperty('winAmount');
      expect(result).toHaveProperty('roundStatus');
    });

    it('should have correct bet structure in response', async () => {
      const bet = genBets({
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      const result = await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

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
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      expect(mockBetRepository.save).toHaveBeenCalledTimes(1);
      expect(mockBetRepository.save).toHaveBeenCalledWith(bet);
    });

    it('should call betRepository.save exactly once for cashin', async () => {
      const bet = genBets({
        ...mockBet,
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

      expect(mockBetRepository.save).toHaveBeenCalledTimes(1);
      expect(mockBetRepository.save).toHaveBeenCalledWith(bet);
    });
  });

  describe('RabbitMQ Message Verification', () => {
    it('should publish correct cashout message structure', async () => {
      const bet = genBets({
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

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
      const bet = genBets({
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);

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
      const bet = genBets({
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      await gamesManager.processBetLost(bet, round, mockUserId, mockExternalId, mockTracingId);

      expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledWith(
        expect.objectContaining({
          cashType: TransactionSource.BET_LOST,
        }),
      );
    });

    it('should use correct cashType for cashin', async () => {
      const bet = genBets({
        status: BetStatus.PENDING,
        amount: 100,
      });
      const round = genRound({
        ...mockRound,
        status: RoundStatus.BETTING,
        multiplier: 1.75,
      });

      await gamesManager.processBetWin(bet, round, mockUserId, mockExternalId, mockTracingId);
      expect(mockRabbitmqProducer.publishCashin).toHaveBeenCalledWith(
        expect.objectContaining({
          cashType: TransactionSource.BET_PLACED,
        }),
      );
    });
  });
});
