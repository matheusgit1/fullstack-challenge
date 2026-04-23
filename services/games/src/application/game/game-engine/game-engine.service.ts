import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { appConfig } from '@/configs/app.config';
import { type IProvablyFairService, PROVABY_SERVICE } from '@/domain/core/provably-fair/provably-fair.service';
import { type IGameEngineService } from '@/domain/game/game.engine';
import { BET_REPOSITORY, type IBetRepository } from '@/domain/orm/repositories/bet.repository';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';
import { Round, RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';
import { ProvablyFairUtil } from '../provably-fair/provably-fair.util';
import { betConfig } from '@/configs/bet.config';
import { Bet, BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';
import {
  type IRabbitmqProducerService,
  RABBITMQ_PRODUCER_SERVICE,
  TransactionSource,
} from '@/domain/rabbitmq/rabbitmq.producer';
import { WebSocketEvent } from '@/infrastructure/websocket/types/websocket.types';
import { EventService } from '@/application/events/event/event.service';

interface CashoutNotification {
  cashType: TransactionSource;
  userId: string;
  timestamp: string;
  externalId: string;
  tracingId: string;
}

export interface GameEventPayload {
  roundId: string;
  tracingId: string;
  [key: string]: any;
}

export interface GameEvent {
  event: WebSocketEvent;
}

@Injectable()
export class GameEngineService implements IGameEngineService {
  logger = new Logger(GameEngineService.name);

  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
    @Inject(PROVABY_SERVICE)
    private readonly provablyFairService: IProvablyFairService,
    @Inject(BET_REPOSITORY)
    private readonly betRepository: IBetRepository,
    private readonly provablyFairUtil: ProvablyFairUtil,
    @Inject(RABBITMQ_PRODUCER_SERVICE)
    private readonly rabbitmqProducer: IRabbitmqProducerService,
    private readonly eventService: EventService,
  ) {}

  async updateRound(activeRound: Round, event?: GameEvent): Promise<void> {
    await this.roundRepository.saveRound(activeRound);
    switch (event?.event) {
      case WebSocketEvent.MULTIPLIER_UPDATED:
        this.eventService.emitUpdateMultiplier(activeRound);
        break;
      case WebSocketEvent.BETTING_CRASHED:
        // this.eventService.emitRoundCrashed(activeRound);
        break;
      default:
        break;
    }
  }

  public async startNewRound(): Promise<void> {
    this.logger.log('Starting new betting round...');
    const { HOUSE_EDGE_PERCENT } = appConfig;
    const { BETTING_DURATION_IN_SECONDS } = betConfig;
    const { serverSeed, serverSeedHash, clientSeed, nonce } = await this.provablyFairService.getNextSeedForRound();

    const crashPoint = await this.provablyFairUtil.calculateCrashPoint(
      serverSeed,
      clientSeed,
      nonce,
      HOUSE_EDGE_PERCENT,
    );

    const bettingEndsAt = new Date(Date.now() + BETTING_DURATION_IN_SECONDS);
    const startedAt = new Date(bettingEndsAt.getTime());
    const crashedAt = this.provablyFairUtil.calculateTimeToCrashMs(crashPoint);

    const round = new Round({
      status: RoundStatus.BETTING,
      multiplier: 1.0,
      crashPoint: crashPoint,
      bettingStartedAt: new Date(),
      bettingEndsAt: bettingEndsAt,
      startedAt: startedAt,
      crashedAt: new Date(Date.now() + crashedAt + betConfig.BETTING_DURATION_IN_SECONDS),
      serverSeed: serverSeed,
      serverSeedHash: serverSeedHash,
      clientSeed: clientSeed,
      nonce: nonce,
      bets: [],
      isBettingPhase: Round.prototype.isBettingPhase,
      isCrashed: Round.prototype.isCrashed,
      isRunning: Round.prototype.isRunning,
      canPlaceBet: Round.prototype.canPlaceBet,
      canCashout: Round.prototype.canCashout,
      setStatus: Round.prototype.setStatus,
      getBettingDurationMs: Round.prototype.getBettingDurationMs,
      getRemainingBettingTimeMs: Round.prototype.getRemainingBettingTimeMs,
      setMultiplier: Round.prototype.setMultiplier,
    });

    // await new Promise((resolve) => setTimeout(resolve, 5000));
    await this.roundRepository.createRound(round);

    this.logger.log(`[Trace:${round.id}] Fase de betting iniciada.`);
    this.eventService.emitBettingPhaseStarted(round);
  }

  public async endRound(round: Round): Promise<void> {
    if (!round.isRunning()) return;
    round.setStatus(RoundStatus.CRASHED);

    const [_, __, ___, pendingBets] = await Promise.all([
      this.roundRepository.saveRound(round),
      this.provablyFairService.setSeedAsUsed(round.clientSeed),
      this.betRepository.setPendingBetsToLost(round.id),
      this.betRepository.findBetsByFilters({
        where: { roundId: round.id, status: BetStatus.PENDING },
      }),
    ]);

    const notificationPromises = pendingBets.map((bet) => {
      const notification: CashoutNotification = {
        cashType: TransactionSource.BET_LOST,
        userId: bet.userId,
        timestamp: new Date().toISOString(),
        externalId: bet.id,
        tracingId: bet.id,
      };
      return this.rabbitmqProducer.publishCashout(notification);
    });

    const results = await Promise.allSettled(notificationPromises);

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      this.logger.warn(`Failed to send ${failed.length} cashout notifications for round ${round.id}`);
    }
    this.eventService.emitBetLost(round.bets.filter((bet) => bet.status === BetStatus.PENDING) || []);
    this.eventService.emitRoundCrashed(round);
  }

  public async runningRound(round: Round): Promise<void> {
    if (!round.isBettingPhase()) return;
    round.setStatus(RoundStatus.RUNNING);
    await this.roundRepository.saveRound(round);
    this.eventService.emitRoundRunning(round);
    this.logger.log('Fase de betting encerrada, emitindo evento de fase de running.');
  }
}
