import { Round, RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';

export const genRound = (partial?: Partial<Round>) => {
  const defaults = new Round({
    id: 'id',
    status: RoundStatus.BETTING,
    multiplier: 2.0,
    crashPoint: 10,
    bettingStartedAt: new Date(),
    bettingEndsAt: new Date(Date.now() + 10000),
    startedAt: new Date(Date.now() + 10000),
    crashedAt: new Date(Date.now() + 100000),
    serverSeed: 'serverSeed',
    serverSeedHash: 'serverSeedHash',
    clientSeed: 'clientSeed',
    nonce: 1,
    bets: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return new Round({ ...defaults, ...partial });
};
