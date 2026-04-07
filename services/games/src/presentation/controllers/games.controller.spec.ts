import { IRoundRepository } from '@/domain/orm/repositories/round.repository';
import { CurrentRoundUseCase } from '../usecases/current-round.usecase';
import { IBetRepository } from '@/domain/orm/repositories/bet.repository';
import { HistoryRoundUsecase } from '../usecases/history-round.usecase';
import { VerifyRoundUsecase } from '../usecases/verify-round.usecase';
import { IProvablyFairService } from '@/domain/core/provably-fair/provably-fair.service';
import { BetUseCase } from '../usecases/bet.usecase';
import { IRabbitmqProducerService } from '@/domain/rabbitmq/rabbitmq.producer';
import { IWalletProxy } from '@/domain/proxy/wallet.proxy';
import { type Request } from 'express';
import { GamesController } from './games.controller';
import { GetMyBetsUseCase } from '../usecases/my-bets.usecase';
import { CashOutUsecase } from '../usecases/cashout.usecase';
import { GamesManager } from '../manager/games.manager';
import { RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';
import { BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';

describe('GamesController', () => {
  const mockRoundRepository = {
    findByRoundId: jest.fn(),
    findCurrentBettingRound: jest.fn(),
    findCurrentRunningRound: jest.fn(),
    findRoundWithBets: jest.fn(),
    findRoundsHistory: jest.fn(),
    saveRound: jest.fn(),
    createRound: jest.fn(),
  } as jest.Mocked<IRoundRepository>;

  const mockBetRepository = {
    setPendingBetsToLost: jest.fn(),
    save: jest.fn(),
    findByFilters: jest.fn(),
    findPeddingBets: jest.fn(),
    findLooserBetsByRoundId: jest.fn(),
    createBet: jest.fn(),
    findUserBetsHistory: jest.fn(),
  } as jest.Mocked<IBetRepository>;

  const mockProvablyFairService = {
    generateNewSeed: jest.fn(),
    getActiveSeed: jest.fn(),
    getNextSeedForRound: jest.fn(),
    incrementNonce: jest.fn(),
    calculateCrashPoint: jest.fn(),
    verifyRound: jest.fn(),
    setSeedAsUsed: jest.fn(),
    rotateSeed: jest.fn(),
    getUserSeedsHistory: jest.fn(),
    getProvablyFairDataForRound: jest.fn(),
  } as jest.Mocked<IProvablyFairService>;

  const mockRabbitmqProducer = {
    publishCashin: jest.fn(),
    publishCashout: jest.fn(),
    publishReserve: jest.fn(),
  } as jest.Mocked<IRabbitmqProducerService>;

  const mockWalletProxy = {
    getUserBalance: jest.fn(),
  } as jest.Mocked<IWalletProxy>;

  const gameManager = new GamesManager(mockBetRepository, mockRabbitmqProducer);

  const request = {} as jest.Mocked<Request>;
  const currenteRoundUsecase = new CurrentRoundUseCase(mockRoundRepository);
  const historyRoundUsecase = new HistoryRoundUsecase(mockRoundRepository);
  const verifyRoundUsecase = new VerifyRoundUsecase(mockProvablyFairService);
  const getMyBetsUsecase = new GetMyBetsUseCase(request, mockBetRepository);
  const betUsecase = new BetUseCase(
    request,
    mockBetRepository,
    mockRoundRepository,
    mockWalletProxy,
    mockRabbitmqProducer,
  );
  const cashoutUsecase = new CashOutUsecase(mockBetRepository, mockWalletProxy, request, gameManager);

  const controller = new GamesController(
    currenteRoundUsecase,
    historyRoundUsecase,
    verifyRoundUsecase,
    getMyBetsUsecase,
    betUsecase,
    cashoutUsecase,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('sucess scenarios', () => {
    it('shoukd get health check', async () => {
      const response = await controller.check();
      expect(response).toBeDefined();
    });

    it('shoukd get current round', async () => {
      mockRoundRepository.findCurrentBettingRound.mockResolvedValue({} as any);
      const response = await controller.getCurrentRound();
      expect(response).toBeDefined();
    });

    it('shoukd get round history', async () => {
      mockRoundRepository.findRoundsHistory.mockResolvedValue([[], 10] as any);
      const response = await controller.getRoundHistory({ page: 1, limit: 10 });
      expect(response).toBeDefined();
    });

    it('shoukd verify round', async () => {
      mockProvablyFairService.verifyRound.mockResolvedValue({} as any);
      mockProvablyFairService.getProvablyFairDataForRound.mockResolvedValue({
        serverSeed: 'string',
        serverSeedHash: 'string',
        clientSeed: 'string',
        nonce: 1,
        id: 'string',
        createdAt: new Date(),
        usedAt: null,
        isUsed: false,
      });
      const response = await controller.verifyRound({} as any);
      expect(response).toBeDefined();
    });

    it('shoukd get my bets', async () => {
      mockBetRepository.findByFilters.mockResolvedValue([[], 10] as any);
      mockBetRepository.findUserBetsHistory.mockResolvedValue([[], 10] as any);
      const response = await controller.getMyBets({ page: 1, limit: 10 });
      expect(response).toBeDefined();
    });

    it('shoukd bet', async () => {
      mockRoundRepository.findByRoundId.mockResolvedValue({
        status: RoundStatus.RUNNING,
        isBettingPhase: () => true,
      } as any);
      mockWalletProxy.getUserBalance.mockResolvedValue({
        success: true,
        data: {
          id: 'string',
          userId: 'string',
          balance: 10,
          balanceInCents: 1000,
          createdAt: 'string',
          updatedAt: 'string',
        },
        timestamp: 'string',
        tracingId: 'string',
      });
      mockBetRepository.createBet.mockResolvedValue({} as any);
      mockRabbitmqProducer.publishReserve.mockResolvedValue({} as any);
      const response = await controller.placeBet({ roundId: 'string', amount: 1 });
      expect(response).toBeDefined();
    });

    it('should cashout', async () => {
      mockBetRepository.findByFilters.mockResolvedValue({
        round: {
          isCrashed: () => true,
        },
        status: BetStatus.PENDING,
        lose: () => {},
      } as any);
      mockBetRepository.setPendingBetsToLost.mockResolvedValue({} as any);
      mockWalletProxy.getUserBalance.mockResolvedValue({
        success: true,
        data: {
          id: 'string',
          userId: 'string',
          balance: 10,
          balanceInCents: 1000,
          createdAt: 'string',
          updatedAt: 'string',
        },
        timestamp: 'string',
        tracingId: 'string',
      });
      mockRabbitmqProducer.publishCashout.mockResolvedValue({} as any);
      const response = await controller.cashout({ betId: 'string' });
      expect(response).toBeDefined();
    });
  });
  // describe('failure scenarios', () => {});
});
