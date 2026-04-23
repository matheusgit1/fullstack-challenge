import { Bet, BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';
import { genRound } from './gen-round';
import { RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';

export const genBets = (partial?: Partial<Bet>) => {
  const round = partial?.round || genRound({ status: RoundStatus.RUNNING, multiplier: 2.5 });
  const defaults = new Bet({
    roundId: 'roundId',
    userId: 'anonymous',
    amount: 10,
    multiplier: 3,
    status: BetStatus.PENDING,
    cashedOutAt: null,
    round: round,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPending: Bet.prototype.isPending,
    isCashedOut: Bet.prototype.isCashedOut,
    isLost: Bet.prototype.isLost,
    cashout: Bet.prototype.cashout,
    lose: Bet.prototype.lose,
    getWinAmount: Bet.prototype.getWinAmount,
  });

  return new Bet({ ...defaults, ...partial } as Bet);
};
