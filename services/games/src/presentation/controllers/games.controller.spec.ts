import { IRoundRepository } from '@/domain/orm/repositories/round.repository';
import { CurrentRoundUseCase } from '../usecases/current-round.usecase';
import { IBetRepository } from '@/domain/orm/repositories/bet.repository';
import { HistoryRoundUsecase } from '../usecases/history-round.usecase';
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
import { AuditRoundUsecase } from '../usecases/audit-round.usecase';
import { genRound } from '@/util-teste/entitites/gen-round';
import { genBets } from '@/util-teste/entitites/gen-bets';
import { genProvablyFair } from '@/util-teste/entitites/gen-provably-fair';
import { ProvablyFairUtil } from '@/application/game/provably-fair/provably-fair.util';

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
    findBetByFilters: jest.fn(),
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
    getProvablyFairRound: jest.fn(),
  } as jest.Mocked<IProvablyFairService>;

  const mockRabbitmqProducer = {
    publishCashin: jest.fn(),
    publishCashout: jest.fn(),
    publishReserve: jest.fn(),
  } as jest.Mocked<IRabbitmqProducerService>;

  const mockWalletProxy = {
    getUserBalance: jest.fn(),
  } as jest.Mocked<IWalletProxy>;

  const mockEventEmmiter = {
    emit: jest.fn(),
  } as any;

  const gameManager = new GamesManager(mockBetRepository, mockRabbitmqProducer, mockEventEmmiter);

  const request = { user: { sub: 'userId' }, hash: 'test-hash-123', token: 'test-token-123' } as jest.Mocked<Request>;
  const currenteRoundUsecase = new CurrentRoundUseCase(mockRoundRepository);
  const historyRoundUsecase = new HistoryRoundUsecase(mockRoundRepository);
  const getMyBetsUsecase = new GetMyBetsUseCase(request, mockBetRepository);
  const betUsecase = new BetUseCase(
    request,
    mockBetRepository,
    mockRoundRepository,
    mockWalletProxy,
    gameManager,
    mockRabbitmqProducer,
  );
  const provablyFairValidator = new ProvablyFairUtil();
  const auditRoundUsecase = new AuditRoundUsecase(mockProvablyFairService, mockRoundRepository, provablyFairValidator);
  const cashoutUsecase = new CashOutUsecase(mockBetRepository, request, gameManager);

  const controller = new GamesController(
    currenteRoundUsecase,
    historyRoundUsecase,
    getMyBetsUsecase,
    betUsecase,
    cashoutUsecase,
    auditRoundUsecase,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    jest.clearAllMocks();
  });

  describe('sucess scenarios', () => {
    it('shoukd get health check', async () => {
      const response = await controller.check();
      expect(response).toBeDefined();
    });

    it('shoukd get current round', async () => {
      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(genRound({ status: RoundStatus.RUNNING }));
      const response = await controller.getCurrentRound();
      expect(response).toBeDefined();
    });

    it('shoukd get round history', async () => {
      mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([[genRound({ status: RoundStatus.RUNNING })], 10]);
      const response = await controller.getRoundHistory({ page: 1, limit: 10 });
      expect(response).toBeDefined();
    });

    it('shoukd verify round', async () => {
      const fairRound = genProvablyFair({
        id: 'f3f71d05-16ec-4358-b222-90a08190b7cb',
        clientSeed: 'jungle_1775850197739',
        serverSeed: '21345f69852a42847e80d5d5ce00a9c372c54a092adb5bb8b584494848ad1da5',
        serverSeedHash: 'ffcd309389e02b859c111c275d5436f526b4cb1104391e3d1ad2060c0079232e',
        nonce: 0,
        isUsed: true,
        usedAt: new Date('2026-04-10T20:18:15.231Z'),
        createdAt: new Date('2026-04-10T19:43:17.739Z'),
      });
      const round = genRound({
        status: RoundStatus.CRASHED,
        multiplier: 8.01,
        crashPoint: 8.02,
        bettingStartedAt: new Date('2026-04-10T19:43:17.755Z'),
        bettingEndsAt: new Date('2026-04-10T19:43:32.755Z'),
        startedAt: new Date('2026-04-10T19:43:47.766Z'),
        crashedAt: new Date('2026-04-10T20:18:15.231Z'),
        serverSeed: '21345f69852a42847e80d5d5ce00a9c372c54a092adb5bb8b584494848ad1da5',
        serverSeedHash: 'ffcd309389e02b859c111c275d5436f526b4cb1104391e3d1ad2060c0079232e',
        clientSeed: 'jungle_1775850197739',
        nonce: 0,
        createdAt: new Date('2026-04-10T19:43:17.758Z'),
        updatedAt: new Date('2026-04-10T20:18:10.902Z'),
        endedAt: new Date('2026-04-10T20:18:15.231Z'),
      });

      mockProvablyFairService.getProvablyFairRound.mockResolvedValueOnce(fairRound);
      mockRoundRepository.findByRoundId.mockResolvedValueOnce(round);

      const response = await controller.auditRound(round.id);

      expect(response).toBeDefined();
      expect(response.timing.timingIsConsistent).toBeTruthy();
    });

    it('shoukd get my bets', async () => {
      mockBetRepository.findBetByFilters.mockResolvedValueOnce(genBets());
      mockBetRepository.findUserBetsHistory.mockResolvedValueOnce({
        results: [[genBets()], 10],
        totalBetsAmount: 10,
        totalProfit: 10,
        successRate: 10,
      });
      const response = await controller.getMyBets({ page: 1, limit: 10 });
      expect(response).toBeDefined();
    });

    it('should bet', async () => {
      mockRoundRepository.findByRoundId.mockResolvedValueOnce(genRound({ status: RoundStatus.BETTING }));
      mockWalletProxy.getUserBalance.mockResolvedValueOnce({
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
      mockBetRepository.createBet.mockResolvedValueOnce(genBets());
      mockRabbitmqProducer.publishReserve.mockResolvedValueOnce();
      const response = await controller.placeBet({ roundId: 'string', amount: 1 });
      expect(response).toBeDefined();
    });

    it('should process bet win', async () => {
      const round = genRound({ status: RoundStatus.RUNNING, multiplier: 2.5 });
      const bet = genBets({ status: BetStatus.PENDING, amount: 1000, round: round });

      mockRoundRepository.findByRoundId.mockResolvedValueOnce(round);
      mockBetRepository.findBetByFilters.mockResolvedValueOnce(bet);

      mockRabbitmqProducer.publishCashout.mockResolvedValueOnce();
      const response = await controller.cashout({ betId: bet.id });
      expect(response).toBeDefined();
    });

    it('should process bet lost', async () => {
      const round = genRound({ status: RoundStatus.CRASHED, multiplier: 2.5 });
      const bet = genBets({ status: BetStatus.PENDING, amount: 1000, round: round });

      mockRoundRepository.findByRoundId.mockResolvedValueOnce(round);
      mockBetRepository.findBetByFilters.mockResolvedValueOnce(bet);

      mockRabbitmqProducer.publishCashout.mockResolvedValueOnce();
      const response = await controller.cashout({ betId: bet.id });
      expect(response).toBeDefined();
    });

    // it('should throw error if round betting', async () => {
    //   const round = genRound({ status: RoundStatus.BETTING, multiplier: 2.5 });
    //   const bet = genBets({ status: BetStatus.PENDING, amount: 1000, round: round });

    //   mockBetRepository.findByFilters.mockResolvedValueOnce(bet);
    //   await expect(controller.cashout({ betId: bet.id })).rejects.toThrow();
    // });
  });
});
