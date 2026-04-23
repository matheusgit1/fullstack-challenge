import { ProvablyFairUtil } from '@/application/game/provably-fair/provably-fair.util';
import { AuditRoundUsecase } from './audit-round.usecase';
import { mock } from 'node:test';
import { IProvablyFairService } from '@/domain/core/provably-fair/provably-fair.service';
import { IRoundRepository } from '@/domain/orm/repositories/round.repository';
import { RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';
import { genRound } from '@/util-teste/entitites/gen-round';
import { genProvablyFair } from '@/util-teste/entitites/gen-provably-fair';

describe('AuditRoundUseCase', () => {
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

  const mockRoundRepository: jest.Mocked<IRoundRepository> = {
    findByRoundId: jest.fn(),
    findCurrentBettingRound: jest.fn(),
    findCurrentRunningRound: jest.fn(),
    findRoundWithBets: jest.fn(),
    findRoundsHistory: jest.fn(),
    saveRound: jest.fn(),
    createRound: jest.fn(),
  };

  const provablyFairUtil = new ProvablyFairUtil();

  const auditRound = new AuditRoundUsecase(mockProvablyFairService, mockRoundRepository, provablyFairUtil);

  describe('sucess scenarios', () => {
    it('should validate provably fair correctly', async () => {
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

      const response = await auditRound.handler(round.id);

      expect(response).toBeDefined();
      expect(response.timing.timingIsConsistent).toBeTruthy();
    });
  });
  describe('error scenarios', () => {
    it('should throw an error if round not found', async () => {
      const roundId = 'f3f71d05-16ec-4358-b222-90a08190b7cb';
      mockRoundRepository.findByRoundId.mockResolvedValueOnce(null);
      await expect(auditRound.handler(roundId)).rejects.toThrow();
    });

    it("provably fair validation should fail if round doesn't match", async () => {
      const fairRound = genProvablyFair({
        id: 'f3f71d05-16ec-4358-b222-90a08190b7cb',
        clientSeed: 'jungle_177585019439', //client corrompida
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
        crashedAt: new Date('2026-04-10T19:18:15.231Z'), //crashed at corrompido
        serverSeed: '21345f69852a42847e80d5d5ce00a9c372c54a092adb5bb8b584494848ad1da5',
        serverSeedHash: '21345f69852a42847e80d5d5ce00a9c372c54a092adb5bb8b584494848ad1da5', //sever seed hash corrompida
        clientSeed: '21345f69852a42847e80d5d5ce00a9c372c54a092adb5bb8b584494848ad1da5', //client seed corrompido
        nonce: 0,
        createdAt: new Date('2026-04-10T19:43:17.758Z'),
        updatedAt: new Date('2026-04-10T20:18:10.902Z'),
        endedAt: new Date('2026-04-10T20:18:15.231Z'),
      });

      mockProvablyFairService.getProvablyFairRound.mockResolvedValueOnce(fairRound);
      mockRoundRepository.findByRoundId.mockResolvedValueOnce(round);

      const response = await auditRound.handler(round.id);

      expect(response).toBeDefined();
      expect(response.timing.timingIsConsistent).toBeFalsy();
    });
  });
});
