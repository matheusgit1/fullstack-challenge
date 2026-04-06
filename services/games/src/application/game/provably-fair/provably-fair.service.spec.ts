import { Test } from '@nestjs/testing';
import { ProvablyFairService } from './provably-fair.service';
import { ProvablyFairSeed } from '@/infrastructure/database/orm/entites/provably-fair.entity';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';
import { mock } from 'node:test';

describe('ProvablyFairService', () => {
  let service: ProvablyFairService;

  const mockSeedRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    increment: jest.fn(),
    update: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockRoundRepository = {
    findByRoundId: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProvablyFairService,
        {
          provide: getRepositoryToken(ProvablyFairSeed),
          useValue: mockSeedRepository,
        },
        {
          provide: ROUND_REPOSITORY,
          useValue: mockRoundRepository,
        },
      ],
    })
      .overrideModule(TypeOrmModule)
      .useModule(class {})
      .compile();

    service = module.get(ProvablyFairService);

    jest.clearAllMocks();
  });

  describe('success scenarios', () => {
    it('should generate and save a new seed', async () => {
      const mockSeed = { id: '1' };

      mockSeedRepository.create.mockReturnValue(mockSeed);
      mockSeedRepository.save.mockResolvedValue(mockSeed);

      const result = await service.generateNewSeed('client123');

      expect(mockSeedRepository.create).toHaveBeenCalled();
      expect(mockSeedRepository.save).toHaveBeenCalledWith(mockSeed);
      expect(result).toEqual(mockSeed);
    });

    it('should create new seed if none exists', async () => {
      mockSeedRepository.findOne.mockResolvedValue(null);

      const spy = jest.spyOn(service, 'generateNewSeed').mockResolvedValue({ id: '1' } as any);

      const result = await service.getActiveSeed();

      expect(spy).toHaveBeenCalled();
      expect(result).toEqual({ id: '1' });
    });

    it('should calculate crash point correctly', async () => {
      const result = await service.calculateCrashPoint('server', 'client', 1, 1);

      expect(result).toBeGreaterThanOrEqual(1);
    });

    it('should calculate crash point correctly', async () => {
      const result = await service.calculateCrashPoint('server', 'client', 1, 1);

      expect(result).toBeGreaterThanOrEqual(1);
    });

    it('should increment nonce', async () => {
      await service.incrementNonce('seed-id');

      expect(mockSeedRepository.increment).toHaveBeenCalledWith({ id: 'seed-id' }, 'nonce', 1);
    });

    it('should increment nonce', async () => {
      await service.incrementNonce('seed-id');

      expect(mockSeedRepository.increment).toHaveBeenCalledWith({ id: 'seed-id' }, 'nonce', 1);
    });

    it('should return null if round not found', async () => {
      mockRoundRepository.findByRoundId.mockResolvedValue(null);

      const result = await service.getProvablyFairDataForRound('1');

      expect(result).toBeNull();
    });

    it('should return provably fair data', async () => {
      const result = await service.getNextSeedForRound();
      expect(result).not.toBeNull();
    });

    it('should verify correctly', async () => {
      mockSeedRepository.findOne.mockResolvedValue(null);
      const result = await service.verifyRound('serverSeed', 'serverSeedHash', 1, 1);
      expect(result).not.toBeNull();
    });

    it('should set seed as used', async () => {
      await service.setSeedAsUsed('seed-id');
      expect(mockSeedRepository.update).toHaveBeenCalledWith(
        { id: 'seed-id' },
        { isUsed: true, usedAt: expect.any(Date) },
      );
    });

    it("should set seed as used and generate new seed if it doesn't exist", async () => {
      mockSeedRepository.findOne.mockResolvedValue(null);
      const response = await service.rotateSeed('newClientSeed');
      expect(response).not.toBeNull();
    });

    it('should get seed history with params', async () => {
      mockSeedRepository.findAndCount.mockResolvedValue([[], 10]);
      const response = await service.getUserSeedsHistory(1, 10);
      expect(response).not.toBeNull();
    });

    it('should get seed history without params', async () => {
      mockSeedRepository.findAndCount.mockResolvedValue([[], 10]);
      const response = await service.getUserSeedsHistory();
      expect(response).not.toBeNull();
    });

    it('should get fair data for round', async () => {
      mockRoundRepository.findByRoundId.mockResolvedValue({ id: '1', clientSeed: 'clientSeed' });
      mockSeedRepository.findOne.mockResolvedValue({ id: '1', clientSeed: 'clientSeed' });
      const response = await service.getProvablyFairDataForRound('1');
      expect(response).not.toBeNull();
    });

    it('should return null if round not found when get fair data for round', async () => {
      mockRoundRepository.findByRoundId.mockResolvedValue(null);
      mockSeedRepository.findOne.mockResolvedValue({ id: '1', clientSeed: 'clientSeed' });
      const response = await service.getProvablyFairDataForRound('1');
      expect(response).toBeNull();
    });

    it('should return null if fair data for round is null', async () => {
      mockRoundRepository.findByRoundId.mockResolvedValue({ id: '1', clientSeed: 'clientSeed' });
      mockSeedRepository.findOne.mockResolvedValue(null);
      const response = await service.getProvablyFairDataForRound('1');
      expect(response).toBeNull();
    });
  });
});
