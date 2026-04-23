import { Round, RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';
import * as crypto from 'crypto';

export const genRound = (partial?: Partial<Round>) => {
  const defaults = new Round({
    status: RoundStatus.BETTING,
    multiplier: 1,
    crashPoint: Math.random() * 100,
    bettingStartedAt: new Date(),
    bettingEndsAt: new Date(Date.now() + 10000),
    startedAt: new Date(Date.now() + 10000),
    crashedAt: new Date(new Date(Date.now() + 10000).getTime() + 10000),
    serverSeed: 'serverSeed',
    serverSeedHash: 'serverSeedHash',
    clientSeed: 'clientSeed',
    nonce: 1,
    bets: [],
    // createdAt: new Date(),
    // updatedAt: new Date(),
    endedAt: new Date(),
    isBettingPhase: Round.prototype.isBettingPhase,
    isRunning: Round.prototype.isRunning,
    isCrashed: Round.prototype.isCrashed,
    canPlaceBet: Round.prototype.canPlaceBet,
    canCashout: Round.prototype.canCashout,
    getBettingDurationMs: Round.prototype.getBettingDurationMs,
    getRemainingBettingTimeMs: Round.prototype.getRemainingBettingTimeMs,
    setStatus: Round.prototype.setStatus,
    setMultiplier: Round.prototype.setMultiplier,
  });

  return new Round({ ...defaults, ...partial } as Round);
};
