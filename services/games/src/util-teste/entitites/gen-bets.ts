import { Bet, BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';
import { genRound } from './gen-round';

export const genBets = (partial?: Partial<Bet>) => {
  const defaults = new Bet({
    id: 'id',
    roundId: 'roundId',
    userId: 'anonymous',
    amount: 10,
    multiplier: 3,
    status: BetStatus.PENDING,
    cashedOutAt: null,
    round: genRound(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return new Bet({ ...defaults, ...partial });
};
