import { IProvablyFairService } from '@/domain/core/provably-fair/provably-fair.service';
import { IRoundRepository } from '@/domain/orm/repositories/round.repository';
import { GameEngineService } from './game-engine.service';
import { IBetRepository } from '@/domain/orm/repositories/bet.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';
import { ProvablyFairUtil } from '../provably-fair/provably-fair.util';

describe('GameEngineService', () => {
  const logger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
  } as unknown as any;

  const mockRoundRepository: jest.Mocked<IRoundRepository> = {
    findByRoundId: jest.fn(),
    findCurrentBettingRound: jest.fn(),
    findCurrentRunningRound: jest.fn(),
    findRoundWithBets: jest.fn(),
    findRoundsHistory: jest.fn(),
    saveRound: jest.fn(),
    createRound: jest.fn(),
  };

  const mockProvablyFairService: jest.Mocked<IProvablyFairService> = {
    generateNewSeed: jest.fn(),
    getActiveSeed: jest.fn(),
    getNextSeedForRound: jest.fn(),
    incrementNonce: jest.fn(),
    verifyRound: jest.fn(),
    setSeedAsUsed: jest.fn(),
    rotateSeed: jest.fn(),
    getUserSeedsHistory: jest.fn(),
    getProvablyFairRound: jest.fn(),
  };

  const mockBetRepository: jest.Mocked<IBetRepository> = {
    setPendingBetsToLost: jest.fn(),
    save: jest.fn(),
    findBetByFilters: jest.fn(),
    findPeddingBets: jest.fn(),
    findLooserBetsByRoundId: jest.fn(),
    createBet: jest.fn(),
    findUserBetsHistory: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
  } as unknown as EventEmitter2;

  const provablyFairUtil = new ProvablyFairUtil();

  const gameEngineService = new GameEngineService(
    mockRoundRepository,
    mockProvablyFairService,
    mockBetRepository,
    provablyFairUtil,
  );

  gameEngineService.logger = logger;

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    jest.clearAllMocks();
  });

  describe('success scenarios', () => {
    it('should start new round and emit event', async () => {
      mockProvablyFairService.getNextSeedForRound.mockResolvedValue({
        serverSeed: 'string',
        serverSeedHash: 'string',
        clientSeed: 'string',
        nonce: 1,
        seedId: 'string',
      });
      mockRoundRepository.createRound.mockResolvedValue({
        id: 'currentRound.id',
        bettingEndsAt: new Date(),
        serverSeedHash: 'serverSeedHash',
      } as any);
      const create = jest.spyOn(mockRoundRepository, 'createRound');
      const emit = jest.spyOn(mockEventEmitter, 'emit');
      const response = await gameEngineService.startNewRound();

      expect(create).toHaveBeenCalledTimes(1);
      expect(emit).toHaveBeenCalledTimes(1);
      expect(emit).toHaveBeenCalledWith('round.betting.started', {
        roundId: expect.anything(),
        bettingEndsAt: expect.anything(),
        serverSeedHash: expect.anything(),
      });

      expect(response).toBeUndefined();
    });

    it('should end current running round if exists and emit event', async () => {
      const currentRound = {
        id: 'currentRound.id',
        clientSeed: 'clientSeed',
        setStatus: (_: RoundStatus) => {},
      };
      const saveRound = jest.spyOn(mockRoundRepository, 'saveRound');
      const setSeedAsUsed = jest.spyOn(mockProvablyFairService, 'setSeedAsUsed');
      const setPendingBetsToLost = jest.spyOn(mockBetRepository, 'setPendingBetsToLost');
      await gameEngineService.endRound(currentRound as any);
      // const setStatus = jest.spyOn(currentRound, 'setStatus');

      expect(saveRound).toHaveBeenCalledTimes(1);
      expect(setSeedAsUsed).toHaveBeenCalledTimes(1);
      expect(setPendingBetsToLost).toHaveBeenCalledTimes(1);
      expect(setSeedAsUsed).toHaveBeenCalledWith(currentRound.clientSeed);
      expect(setPendingBetsToLost).toHaveBeenCalledWith(currentRound.id);
      // expect(setStatus).toHaveBeenCalledTimes(1);
      // expect(setStatus).toHaveBeenCalledWith(RoundStatus.CRASHED);
    });

    it('should end current running round if exists or stop function if round not found', async () => {
      const saveRound = jest.spyOn(mockRoundRepository, 'saveRound');
      const setSeedAsUsed = jest.spyOn(mockProvablyFairService, 'setSeedAsUsed');
      const setPendingBetsToLost = jest.spyOn(mockBetRepository, 'setPendingBetsToLost');
      mockRoundRepository.findCurrentRunningRound.mockResolvedValueOnce(null);
      await gameEngineService.endRound();

      expect(saveRound).toHaveBeenCalledTimes(0);
      expect(setSeedAsUsed).toHaveBeenCalledTimes(0);
      expect(setPendingBetsToLost).toHaveBeenCalledTimes(0);
    });

    it('should start current betting round if exists and emit event', async () => {
      const currentRound = {
        id: 'currentRound.id',
        clientSeed: 'clientSeed',
        setStatus: (_: RoundStatus) => {},
      };

      const saveRound = jest.spyOn(mockRoundRepository, 'saveRound');
      const setStatus = jest.spyOn(currentRound, 'setStatus');

      await gameEngineService.runningRound(currentRound as any);

      expect(saveRound).toHaveBeenCalledTimes(1);
      expect(setStatus).toHaveBeenCalledTimes(1);
      expect(setStatus).toHaveBeenCalledWith(RoundStatus.RUNNING);
    });

    it("should search for round when current round doesn't provided", async () => {
      const findCurrentRunningRound = jest.spyOn(mockRoundRepository, 'findCurrentRunningRound');
      await gameEngineService.runningRound();
      expect(findCurrentRunningRound).toHaveBeenCalledTimes(1);
    });

    it("should return when current round doesn't provided and not found", async () => {
      const findCurrentRunningRound = jest.spyOn(mockRoundRepository, 'findCurrentRunningRound');
      await gameEngineService.runningRound();
      expect(findCurrentRunningRound).toHaveBeenCalledTimes(1);
    });
  });
});
