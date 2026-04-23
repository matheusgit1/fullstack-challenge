import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { BetUseCase } from './bet.usecase';
import { BetRequestDto, BetResponseDto } from '../dtos/request/bet-request.dto';
import { BET_REPOSITORY, IBetRepository } from '@/domain/orm/repositories/bet.repository';
import { IRoundRepository, ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';
import { IWalletProxy, WALLET_PROXY } from '@/domain/proxy/wallet.proxy';
import { IRabbitmqProducerService, RABBITMQ_PRODUCER_SERVICE } from '@/domain/rabbitmq/rabbitmq.producer';
import { BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';
import { TransactionSource } from '@/domain/rabbitmq/rabbitmq.producer';
import { GamesManager } from '../manager/games.manager';
import { genWallet } from '@/util-teste/proxy/gen-wallet';
import { genRound } from '@/util-teste/entitites/gen-round';
import { RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';
import { genBets } from '@/util-teste/entitites/gen-bets';

describe('BetUseCase', () => {
  const mockBetRepository: jest.Mocked<IBetRepository> = {
    createBet: jest.fn(),
    setPendingBetsToLost: jest.fn(),
    save: jest.fn(),
    findBetByFilters: jest.fn(),
    findPeddingBets: jest.fn(),
    findLooserBetsByRoundId: jest.fn(),
    findUserBetsHistory: jest.fn(),
  };

  const mockRoundRepository: jest.Mocked<IRoundRepository> = {
    findByRoundId: jest.fn(),
    findCurrentBettingRound: jest.fn(),
    findCurrentRunningRound: jest.fn(),
    findRoundWithBets: jest.fn(),
    findRoundsHistory: jest.fn(),
    saveRound: jest.fn(),
    createRound: jest.fn(),
  };

  const mockWalletProxy: jest.Mocked<IWalletProxy> = {
    getUserBalance: jest.fn(),
  };

  const mockRabbitmqProducer: jest.Mocked<IRabbitmqProducerService> = {
    publishReserve: jest.fn(),
    publishCashin: jest.fn(),
    publishCashout: jest.fn(),
  };

  const mockUser = {
    sub: 'user-123',
  };

  const mockToken = 'mock-jwt-token';
  const mockHash = 'mock-trace-hash';

  const mockRequest = {
    user: mockUser,
    token: mockToken,
    hash: mockHash,
  } as any;

  const mockEvetEmitter = {
    emit: jest.fn(),
  } as any;

  const gameManager = new GamesManager(mockBetRepository, mockRabbitmqProducer, mockEvetEmitter);

  const betUseCase = new BetUseCase(mockRequest, mockBetRepository, mockRoundRepository, mockWalletProxy, gameManager);

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    jest.clearAllMocks();
  });

  describe('Success Scenarios', () => {
    it('should create a bet successfully when all conditions are met', async () => {
      const dto = new BetRequestDto({
        amount: 100,
        roundId: 'round-123',
      });

      const userBalance = genWallet({ balanceInCents: dto.amount });

      const mockRound = genRound({
        id: dto.roundId,
        status: RoundStatus.BETTING,
      });

      const mockCreatedBet = genBets({
        userId: mockUser.sub,
        roundId: dto.roundId,
        amount: dto.amount,
        status: BetStatus.PENDING,
        createdAt: new Date(),
      });

      mockWalletProxy.getUserBalance.mockResolvedValueOnce(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValueOnce(mockRound);
      mockBetRepository.createBet.mockResolvedValueOnce(mockCreatedBet);
      mockRabbitmqProducer.publishReserve.mockResolvedValueOnce(undefined);
      const result = await betUseCase.handler(dto);

      expect(mockWalletProxy.getUserBalance).toHaveBeenCalledWith(mockToken);
      expect(mockRoundRepository.findByRoundId).toHaveBeenCalledWith(dto.roundId);
      expect(mockBetRepository.createBet).toHaveBeenCalledWith({
        userId: mockUser.sub,
        roundId: dto.roundId,
        amount: dto.amount,
        status: BetStatus.PENDING,
      });
      expect(mockRabbitmqProducer.publishReserve).toHaveBeenCalledWith({
        cashType: TransactionSource.BET_RESERVE,
        userId: mockUser.sub,
        amount: dto.amount,
        timestamp: expect.any(String),
        externalId: mockCreatedBet.id,
        tracingId: mockHash,
      });
      expect(result).toBeInstanceOf(BetResponseDto);
      expect(result.bet.id).toBe(mockCreatedBet.id);
      expect(result.bet.amount).toBe(dto.amount);
      expect(result.bet.status).toBe(BetStatus.PENDING);
      expect(result.newBalance).toBe(userBalance.data.balanceInCents - dto.amount);
      expect(result.roundId).toBe(mockRound.id);
    });

    it('should handle anonymous user when user is not present in request', async () => {
      mockRequest.user = undefined;

      const dto = new BetRequestDto({
        amount: 50,
        roundId: 'round-456',
      });

      const userBalance = genWallet({ balanceInCents: dto.amount });

      const mockRound = genRound({
        id: dto.roundId,
        status: RoundStatus.BETTING,
      });

      const mockCreatedBet = genBets({
        roundId: dto.roundId,
        amount: dto.amount,
        status: BetStatus.PENDING,
        createdAt: new Date(),
      });

      mockWalletProxy.getUserBalance.mockResolvedValueOnce(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValueOnce(mockRound);
      mockBetRepository.createBet.mockResolvedValueOnce(mockCreatedBet);

      const result = await betUseCase.handler(dto);

      // Assert
      expect(mockBetRepository.createBet).toHaveBeenCalledWith({
        userId: 'Anonymous',
        roundId: dto.roundId,
        amount: dto.amount,
        status: BetStatus.PENDING,
      });
      expect(result.bet.userId).toBe('Anonymous');
    });

    it('should handle exact balance match (user has exactly the bet amount)', async () => {
      const dto: BetRequestDto = {
        amount: 500,
        roundId: 'round-789',
      };

      mockWalletProxy.getUserBalance.mockResolvedValueOnce(genWallet({ balanceInCents: dto.amount }));
      mockRoundRepository.findByRoundId.mockResolvedValueOnce(genRound({ status: RoundStatus.BETTING }));
      mockBetRepository.createBet.mockResolvedValueOnce(genBets({ status: BetStatus.PENDING }));

      const result = await betUseCase.handler(dto);

      expect(result.newBalance).toBe(0);
      expect(result.bet.amount).toBe(500);
    });
  });

  describe('Error Scenarios', () => {
    it('should throw ConflictException when user has insufficient balance', async () => {
      const dto: BetRequestDto = {
        amount: 1000,
        roundId: 'round-123',
      };

      mockWalletProxy.getUserBalance.mockResolvedValueOnce(genWallet({ balanceInCents: dto.amount - 100 }));

      await expect(betUseCase.handler(dto)).rejects.toThrow(ConflictException);

      expect(mockRoundRepository.findByRoundId).not.toHaveBeenCalled();
      expect(mockBetRepository.createBet).not.toHaveBeenCalled();
      expect(mockRabbitmqProducer.publishReserve).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when round does not exist', async () => {
      const dto: BetRequestDto = {
        amount: 100,
        roundId: 'non-existent-round',
      };

      mockWalletProxy.getUserBalance.mockResolvedValueOnce(genWallet({ balanceInCents: dto.amount }));
      mockRoundRepository.findByRoundId.mockResolvedValueOnce(null);

      await expect(betUseCase.handler(dto)).rejects.toThrow();
      await expect(betUseCase.handler(dto)).rejects.toThrow();

      expect(mockBetRepository.createBet).not.toHaveBeenCalled();
      expect(mockRabbitmqProducer.publishReserve).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when betting phase is closed', async () => {
      const dto = new BetRequestDto({
        amount: 100,
        roundId: 'round-123',
      });

      mockWalletProxy.getUserBalance.mockResolvedValueOnce(genWallet({ balanceInCents: dto.amount + 100 }));
      mockRoundRepository.findByRoundId.mockResolvedValueOnce(
        genRound({ id: dto.roundId, status: RoundStatus.RUNNING }),
      );

      await expect(betUseCase.handler(dto)).rejects.toThrow();

      expect(mockBetRepository.createBet).not.toHaveBeenCalled();
      expect(mockRabbitmqProducer.publishReserve).not.toHaveBeenCalled();
    });

    it('should propagate error when wallet proxy service fails', async () => {
      const dto = {
        amount: 100,
        roundId: 'round-123',
      };

      const walletError = new Error('Wallet service unavailable');
      mockWalletProxy.getUserBalance.mockRejectedValueOnce(walletError);

      await expect(betUseCase.handler(dto)).rejects.toThrow('Wallet service unavailable');

      expect(mockRoundRepository.findByRoundId).not.toHaveBeenCalled();
      expect(mockBetRepository.createBet).not.toHaveBeenCalled();
    });

    it('should propagate error when round repository fails', async () => {
      const dto = {
        amount: 100,
        roundId: 'round-123',
      };

      const userBalance = genWallet({ balanceInCents: 500 });

      const roundError = new Error('Database connection failed');
      mockWalletProxy.getUserBalance.mockResolvedValueOnce(userBalance);
      mockRoundRepository.findByRoundId.mockRejectedValueOnce(roundError);

      await expect(betUseCase.handler(dto)).rejects.toThrow('Database connection failed');

      expect(mockBetRepository.createBet).not.toHaveBeenCalled();
    });

    it('should propagate error when bet repository fails', async () => {
      const dto: BetRequestDto = {
        amount: 100,
        roundId: 'round-123',
      };

      const userBalance = genWallet({ balanceInCents: 500 });

      const betError = new Error('Failed to create bet');
      mockWalletProxy.getUserBalance.mockResolvedValueOnce(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValueOnce(genRound({ status: RoundStatus.BETTING }));
      mockBetRepository.createBet.mockRejectedValueOnce(betError);

      await expect(betUseCase.handler(dto)).rejects.toThrow('Failed to create bet');

      expect(mockRabbitmqProducer.publishReserve).not.toHaveBeenCalled();
    });

    it('should propagate error when rabbitmq producer fails', async () => {
      const dto: BetRequestDto = {
        amount: 100,
        roundId: 'round-123',
      };

      const userBalance = genWallet({ balanceInCents: 500 });

      const mockRound = genRound({
        status: RoundStatus.BETTING,
      });

      const mockCreatedBet = genBets({
        id: 'bet-123',
        userId: mockUser.sub,
        roundId: dto.roundId,
        amount: dto.amount,
        status: BetStatus.PENDING,
        createdAt: new Date(),
      });

      const rabbitError = new Error('RabbitMQ connection failed');
      mockWalletProxy.getUserBalance.mockResolvedValueOnce(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValueOnce(mockRound);
      mockBetRepository.createBet.mockResolvedValueOnce(mockCreatedBet);
      mockRabbitmqProducer.publishReserve.mockRejectedValueOnce(rabbitError);

      await expect(betUseCase.handler(dto)).rejects.toThrow('RabbitMQ connection failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount bet', async () => {
      const dto: BetRequestDto = {
        amount: 0,
        roundId: 'round-123',
      };

      const userBalance = genWallet({ balanceInCents: 500 });

      const mockRound = genRound({
        id: dto.roundId,
        status: RoundStatus.BETTING,
      });

      const mockCreatedBet = genBets({
        userId: mockUser.sub,
        roundId: dto.roundId,
        amount: 0,
        status: BetStatus.PENDING,
        createdAt: new Date(),
      });

      mockWalletProxy.getUserBalance.mockResolvedValueOnce(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValueOnce(mockRound);
      mockBetRepository.createBet.mockResolvedValueOnce(mockCreatedBet);

      const result = await betUseCase.handler(dto);

      expect(result.bet.amount).toBe(0);
      expect(result.newBalance).toBe(500);
    });

    it('should handle missing hash in request', async () => {
      mockRequest.hash = undefined;

      const dto = new BetRequestDto({
        amount: 100,
        roundId: 'round-123',
      });

      const userBalance = genWallet({ balanceInCents: 500 });

      const mockRound = genRound({
        id: 'round-123',
        isBettingPhase: jest.fn().mockReturnValueOnce(true),
      });

      const mockCreatedBet = genBets({
        userId: mockUser.sub,
        roundId: dto.roundId,
        amount: dto.amount,
        status: BetStatus.PENDING,
        createdAt: new Date(),
      });

      mockWalletProxy.getUserBalance.mockResolvedValueOnce(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValueOnce(mockRound);
      mockBetRepository.createBet.mockResolvedValueOnce(mockCreatedBet);

      await betUseCase.handler(dto);

      expect(mockRabbitmqProducer.publishReserve).toHaveBeenCalledWith(
        expect.objectContaining({
          tracingId: undefined,
        }),
      );
    });

    it('should handle missing token in request', async () => {
      mockRequest.token = undefined;

      const dto: BetRequestDto = {
        amount: 100,
        roundId: 'round-123',
      };

      mockWalletProxy.getUserBalance.mockRejectedValueOnce(new Error('No token provided'));

      await expect(betUseCase.handler(dto)).rejects.toThrow('No token provided');
      expect(mockWalletProxy.getUserBalance).toHaveBeenCalledWith(undefined);
    });

    it('should use correct timestamp format in rabbitmq message', async () => {
      const dto: BetRequestDto = {
        amount: 100,
        roundId: 'round-123',
      };
      const mockRound = genRound({
        id: 'round-123',
        isBettingPhase: jest.fn().mockReturnValueOnce(true),
      });

      const mockCreatedBet = genBets({
        id: 'bet-123',
        userId: mockUser.sub,
        roundId: dto.roundId,
        amount: dto.amount,
        status: BetStatus.PENDING,
        createdAt: new Date(),
      });

      const beforeCall = new Date();
      mockWalletProxy.getUserBalance.mockResolvedValueOnce(genWallet({ balanceInCents: 500, balance: 500 }));
      mockRoundRepository.findByRoundId.mockResolvedValueOnce(mockRound);
      mockBetRepository.createBet.mockResolvedValueOnce(mockCreatedBet);

      await betUseCase.handler(dto);

      const publishCall = mockRabbitmqProducer.publishReserve.mock.calls[0][0];
      expect(publishCall.timestamp).toBeDefined();
      const timestamp = new Date(publishCall.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    });
  });
});
