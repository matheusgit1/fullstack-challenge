import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoundRepository } from './round.repository';
import { Round, RoundStatus } from '../entites/round.entity';
import { Repository } from 'typeorm';

describe('RoundRepository', () => {
  let repository: RoundRepository;

  const mockTypeOrmRepo: Partial<Repository<Round>> = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeAll(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RoundRepository,
        {
          provide: getRepositoryToken(Round),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get(RoundRepository);

    jest.clearAllMocks();
  });

  describe('success scenarios', () => {
    it('should find round by id', async () => {
      const round = { id: '1' } as Round;

      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(round);

      const result = await repository.findByRoundId('1');

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['bets'],
      });

      expect(result).toEqual(round);
    });

    it('should find current betting round', async () => {
      const round = { id: '1' } as Round;

      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(round);

      const result = await repository.findCurrentBettingRound();

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: [{ status: RoundStatus.BETTING }, { status: RoundStatus.RUNNING }],
        order: { createdAt: 'DESC' },
        relations: ['bets'],
      });

      expect(result).toEqual(round);
    });

    it('should find current running round', async () => {
      const round = { id: '1' } as Round;

      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(round);

      const result = await repository.findCurrentRunningRound();

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: [{ status: RoundStatus.RUNNING }],
        order: { createdAt: 'DESC' },
        relations: ['bets'],
      });

      expect(result).toEqual(round);
    });

    it('should return rounds history', async () => {
      const rounds = [{ id: '1' }] as Round[];
      const total = 1;

      (mockTypeOrmRepo.findAndCount as jest.Mock).mockResolvedValue([rounds, total]);

      const result = await repository.findRoundsHistory(1, 10);

      expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith({
        order: { crashedAt: 'DESC' },
        skip: 0,
        take: 10,
      });

      expect(result).toEqual([rounds, total]);
    });

    it('should save round', async () => {
      const round = { id: '1' } as Round;

      (mockTypeOrmRepo.save as jest.Mock).mockResolvedValue(round);

      const result = await repository.saveRound(round);

      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(round);
      expect(result).toEqual(round);
    });

    it('should create and save round', async () => {
      const data = { id: '1' };
      const created = { ...data } as Round;

      (mockTypeOrmRepo.create as jest.Mock).mockReturnValue(created);
      (mockTypeOrmRepo.save as jest.Mock).mockResolvedValue(created);

      const result = await repository.createRound(data);

      expect(mockTypeOrmRepo.create).toHaveBeenCalledWith(data);
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('failure scenarios', () => {
    it('should return null when round not found', async () => {
      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByRoundId('invalid');

      expect(result).toBeNull();
    });

    it('should throw error when save fails', async () => {
      const round = { id: '1' } as Round;

      (mockTypeOrmRepo.save as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(repository.saveRound(round)).rejects.toThrow('DB Error');
    });

    it('should throw error when findRoundsHistory fails', async () => {
      (mockTypeOrmRepo.findAndCount as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(repository.findRoundsHistory()).rejects.toThrow('DB Error');
    });

    it('should throw error when createRound fails', async () => {
      const data = { id: '1' };

      (mockTypeOrmRepo.create as jest.Mock).mockImplementation(() => {
        throw new Error('Create Error');
      });

      await expect(repository.createRound(data)).rejects.toThrow('Create Error');
    });
  });
});
