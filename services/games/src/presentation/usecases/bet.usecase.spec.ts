import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { BetUseCase } from './bet.usecase';
import { BetRequestDto, BetResponseDto } from '../dtos/request/bet-request.dto';
import { BET_REPOSITORY } from '@/domain/orm/repositories/bet.repository';
import { ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';
import { WALLET_PROXY } from '@/domain/proxy/wallet.proxy';
import { RABBITMQ_PRODUCER_SERVICE } from '@/domain/rabbitmq/rabbitmq.producer';
import { BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';
import { TransactionSource } from '@/domain/rabbitmq/rabbitmq.producer';
import { GamesManager } from '../manager/games.manager';

describe('BetUseCase', () => {
  let betUseCase: BetUseCase;
  let mockBetRepository: any;
  let mockRoundRepository: any;
  let mockWalletProxy: any;
  let mockRabbitmqProducer: any;
  let mockRequest: any;

  const mockUser = {
    sub: 'user-123',
  };

  const mockToken = 'mock-jwt-token';
  const mockHash = 'mock-trace-hash';

  beforeEach(async () => {
    mockBetRepository = {
      createBet: jest.fn(),
      setPendingBetsToLost: jest.fn(),
      save: jest.fn(),
      findByFilters: jest.fn(),
      findPeddingBets: jest.fn(),
      findLooserBetsByRoundId: jest.fn(),
      findUserBetsHistory: jest.fn(),
    };

    mockRoundRepository = {
      findByRoundId: jest.fn(),
      findCurrentBettingRound: jest.fn(),
      findCurrentRunningRound: jest.fn(),
      findRoundWithBets: jest.fn(),
      findRoundsHistory: jest.fn(),
      saveRound: jest.fn(),
      createRound: jest.fn(),
    };

    mockWalletProxy = {
      getUserBalance: jest.fn(),
    };

    mockRabbitmqProducer = {
      publishReserve: jest.fn(),
      publishCashin: jest.fn(),
      publishCashout: jest.fn(),
    };

    mockRequest = {
      user: mockUser,
      token: mockToken,
      hash: mockHash,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesManager,
        BetUseCase,
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
        {
          provide: BET_REPOSITORY,
          useValue: mockBetRepository,
        },
        {
          provide: ROUND_REPOSITORY,
          useValue: mockRoundRepository,
        },
        {
          provide: WALLET_PROXY,
          useValue: mockWalletProxy,
        },
        {
          provide: RABBITMQ_PRODUCER_SERVICE,
          useValue: mockRabbitmqProducer,
        },
      ],
    }).compile();

    betUseCase = module.get<BetUseCase>(BetUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Scenarios', () => {
    it('should create a bet successfully when all conditions are met', async () => {
      // Arrange
      const dto: BetRequestDto = {
        amount: 100,
        roundId: 'round-123',
      };

      const userBalance = {
        balanceInCents: 500,
      };

      const mockRound = {
        id: 'round-123',
        isBettingPhase: jest.fn().mockReturnValue(true),
      };

      const mockCreatedBet = {
        id: 'bet-123',
        userId: mockUser.sub,
        roundId: dto.roundId,
        amount: dto.amount,
        status: BetStatus.PENDING,
        createdAt: new Date(),
      };

      mockWalletProxy.getUserBalance.mockResolvedValue(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValue(mockRound);
      mockBetRepository.createBet.mockResolvedValue(mockCreatedBet);
      mockRabbitmqProducer.publishReserve.mockResolvedValue(undefined);

      // Act
      const result = await betUseCase.handler(dto);

      // Assert
      expect(mockWalletProxy.getUserBalance).toHaveBeenCalledWith(mockToken);
      expect(mockRoundRepository.findByRoundId).toHaveBeenCalledWith(dto.roundId);
      expect(mockRound.isBettingPhase).toHaveBeenCalled();
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
      expect(result.newBalance).toBe(userBalance.balanceInCents - dto.amount);
      expect(result.roundId).toBe(mockRound.id);
    });

    it('should handle anonymous user when user is not present in request', async () => {
      // Arrange
      mockRequest.user = undefined;

      const dto: BetRequestDto = {
        amount: 50,
        roundId: 'round-456',
      };

      const userBalance = {
        balanceInCents: 200,
      };

      const mockRound = {
        id: 'round-456',
        isBettingPhase: jest.fn().mockReturnValue(true),
      };

      const mockCreatedBet = {
        id: 'bet-456',
        userId: 'Anonymous',
        roundId: dto.roundId,
        amount: dto.amount,
        status: BetStatus.PENDING,
        createdAt: new Date(),
      };

      mockWalletProxy.getUserBalance.mockResolvedValue(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValue(mockRound);
      mockBetRepository.createBet.mockResolvedValue(mockCreatedBet);

      // Act
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
      // Arrange
      const dto: BetRequestDto = {
        amount: 500,
        roundId: 'round-789',
      };

      const userBalance = {
        balanceInCents: 500,
      };

      const mockRound = {
        id: 'round-789',
        isBettingPhase: jest.fn().mockReturnValue(true),
      };

      const mockCreatedBet = {
        id: 'bet-789',
        userId: mockUser.sub,
        roundId: dto.roundId,
        amount: dto.amount,
        status: BetStatus.PENDING,
        createdAt: new Date(),
      };

      mockWalletProxy.getUserBalance.mockResolvedValue(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValue(mockRound);
      mockBetRepository.createBet.mockResolvedValue(mockCreatedBet);

      // Act
      const result = await betUseCase.handler(dto);

      // Assert
      expect(result.newBalance).toBe(0);
      expect(result.bet.amount).toBe(500);
    });
  });

  describe('Error Scenarios', () => {
    it('should throw ConflictException when user has insufficient balance', async () => {
      // Arrange
      const dto: BetRequestDto = {
        amount: 1000,
        roundId: 'round-123',
      };

      const userBalance = {
        balanceInCents: 500,
      };

      mockWalletProxy.getUserBalance.mockResolvedValue(userBalance);

      // Act & Assert
      await expect(betUseCase.handler(dto)).rejects.toThrow(ConflictException);
      await expect(betUseCase.handler(dto)).rejects.toThrow('Saldo insuficiente');

      expect(mockRoundRepository.findByRoundId).not.toHaveBeenCalled();
      expect(mockBetRepository.createBet).not.toHaveBeenCalled();
      expect(mockRabbitmqProducer.publishReserve).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when round does not exist', async () => {
      // Arrange
      const dto: BetRequestDto = {
        amount: 100,
        roundId: 'non-existent-round',
      };

      const userBalance = {
        balanceInCents: 500,
      };

      mockWalletProxy.getUserBalance.mockResolvedValue(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValue(null);

      // Act & Assert
      await expect(betUseCase.handler(dto)).rejects.toThrow(NotFoundException);
      await expect(betUseCase.handler(dto)).rejects.toThrow('Nenhuma rodada ativa');

      expect(mockBetRepository.createBet).not.toHaveBeenCalled();
      expect(mockRabbitmqProducer.publishReserve).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when betting phase is closed', async () => {
      // Arrange
      const dto: BetRequestDto = {
        amount: 100,
        roundId: 'round-123',
      };

      const userBalance = {
        balanceInCents: 500,
      };

      const mockRound = {
        id: 'round-123',
        isBettingPhase: jest.fn().mockReturnValue(false),
      };

      mockWalletProxy.getUserBalance.mockResolvedValue(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValue(mockRound);

      // Act & Assert
      await expect(betUseCase.handler(dto)).rejects.toThrow(ConflictException);
      await expect(betUseCase.handler(dto)).rejects.toThrow('Fase de aposta encerrada');

      expect(mockBetRepository.createBet).not.toHaveBeenCalled();
      expect(mockRabbitmqProducer.publishReserve).not.toHaveBeenCalled();
    });

    it('should propagate error when wallet proxy service fails', async () => {
      // Arrange
      const dto: BetRequestDto = {
        amount: 100,
        roundId: 'round-123',
      };

      const walletError = new Error('Wallet service unavailable');
      mockWalletProxy.getUserBalance.mockRejectedValue(walletError);

      // Act & Assert
      await expect(betUseCase.handler(dto)).rejects.toThrow('Wallet service unavailable');

      expect(mockRoundRepository.findByRoundId).not.toHaveBeenCalled();
      expect(mockBetRepository.createBet).not.toHaveBeenCalled();
    });

    it('should propagate error when round repository fails', async () => {
      // Arrange
      const dto: BetRequestDto = {
        amount: 100,
        roundId: 'round-123',
      };

      const userBalance = {
        balanceInCents: 500,
      };

      const roundError = new Error('Database connection failed');
      mockWalletProxy.getUserBalance.mockResolvedValue(userBalance);
      mockRoundRepository.findByRoundId.mockRejectedValue(roundError);

      // Act & Assert
      await expect(betUseCase.handler(dto)).rejects.toThrow('Database connection failed');

      expect(mockBetRepository.createBet).not.toHaveBeenCalled();
    });

    it('should propagate error when bet repository fails', async () => {
      // Arrange
      const dto: BetRequestDto = {
        amount: 100,
        roundId: 'round-123',
      };

      const userBalance = {
        balanceInCents: 500,
      };

      const mockRound = {
        id: 'round-123',
        isBettingPhase: jest.fn().mockReturnValue(true),
      };

      const betError = new Error('Failed to create bet');
      mockWalletProxy.getUserBalance.mockResolvedValue(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValue(mockRound);
      mockBetRepository.createBet.mockRejectedValue(betError);

      // Act & Assert
      await expect(betUseCase.handler(dto)).rejects.toThrow('Failed to create bet');

      expect(mockRabbitmqProducer.publishReserve).not.toHaveBeenCalled();
    });

    it('should propagate error when rabbitmq producer fails', async () => {
      // Arrange
      const dto: BetRequestDto = {
        amount: 100,
        roundId: 'round-123',
      };

      const userBalance = {
        balanceInCents: 500,
      };

      const mockRound = {
        id: 'round-123',
        isBettingPhase: jest.fn().mockReturnValue(true),
      };

      const mockCreatedBet = {
        id: 'bet-123',
        userId: mockUser.sub,
        roundId: dto.roundId,
        amount: dto.amount,
        status: BetStatus.PENDING,
        createdAt: new Date(),
      };

      const rabbitError = new Error('RabbitMQ connection failed');
      mockWalletProxy.getUserBalance.mockResolvedValue(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValue(mockRound);
      mockBetRepository.createBet.mockResolvedValue(mockCreatedBet);
      mockRabbitmqProducer.publishReserve.mockRejectedValue(rabbitError);

      // Act & Assert
      await expect(betUseCase.handler(dto)).rejects.toThrow('RabbitMQ connection failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount bet', async () => {
      // Arrange
      const dto: BetRequestDto = {
        amount: 0,
        roundId: 'round-123',
      };

      const userBalance = {
        balanceInCents: 500,
      };

      const mockRound = {
        id: 'round-123',
        isBettingPhase: jest.fn().mockReturnValue(true),
      };

      const mockCreatedBet = {
        id: 'bet-123',
        userId: mockUser.sub,
        roundId: dto.roundId,
        amount: 0,
        status: BetStatus.PENDING,
        createdAt: new Date(),
      };

      mockWalletProxy.getUserBalance.mockResolvedValue(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValue(mockRound);
      mockBetRepository.createBet.mockResolvedValue(mockCreatedBet);

      // Act
      const result = await betUseCase.handler(dto);

      // Assert
      expect(result.bet.amount).toBe(0);
      expect(result.newBalance).toBe(500);
    });

    it('should handle missing hash in request', async () => {
      // Arrange
      mockRequest.hash = undefined;

      const dto: BetRequestDto = {
        amount: 100,
        roundId: 'round-123',
      };

      const userBalance = {
        balanceInCents: 500,
      };

      const mockRound = {
        id: 'round-123',
        isBettingPhase: jest.fn().mockReturnValue(true),
      };

      const mockCreatedBet = {
        id: 'bet-123',
        userId: mockUser.sub,
        roundId: dto.roundId,
        amount: dto.amount,
        status: BetStatus.PENDING,
        createdAt: new Date(),
      };

      mockWalletProxy.getUserBalance.mockResolvedValue(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValue(mockRound);
      mockBetRepository.createBet.mockResolvedValue(mockCreatedBet);

      // Act
      await betUseCase.handler(dto);

      // Assert
      expect(mockRabbitmqProducer.publishReserve).toHaveBeenCalledWith(
        expect.objectContaining({
          tracingId: undefined,
        }),
      );
    });

    it('should handle missing token in request', async () => {
      // Arrange
      mockRequest.token = undefined;

      const dto: BetRequestDto = {
        amount: 100,
        roundId: 'round-123',
      };

      mockWalletProxy.getUserBalance.mockRejectedValue(new Error('No token provided'));

      // Act & Assert
      await expect(betUseCase.handler(dto)).rejects.toThrow('No token provided');
      expect(mockWalletProxy.getUserBalance).toHaveBeenCalledWith(undefined);
    });

    it('should use correct timestamp format in rabbitmq message', async () => {
      // Arrange
      const dto: BetRequestDto = {
        amount: 100,
        roundId: 'round-123',
      };

      const userBalance = {
        balanceInCents: 500,
      };

      const mockRound = {
        id: 'round-123',
        isBettingPhase: jest.fn().mockReturnValue(true),
      };

      const mockCreatedBet = {
        id: 'bet-123',
        userId: mockUser.sub,
        roundId: dto.roundId,
        amount: dto.amount,
        status: BetStatus.PENDING,
        createdAt: new Date(),
      };

      const beforeCall = new Date();
      mockWalletProxy.getUserBalance.mockResolvedValue(userBalance);
      mockRoundRepository.findByRoundId.mockResolvedValue(mockRound);
      mockBetRepository.createBet.mockResolvedValue(mockCreatedBet);

      // Act
      await betUseCase.handler(dto);

      // Assert
      const publishCall = mockRabbitmqProducer.publishReserve.mock.calls[0][0];
      expect(publishCall.timestamp).toBeDefined();
      const timestamp = new Date(publishCall.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    });
  });
});
