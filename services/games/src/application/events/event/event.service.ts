import { Bet, BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';
import { Round, RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';
import { CurrentRoundResponseDto } from '@/presentation/dtos/response/current-round-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  constructor(private readonly eventEmitter: EventEmitter2) {}

  public emitCashout(bet: Bet) {
    this.logger.log(`Emitting cashout event`);
    this.eventEmitter.emit('betting.cashout', {
      bet: {
        id: bet.id,
        userId: bet.userId,
        amount: bet.amount,
        roundId: bet.roundId,
        multiplier: bet.multiplier,
      },
    });
  }

  public emitBet(bet: Bet) {
    this.logger.log(`emitting new bet with id ${bet.id} for round ${bet.roundId}`);
    this.eventEmitter.emit('betting.new', {
      bet: {
        id: bet.id,
        userId: bet.userId,
        amount: bet.amount,
        roundId: bet.roundId,
      },
    });
  }

  public emitBetLost(bets: Bet[]) {
    this.logger.log(`Emitting bet lost for bets: ${bets.map((b) => b.id).join(', ')}`);
    this.eventEmitter.emit('betting.loose', {
      bets: bets
        .filter((bet) => bet.isPending())
        .map((bet) => ({
          id: bet.id,
          userId: bet.userId,
          amount: bet.amount,
        })),
    });
  }

  public emitRoundCrashed(round: Round) {
    this.logger.log(`Emitting round crashed for round ${round.id}`);
    this.eventEmitter.emit('round.crashed', {
      roundId: round.id,
      crashPoint: round.multiplier.toFixed(2),
    });
  }

  public emitRoundRunning(round: Round) {
    this.logger.log(`Emitting round running for round ${round.id}`);
    this.eventEmitter.emit('betting.running', {
      roundId: round.id,
    });
  }

  public emitUpdateMultiplier(round: Round) {
    this.logger.log(`Emitting multiplier update for round ${round.id} with multiplier ${round.multiplier.toFixed(2)}x`);
    this.eventEmitter.emit('round.multiple.updated', {
      roundId: round.id,
      multiplier: round.multiplier,
    });
  }

  public emitBettingPhaseStarted(round: Round) {
    this.logger.log(`Emitting betting phase started for round ${round.id}`);
    this.eventEmitter.emit('betting.phase', {
      round: new CurrentRoundResponseDto({
        id: round.id,
        status: round.status,
        multiplier: round.multiplier,
        bets: round.bets,
        serverSeedHash: round.serverSeedHash,
        bettingStartedAt: round.bettingStartedAt,
        bettingEndsAt: round.bettingEndsAt,
        startedAt: round.startedAt,
        crashPoint:
          round.status === RoundStatus.RUNNING || round.status === RoundStatus.BETTING ? 'secret' : round.crashPoint,
      }),
    });
  }
}
