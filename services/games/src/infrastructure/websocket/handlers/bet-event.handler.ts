import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { type IWebSocketService, WEB_SOCKET_SERVICE } from '@/domain/websocket/websocket.service';
import { type GameEventPayload } from '@/application/game/game-engine/game-engine.service';

@Injectable()
export class BetEventHandler {
  logger = new Logger(BetEventHandler.name);

  constructor(
    @Inject(WEB_SOCKET_SERVICE)
    private readonly webSocketService: IWebSocketService,
  ) {}

  @OnEvent('betting.cashout')
  async handlerCashout(payload: GameEventPayload): Promise<void> {
    this.logger.log(`[Trace:${payload.tracingId}] betting.cashout received`);
    this.webSocketService.broadcast('betting.cashout', payload);
  }

  @OnEvent('betting.new')
  async handlerNewBet(payload: GameEventPayload): Promise<void> {
    this.logger.log(`[Trace:${payload.tracingId}] betting.new received`);
    this.webSocketService.broadcast('betting.new', payload);
  }

  @OnEvent('round.crashed')
  handleRoundCrashed(payload: any): void {
    this.logger.log(`round.crashed received`);
    this.webSocketService.broadcast('round.crashed', payload);
  }

  @OnEvent('betting.running')
  handleRoundRunning(payload: any): void {
    this.logger.log(`betting.running received`);
    this.webSocketService.broadcast('betting.running', payload);
  }

  @OnEvent('round.multiple.updated')
  handleMultiplierUpdated(payload: any): void {
    this.logger.log(`round.multiple.updated received`);
    this.webSocketService.broadcast('round.multiple.updated', payload);
  }

  @OnEvent('round.betting.started')
  handleNewRound(payload: any): void {
    this.logger.log(`round.betting.started received`);
    this.webSocketService.broadcast('round.betting.started', payload);
  }

  @OnEvent('betting.loose')
  async handleGameLoose(payload: GameEventPayload): Promise<void> {
    this.logger.log(`[Trace:${payload.tracingId}] betting.loose received`);

    this.webSocketService.broadcast('betting.loose', payload);
  }

  @OnEvent('betting.crashed')
  async handleGameCrashed(payload: GameEventPayload): Promise<void> {
    this.logger.log(`[Trace:${payload.tracingId}] betting.crashed received`);

    this.webSocketService.broadcast('betting.crashed', payload);
  }

  @OnEvent('betting.phase')
  async handleGamePhase(payload: GameEventPayload): Promise<void> {
    this.logger.log(`[Trace:${payload.tracingId}] betting.phase received`);
    this.webSocketService.broadcast('betting.phase', payload);
  }

  @OnEvent('betting.new')
  async handleGameNew(payload: GameEventPayload): Promise<void> {
    this.logger.log(`[Trace:${payload.tracingId}] betting.new received`);
    this.webSocketService.broadcast('betting.new', payload);
  }
}
