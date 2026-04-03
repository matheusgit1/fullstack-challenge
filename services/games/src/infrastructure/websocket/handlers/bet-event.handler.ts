import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { WebSocketService } from "../websocket.service";
import {
  BET_REPOSITORY,
  type IBetRepository,
} from "@/domain/orm/repositories/bet.repository";
import {
  type IRabbitmqProducerService,
  RABBITMQ_PRODUCER_SERVICE,
  TransactionSource,
} from "@/domain/rabbitmq/rabbitmq.producer";
import {
  Bet,
  BetStatus,
} from "@/infrastructure/database/orm/entites/bet.entity";

interface GameEventPayload {
  roundId: string;
  tracingId: string;
  [key: string]: any;
}

interface CashoutNotification {
  cashType: TransactionSource;
  userId: string;
  timestamp: string;
  externalId: string;
  tracingId: string;
}

@Injectable()
export class BetEventHandler {
  private readonly logger = new Logger(BetEventHandler.name);

  constructor(
    private readonly webSocketService: WebSocketService,
    @Inject(BET_REPOSITORY)
    private readonly betRepository: IBetRepository,
    @Inject(RABBITMQ_PRODUCER_SERVICE)
    private readonly rabbitmqProducer: IRabbitmqProducerService,
  ) {}

  @OnEvent("betting.running")
  handleNewBetting(payload: any): void {
    this.logger.log(`betting.running received`);
    this.webSocketService.broadcast("betting.running", payload);
  }

  @OnEvent("multiplier.updated")
  handleMultiplierUpdated(payload: any): void {
    this.logger.log(`multiplier.updated received`);
    this.webSocketService.broadcast("multiplier.updated", payload);
  }

  @OnEvent("round.betting.started")
  handleNewRound(payload: any): void {
    this.logger.log(`round.betting.started received`);
    this.webSocketService.broadcast("round.betting.started", payload);
  }

  @OnEvent("betting.loose")
  async handleGameLoose(payload: GameEventPayload): Promise<void> {
    this.logger.log(`[Trace:${payload.tracingId}] betting.loose received`);

    await this.processLostBets(payload, "loose");
    this.webSocketService.broadcast("betting.loose", payload);
  }

  @OnEvent("betting.crashed")
  async handleGameCrashed(payload: GameEventPayload): Promise<void> {
    this.logger.log(`[Trace:${payload.tracingId}] betting.crashed received`);

    await this.processLostBets(payload, "crashed");
    this.webSocketService.broadcast("betting.crashed", payload);
  }

  private async processLostBets(
    payload: GameEventPayload,
    eventType: string,
  ): Promise<void> {
    const { roundId, tracingId } = payload;

    const lostBets = await this.betRepository.findLooserBetsByRoundId(roundId);

    this.logger.log(
      `[Trace:${tracingId}] Found ${lostBets.length} pending bets to update for ${eventType} event`,
    );

    if (lostBets.length === 0) {
      this.logger.log(`[Trace:${tracingId}] No lost bets to process`);
      return;
    }

    const updatePromises = lostBets.map((bet) =>
      this.updateLostBet(bet, tracingId),
    );

    await Promise.all(updatePromises);

    this.logger.log(
      `[Trace:${tracingId}] Successfully processed ${lostBets.length} lost bets`,
    );
  }

  private async updateLostBet(bet: Bet, tracingId: string): Promise<void> {
    this.logger.log(`[Trace:${tracingId}] Updating bet ${bet.id}`);

    const updateBetPromise = this.betRepository.save(
      new Bet({ ...bet, status: BetStatus.LOST }),
    );

    const notifyCashoutPromise = this.notifyCashout({
      cashType: TransactionSource.BET_LOST,
      userId: bet.userId,
      timestamp: new Date().toISOString(),
      externalId: bet.id,
      tracingId,
    });

    await Promise.all([updateBetPromise, notifyCashoutPromise]);
  }

  private async notifyCashout(
    notification: CashoutNotification,
  ): Promise<void> {
    await this.rabbitmqProducer.publishCashout({
      cashType: notification.cashType,
      userId: notification.userId,
      timestamp: notification.timestamp,
      externalId: notification.externalId,
      tracingId: notification.tracingId,
    });
  }
}
