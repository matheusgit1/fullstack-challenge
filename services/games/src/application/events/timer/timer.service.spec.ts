import { IGameEngineService } from '@/domain/game/game.engine';
import { IRoundRepository } from '@/domain/orm/repositories/round.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TimerService } from './timer.service';

describe('TimerService', () => {
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

  const mockGameEngineService: jest.Mocked<IGameEngineService> = {
    startNewRound: jest.fn(),
    endRound: jest.fn(),
    runningRound: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    removeAllListeners: jest.fn(),
    listeners: jest.fn(),
    setMaxListeners: jest.fn(),
    getMaxListeners: jest.fn(),
    listenerCount: jest.fn(),
    emitAsync: jest.fn(),
    waitFor: jest.fn(),
  } as unknown as EventEmitter2;

  const timerService = new TimerService(mockEventEmitter, mockRoundRepository, mockGameEngineService);
  timerService.logger = logger;

  beforeAll(async () => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('success scenarios', () => {
    it('should start new betting phase if round not found', async () => {
      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(null);

      const response = await timerService.handleBettingPhase();
      const roundRepositorySpy = jest.spyOn(mockRoundRepository, 'findCurrentBettingRound');
      const gameEngineServiceSpy = jest.spyOn(mockGameEngineService, 'runningRound');
      const startNewRound = jest.spyOn(mockGameEngineService, 'startNewRound');

      expect(roundRepositorySpy).toHaveBeenCalledTimes(1);
      expect(gameEngineServiceSpy).toHaveBeenCalledTimes(0);
      expect(startNewRound).toHaveBeenCalledTimes(1);

      expect(response).toBeUndefined();
    });

    it('should start new running phase if round phase ended', async () => {
      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce({
        id: '1',
        bettingEndsAt: new Date(Date.now() - 1000),
        isBettingPhase: () => true,
        isRunning: () => false,
      } as any);

      const response = await timerService.handleBettingPhase();
      const roundRepositorySpy = jest.spyOn(mockRoundRepository, 'findCurrentBettingRound');
      const gameEngineServiceSpy = jest.spyOn(mockGameEngineService, 'runningRound');
      const startNewRound = jest.spyOn(mockGameEngineService, 'startNewRound');

      expect(roundRepositorySpy).toHaveBeenCalledTimes(1);
      expect(gameEngineServiceSpy).toHaveBeenCalledTimes(1);
      expect(startNewRound).toHaveBeenCalledTimes(0);

      expect(response).toBeUndefined();
    });

    it('should start new running phase if round phase ended', async () => {
      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce({
        id: '1',
        bettingEndsAt: new Date(Date.now() + 1000),
        isBettingPhase: () => true,
        isRunning: () => false,
      } as any);

      const response = await timerService.handleBettingPhase();
      const roundRepositorySpy = jest.spyOn(mockRoundRepository, 'findCurrentBettingRound');
      const gameEngineServiceSpy = jest.spyOn(mockGameEngineService, 'runningRound');
      const startNewRound = jest.spyOn(mockGameEngineService, 'startNewRound');

      expect(roundRepositorySpy).toHaveBeenCalledTimes(1);
      expect(gameEngineServiceSpy).toHaveBeenCalledTimes(0);
      expect(startNewRound).toHaveBeenCalledTimes(0);

      expect(response).toBeUndefined();
    });

    it('should update multiplier if round is running', async () => {
      const round = {
        id: '1',
        startedAt: new Date(Date.now() - 1000),
        crashedAt: new Date(Date.now() + 1000),
        crashPoint: 10e2,
        multiplier: 0,
        isBettingPhase: () => false,
        isRunning: () => true,
        setMultiplier: (_: number) => {},
      } as any;
      mockRoundRepository.findCurrentRunningRound.mockResolvedValueOnce(round);

      const response = await timerService.handleNewCrashed();
      const findCurrentRunningRound = jest.spyOn(mockRoundRepository, 'findCurrentRunningRound');
      const gameEngineServiceSpy = jest.spyOn(mockGameEngineService, 'runningRound');
      const startNewRound = jest.spyOn(mockGameEngineService, 'startNewRound');
      const saveRound = jest.spyOn(mockRoundRepository, 'saveRound');
      const emit = jest.spyOn(mockEventEmitter, 'emit');

      expect(findCurrentRunningRound).toHaveBeenCalledTimes(1);
      expect(gameEngineServiceSpy).toHaveBeenCalledTimes(0);
      expect(startNewRound).toHaveBeenCalledTimes(0);
      expect(saveRound).toHaveBeenCalledTimes(1);
      expect(emit).toHaveBeenCalledTimes(1);
      expect(emit).toHaveBeenCalledWith('multiplier.updated', {
        roundId: round.id,
        multiplier: expect.any(Number),
        crashPoint: expect.any(Number),
      });
      expect(response).toBeUndefined();
    });
  });
});
