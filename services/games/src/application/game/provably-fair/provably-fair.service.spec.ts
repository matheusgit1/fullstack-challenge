import { Test } from '@nestjs/testing';
import { ProvablyFairService } from './provably-fair.service';
import { ProvablyFairSeed } from '@/infrastructure/database/orm/entites/provably-fair.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';

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
    }).compile();

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
  });
});
