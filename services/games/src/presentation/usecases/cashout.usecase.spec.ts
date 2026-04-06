import { ConflictException, GoneException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { CashOutUsecase } from './cashout.usecase';
import { CashoutRequestDto } from '../dtos/request/cashout-request.dto';
import { GamesManager } from '../manager/games.manager';
import { BET_REPOSITORY } from '@/domain/orm/repositories/bet.repository';
import { WALLET_PROXY } from '@/domain/proxy/wallet.proxy';
import { BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';

describe('CashOutUsecase', () => {
  let cashOutUsecase: CashOutUsecase;
  let mockBetRepository: any;
  let mockWalletProxy: any;
  let mockGamesManager: any;
  let mockRequest: any;

  const mockUser = {
    sub: 'user-123',
  };

  const mockToken = 'mock-jwt-token';
  const mockHash = 'mock-trace-hash';

  const mockRound = {
    id: 'round-123',
    isCrashed: jest.fn(),
    isRunning: jest.fn(),
    crashPoint: 2.5,
  };

  const mockBet = {
    id: 'bet-123',
    userId: mockUser.sub,
    roundId: mockRound.id,
    amount: 100,
    status: BetStatus.PENDING,
    round: mockRound,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockBetRepository = {
      findByFilters: jest.fn(),
      setPendingBetsToLost: jest.fn(),
      save: jest.fn(),
      createBet: jest.fn(),
      findUserBetsHistory: jest.fn(),
    };

    mockWalletProxy = {
      getUserBalance: jest.fn(),
      processWalletTransaction: jest.fn(),
    };

    mockGamesManager = {
      processCashout: jest.fn(),
      processCashin: jest.fn(),
    };

    mockRequest = {
      user: mockUser,
      token: mockToken,
      hash: mockHash,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashOutUsecase,
        {
          provide: BET_REPOSITORY,
          useValue: mockBetRepository,
        },
        {
          provide: WALLET_PROXY,
          useValue: mockWalletProxy,
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
        {
          provide: GamesManager,
          useValue: mockGamesManager,
        },
      ],
    }).compile();

    cashOutUsecase = module.get<CashOutUsecase>(CashOutUsecase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Scenarios', () => {
    it('should process cashout when round has crashed', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      const expectedCashoutResult = {
        betId: 'bet-123',
        amount: 250,
        status: 'CASHED_OUT',
      };

      mockBetRepository.findByFilters.mockResolvedValue(mockBet);
      mockRound.isCrashed.mockReturnValue(true);
      mockRound.isRunning.mockReturnValue(false);
      mockGamesManager.processCashout.mockResolvedValue(expectedCashoutResult);

      // Act
      const result = await cashOutUsecase.handler(dto);

      // Assert
      expect(mockBetRepository.findByFilters).toHaveBeenCalledWith({
        where: { id: dto.betId, userId: mockUser.sub },
        relations: ['round'],
      });
      expect(mockRound.isCrashed).toHaveBeenCalled();
      expect(mockGamesManager.processCashout).toHaveBeenCalledWith(
        mockBet,
        mockRound,
        mockUser.sub,
        mockBet.id,
        mockHash,
      );
      expect(mockGamesManager.processCashin).not.toHaveBeenCalled();
      expect(result).toBe(expectedCashoutResult);
    });

    it('should process cashin when round is still running', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      const expectedCashinResult = {
        betId: 'bet-123',
        amount: 100,
        status: 'CASHED_OUT',
      };

      mockBetRepository.findByFilters.mockResolvedValue(mockBet);
      mockRound.isCrashed.mockReturnValue(false);
      mockRound.isRunning.mockReturnValue(true);
      mockGamesManager.processCashin.mockResolvedValue(expectedCashinResult);

      // Act
      const result = await cashOutUsecase.handler(dto);

      // Assert
      expect(mockBetRepository.findByFilters).toHaveBeenCalledWith({
        where: { id: dto.betId, userId: mockUser.sub },
        relations: ['round'],
      });
      expect(mockRound.isRunning).toHaveBeenCalled();
      expect(mockGamesManager.processCashin).toHaveBeenCalledWith(
        mockBet,
        mockRound,
        mockUser.sub,
        mockBet.id,
        mockHash,
      );
      expect(mockGamesManager.processCashout).not.toHaveBeenCalled();
      expect(result).toBe(expectedCashinResult);
    });

    it('should handle anonymous user correctly', async () => {
      // Arrange
      mockRequest.user = undefined;

      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      const anonymousBet = {
        ...mockBet,
        userId: 'anonymous',
      };

      mockBetRepository.findByFilters.mockResolvedValue(anonymousBet);
      mockRound.isCrashed.mockReturnValue(true);
      mockGamesManager.processCashout.mockResolvedValue({ success: true });

      // Act
      await cashOutUsecase.handler(dto);

      // Assert
      expect(mockBetRepository.findByFilters).toHaveBeenCalledWith({
        where: { id: dto.betId, userId: 'anonymous' },
        relations: ['round'],
      });
      expect(mockGamesManager.processCashout).toHaveBeenCalledWith(
        anonymousBet,
        mockRound,
        'anonymous',
        anonymousBet.id,
        mockHash,
      );
    });

    it('should use externalId as bet.id for cashout processing', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      mockBetRepository.findByFilters.mockResolvedValue(mockBet);
      mockRound.isCrashed.mockReturnValue(true);
      mockGamesManager.processCashout.mockResolvedValue({ success: true });

      // Act
      await cashOutUsecase.handler(dto);

      // Assert
      expect(mockGamesManager.processCashout).toHaveBeenCalledWith(
        mockBet,
        mockRound,
        mockUser.sub,
        mockBet.id, // externalId should be bet.id
        mockHash,
      );
    });
  });

  describe('Error Scenarios - Bet Validation', () => {
    it('should throw ConflictException when bet is not found', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'non-existent-bet',
      };

      mockBetRepository.findByFilters.mockResolvedValue(null);

      // Act & Assert
      await expect(cashOutUsecase.handler(dto)).rejects.toThrow(ConflictException);
      await expect(cashOutUsecase.handler(dto)).rejects.toThrow('Nenhuma rodada ou aposta encontrada');

      expect(mockGamesManager.processCashout).not.toHaveBeenCalled();
      expect(mockGamesManager.processCashin).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when bet exists but has no round relation', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      const betWithoutRound = {
        ...mockBet,
        round: null,
      };

      mockBetRepository.findByFilters.mockResolvedValue(betWithoutRound);

      // Act & Assert
      await expect(cashOutUsecase.handler(dto)).rejects.toThrow(ConflictException);
      await expect(cashOutUsecase.handler(dto)).rejects.toThrow('Nenhuma rodada ou aposta encontrada');

      expect(mockGamesManager.processCashout).not.toHaveBeenCalled();
      expect(mockGamesManager.processCashin).not.toHaveBeenCalled();
    });

    it('should throw GoneException when bet status is LOST', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      const lostBet = {
        ...mockBet,
        status: BetStatus.LOST,
      };

      mockBetRepository.findByFilters.mockResolvedValue(lostBet);

      // Act & Assert
      await expect(cashOutUsecase.handler(dto)).rejects.toThrow(GoneException);
      await expect(cashOutUsecase.handler(dto)).rejects.toThrow('Aposta perdida');

      expect(mockGamesManager.processCashout).not.toHaveBeenCalled();
      expect(mockGamesManager.processCashin).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when bet status is CASHED_OUT', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      const cashedOutBet = {
        ...mockBet,
        status: BetStatus.CASHED_OUT,
      };

      mockBetRepository.findByFilters.mockResolvedValue(cashedOutBet);

      // Act & Assert
      await expect(cashOutUsecase.handler(dto)).rejects.toThrow(NotFoundException);
      await expect(cashOutUsecase.handler(dto)).rejects.toThrow('Aposta sacada');

      expect(mockGamesManager.processCashout).not.toHaveBeenCalled();
      expect(mockGamesManager.processCashin).not.toHaveBeenCalled();
    });

    it('should allow PENDING status to continue processing', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      const pendingBet = {
        ...mockBet,
        status: BetStatus.PENDING,
      };

      mockBetRepository.findByFilters.mockResolvedValue(pendingBet);
      mockRound.isCrashed.mockReturnValue(true);
      mockGamesManager.processCashout.mockResolvedValue({ success: true });

      // Act
      await cashOutUsecase.handler(dto);

      // Assert
      expect(mockGamesManager.processCashout).toHaveBeenCalled();
      expect(mockGamesManager.processCashin).not.toHaveBeenCalled();
    });
  });

  describe('Error Scenarios - Round State', () => {
    it('should throw Error when round is neither crashed nor running', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      mockBetRepository.findByFilters.mockResolvedValue(mockBet);
      mockRound.isCrashed.mockReturnValue(false);
      mockRound.isRunning.mockReturnValue(false);

      // Act & Assert
      await expect(cashOutUsecase.handler(dto)).rejects.toThrow('Rodada já finalizada, saque indisponível');

      expect(mockGamesManager.processCashout).not.toHaveBeenCalled();
      expect(mockGamesManager.processCashin).not.toHaveBeenCalled();
    });

    it('should prioritize isCrashed check over isRunning', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      mockBetRepository.findByFilters.mockResolvedValue(mockBet);
      mockRound.isCrashed.mockReturnValue(true);
      mockRound.isRunning.mockReturnValue(true); // Both true, but crashed should take priority
      mockGamesManager.processCashout.mockResolvedValue({ success: true });

      // Act
      await cashOutUsecase.handler(dto);

      // Assert
      expect(mockGamesManager.processCashout).toHaveBeenCalled();
      expect(mockGamesManager.processCashin).not.toHaveBeenCalled();
    });
  });

  describe('Error Scenarios - External Dependencies', () => {
    it('should propagate error when bet repository fails', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      const dbError = new Error('Database connection failed');
      mockBetRepository.findByFilters.mockRejectedValue(dbError);

      // Act & Assert
      await expect(cashOutUsecase.handler(dto)).rejects.toThrow('Database connection failed');

      expect(mockGamesManager.processCashout).not.toHaveBeenCalled();
      expect(mockGamesManager.processCashin).not.toHaveBeenCalled();
    });

    it('should propagate error when gamesManager.processCashout fails', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      mockBetRepository.findByFilters.mockResolvedValue(mockBet);
      mockRound.isCrashed.mockReturnValue(true);

      const managerError = new Error('Failed to process cashout');
      mockGamesManager.processCashout.mockRejectedValue(managerError);

      // Act & Assert
      await expect(cashOutUsecase.handler(dto)).rejects.toThrow('Failed to process cashout');
    });

    it('should propagate error when gamesManager.processCashin fails', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      mockBetRepository.findByFilters.mockResolvedValue(mockBet);
      mockRound.isCrashed.mockReturnValue(false);
      mockRound.isRunning.mockReturnValue(true);

      const managerError = new Error('Failed to process cashin');
      mockGamesManager.processCashin.mockRejectedValue(managerError);

      // Act & Assert
      await expect(cashOutUsecase.handler(dto)).rejects.toThrow('Failed to process cashin');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing hash in request', async () => {
      // Arrange
      mockRequest.hash = undefined;

      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      mockBetRepository.findByFilters.mockResolvedValue(mockBet);
      mockRound.isCrashed.mockReturnValue(true);
      mockGamesManager.processCashout.mockResolvedValue({ success: true });

      // Act
      await cashOutUsecase.handler(dto);

      // Assert
      expect(mockGamesManager.processCashout).toHaveBeenCalledWith(
        mockBet,
        mockRound,
        mockUser.sub,
        mockBet.id,
        undefined,
      );
    });

    it('should handle missing token in request', async () => {
      // Arrange
      mockRequest.token = undefined;

      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      mockBetRepository.findByFilters.mockResolvedValue(mockBet);
      mockRound.isCrashed.mockReturnValue(true);
      mockGamesManager.processCashout.mockResolvedValue({ success: true });

      // Act
      await cashOutUsecase.handler(dto);

      // Assert
      // The token is not directly used in this use case, only passed through to gamesManager
      expect(mockGamesManager.processCashout).toHaveBeenCalled();
    });

    it('should handle bet with different userId than request user', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      const differentUserBet = {
        ...mockBet,
        userId: 'different-user',
      };

      mockBetRepository.findByFilters.mockResolvedValue(differentUserBet);
      mockRound.isCrashed.mockReturnValue(true);
      mockGamesManager.processCashout.mockResolvedValue({ success: true });

      // Act
      await cashOutUsecase.handler(dto);

      // Assert
      // The repository query filters by the request user, so this bet shouldn't be found
      // But if found somehow, it would still process
      expect(mockGamesManager.processCashout).toHaveBeenCalledWith(
        differentUserBet,
        mockRound,
        mockUser.sub,
        differentUserBet.id,
        mockHash,
      );
    });

    it('should handle multiple status codes in getErrorByStatus dictionary', async () => {
      // Test all status scenarios
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      // Test LOST status
      const lostBet = { ...mockBet, status: BetStatus.LOST };
      mockBetRepository.findByFilters.mockResolvedValue(lostBet);
      await expect(cashOutUsecase.handler(dto)).rejects.toThrow(GoneException);

      // Test CASHED_OUT status
      const cashedOutBet = { ...mockBet, status: BetStatus.CASHED_OUT };
      mockBetRepository.findByFilters.mockResolvedValue(cashedOutBet);
      await expect(cashOutUsecase.handler(dto)).rejects.toThrow(NotFoundException);

      // Test PENDING status (should not throw)
      const pendingBet = { ...mockBet, status: BetStatus.PENDING };
      mockBetRepository.findByFilters.mockResolvedValue(pendingBet);
      mockRound.isCrashed.mockReturnValue(true);
      mockGamesManager.processCashout.mockResolvedValue({ success: true });
      await expect(cashOutUsecase.handler(dto)).resolves.toBeDefined();
    });
  });

  describe('Integration Points', () => {
    it('should pass correct parameters to findByFilters', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      mockBetRepository.findByFilters.mockResolvedValue(mockBet);
      mockRound.isCrashed.mockReturnValue(true);
      mockGamesManager.processCashout.mockResolvedValue({ success: true });

      // Act
      await cashOutUsecase.handler(dto);

      // Assert
      expect(mockBetRepository.findByFilters).toHaveBeenCalledTimes(1);
      expect(mockBetRepository.findByFilters).toHaveBeenCalledWith({
        where: { id: dto.betId, userId: mockUser.sub },
        relations: ['round'],
      });
    });

    it('should use the correct externalId format', async () => {
      // Arrange
      const dto: CashoutRequestDto = {
        betId: 'bet-123',
      };

      const customBet = {
        ...mockBet,
        id: 'custom-bet-id-456',
      };

      mockBetRepository.findByFilters.mockResolvedValue(customBet);
      mockRound.isCrashed.mockReturnValue(true);
      mockGamesManager.processCashout.mockResolvedValue({ success: true });

      // Act
      await cashOutUsecase.handler(dto);

      // Assert
      expect(mockGamesManager.processCashout).toHaveBeenCalledWith(
        customBet,
        mockRound,
        mockUser.sub,
        'custom-bet-id-456', // externalId should match bet.id
        mockHash,
      );
    });
  });
});
