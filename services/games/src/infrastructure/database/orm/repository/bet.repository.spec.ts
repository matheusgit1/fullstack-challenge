import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BetRepository } from './bet.repository';
import { Bet, BetStatus } from '../entites/bet.entity';
import { Repository } from 'typeorm';

describe('BetRepository', () => {
  let repository: BetRepository;

  const mockTypeOrmRepo: Partial<Repository<Bet>> = {
    update: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeAll(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BetRepository,
        {
          provide: getRepositoryToken(Bet),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get(BetRepository);

    jest.clearAllMocks();
  });

  describe('success scenarios', () => {
    it('should set pending bets to lost', async () => {
      (mockTypeOrmRepo.update as jest.Mock).mockResolvedValue(undefined);

      await repository.setPendingBetsToLost('round-1');

      expect(mockTypeOrmRepo.update).toHaveBeenCalledWith(
        { roundId: 'round-1', status: BetStatus.PENDING },
        { status: BetStatus.LOST },
      );
    });

    it('should save bet', async () => {
      const bet = { id: '1' } as Bet;

      (mockTypeOrmRepo.save as jest.Mock).mockResolvedValue(bet);

      const result = await repository.save(bet);

      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(bet);
      expect(result).toEqual(bet);
    });

    it('should find bet by filters', async () => {
      const bet = { id: '1' } as Bet;

      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(bet);

      const result = await repository.findBetByFilters({ where: { id: '1' } });

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });

      expect(result).toEqual(bet);
    });

    it('should find pending bets', async () => {
      const bets = [{ id: '1' }] as Bet[];

      (mockTypeOrmRepo.find as jest.Mock).mockResolvedValue(bets);

      const result = await repository.findPeddingBets();

      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        where: { status: BetStatus.PENDING },
      });

      expect(result).toEqual(bets);
    });

    it('should find looser bets by round id', async () => {
      const bets = [{ id: '1' }] as Bet[];

      (mockTypeOrmRepo.find as jest.Mock).mockResolvedValue(bets);

      const result = await repository.findLooserBetsByRoundId('round-1');

      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        where: { status: BetStatus.LOST, roundId: 'round-1' },
      });

      expect(result).toEqual(bets);
    });

    it('should create and save bet', async () => {
      const data = { amount: 100 };
      const created = { ...data } as Bet;

      (mockTypeOrmRepo.create as jest.Mock).mockReturnValue(created);
      (mockTypeOrmRepo.save as jest.Mock).mockResolvedValue(created);

      const result = await repository.createBet(data);

      expect(mockTypeOrmRepo.create).toHaveBeenCalledWith(data);
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });

    // it('should return user bets history without status filter', async () => {
    //   const bets = [{ id: '1' }] as Bet[];
    //   const total = 1;

    //   (mockTypeOrmRepo.findAndCount as jest.Mock).mockResolvedValue([bets, total]);

    //   const result = await repository.findUserBetsHistory('user-1', 1, 10);

    //   expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith({
    //     where: { userId: 'user-1' },
    //     order: { createdAt: 'DESC' },
    //     skip: 0,
    //     take: 10,
    //     relations: ['round'],
    //   });

    //   expect(result).toEqual([bets, total]);
    // });

    // it('should return user bets history with status filter', async () => {
    //   const bets = [{ id: '1' }] as Bet[];
    //   const total = 1;

    //   (mockTypeOrmRepo.findAndCount as jest.Mock).mockResolvedValue([bets, total]);

    //   const result = await repository.findUserBetsHistory('user-1', 1, 10);

    //   expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith({
    //     where: { userId: 'user-1' },
    //     order: { createdAt: 'DESC' },
    //     skip: 0,
    //     take: 10,
    //     relations: ['round'],
    //   });

    //   expect(result).toEqual([bets, total]);
    // });
  });

  describe('failure scenarios', () => {
    it('should return null when bet not found', async () => {
      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findBetByFilters({ where: { id: 'invalid' } });

      expect(result).toBeNull();
    });

    it('should throw error when save fails', async () => {
      const bet = { id: '1' } as Bet;

      (mockTypeOrmRepo.save as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(repository.save(bet)).rejects.toThrow('DB Error');
    });

    it('should throw error when update fails', async () => {
      (mockTypeOrmRepo.update as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(repository.setPendingBetsToLost('round-1')).rejects.toThrow('DB Error');
    });

    it('should throw error when create fails', async () => {
      (mockTypeOrmRepo.create as jest.Mock).mockImplementation(() => {
        throw new Error('Create Error');
      });

      await expect(repository.createBet({})).rejects.toThrow('Create Error');
    });

    it('should throw error when findUserBetsHistory fails', async () => {
      (mockTypeOrmRepo.findAndCount as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(repository.findUserBetsHistory('user-1')).rejects.toThrow('DB Error');
    });
  });
});
