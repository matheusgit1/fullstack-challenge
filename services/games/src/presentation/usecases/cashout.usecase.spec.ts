import { IBetRepository } from '@/domain/orm/repositories/bet.repository';
import { CashOutUsecase } from './cashout.usecase';
import { GamesManager } from '../manager/games.manager';
import { CashoutRequestDto } from '../dtos/request/cashout-request.dto';
import { genBets } from '@/util-teste/entitites/gen-bets';
import { BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';
import { genRound } from '@/util-teste/entitites/gen-round';
import { RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';

describe('CashoutUseCase', () => {
  const mockBetRepository: jest.Mocked<IBetRepository> = {
    setPendingBetsToLost: jest.fn(),
    save: jest.fn(),
    findByFilters: jest.fn(),
    findPeddingBets: jest.fn(),
    findLooserBetsByRoundId: jest.fn(),
    createBet: jest.fn(),
    findUserBetsHistory: jest.fn(),
  };

  const mockProxy = {
    getUserBalance: jest.fn(),
  };

  const mockRabbitmqProducer = {
    publishReserve: jest.fn(),
    publishCashin: jest.fn(),
    publishCashout: jest.fn(),
  };

  const requets = {
    user: { sub: 'userId' },
    hash: 'test-hash-123',
    token: 'test-token-123',
  };

  const gameManager = new GamesManager(mockBetRepository, mockRabbitmqProducer);
  const usecase = new CashOutUsecase(mockBetRepository, mockProxy, requets as any, gameManager);

  beforeAll(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Scenarios', () => {
    it('should cashout bet', async () => {
      const round = genRound({ status: RoundStatus.RUNNING });
      const bet = genBets({
        id: `1`,
        status: BetStatus.PENDING,
        round: round,
      });
      mockBetRepository.findByFilters.mockResolvedValueOnce(bet);
      const response = await usecase.handler(new CashoutRequestDto({ betId: '1' }));
      expect(response).toBeDefined();
    });

    it('should set bet as lost', async () => {
      const round = genRound({ status: RoundStatus.CRASHED });
      const bet = genBets({ id: `1`, status: BetStatus.PENDING, round: round });
      mockBetRepository.findByFilters.mockResolvedValueOnce(bet);
      const response = await usecase.handler(new CashoutRequestDto({ betId: '1' }));
      expect(response).toBeDefined();
    });

    it("should thow error if bet doesn't exist", async () => {
      mockBetRepository.findByFilters.mockResolvedValueOnce(null);
      await expect(usecase.handler(new CashoutRequestDto({ betId: '1' }))).rejects.toThrow();
    });

    it('should thow error if bet its lost', async () => {
      const round = genRound({ status: RoundStatus.CRASHED });
      const bet = genBets({ id: `1`, status: BetStatus.LOST, round: round });
      mockBetRepository.findByFilters.mockResolvedValueOnce(bet);
      await expect(usecase.handler(new CashoutRequestDto({ betId: '1' }))).rejects.toThrow();
    });

    it('should thow error if bet its cashed out', async () => {
      const round = genRound({ status: RoundStatus.CRASHED });
      const bet = genBets({ id: `1`, status: BetStatus.CASHED_OUT, round: round });
      mockBetRepository.findByFilters.mockResolvedValueOnce(bet);
      await expect(usecase.handler(new CashoutRequestDto({ betId: '1' }))).rejects.toThrow();
    });
  });
});
