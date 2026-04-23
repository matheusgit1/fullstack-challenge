import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { GAME_ENGINE_SERVICE, type IGameEngineService } from '@/domain/game/game.engine';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';
import { ProvablyFairUtil } from '@/application/game/provably-fair/provably-fair.util';
import { betConfig } from '@/configs/bet.config';
import { WebSocketEvent } from '@/infrastructure/websocket/types/websocket.types';

@Injectable()
export class TimerService {
  logger = new Logger(TimerService.name);
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
    @Inject(GAME_ENGINE_SERVICE)
    private readonly gameEngineService: IGameEngineService,
    private readonly provablyFairUtil: ProvablyFairUtil,
  ) {}

  @Interval('round.betting.started', betConfig.BETTING_RUNNING_CHECK_INTERVAL_SECONDS)
  async handleBettingPhase() {
    try {
      const activeRound = await this.roundRepository.findCurrentBettingRound();
      this.logger.log(`[Trace:NO-TRACING] Fase de betting iniciada.`);
      if (activeRound && activeRound.isBettingPhase()) {
        if (activeRound.bettingEndsAt < new Date(Date.now())) {
          await this.gameEngineService.runningRound(activeRound);
        }
        return;
      }
      if (activeRound && activeRound.isRunning()) {
        return;
      }
      await this.gameEngineService.startNewRound();
    } catch (error) {
      console.error(`[round.betting.started]`, error);
    }
  }

  @Interval('round.multiple.updated', 5000)
  async handlerUpdateMultiplier() {
    try {
      const activeRound = await this.roundRepository.findCurrentRunningRound();
      this.logger.log(
        `[Trace:round ${activeRound?.id || 'no trace'}] ${activeRound?.id ? 'Multiplicador atual: ' + activeRound.multiplier.toFixed(2) + 'x.' : 'fase de aposta'}.`,
      );
      if (activeRound && activeRound.isRunning()) {
        if (Date.now() < new Date(activeRound.crashedAt).getTime()) {
          const newMultiplier = this.provablyFairUtil.interpolateMultiplier(
            activeRound.startedAt,
            activeRound.crashedAt,
            activeRound.crashPoint,
            new Date(),
          );
          if (newMultiplier > activeRound.multiplier) {
            activeRound.setMultiplier(newMultiplier);
            await this.gameEngineService.updateRound(activeRound, {
              event: WebSocketEvent.MULTIPLIER_UPDATED,
            });
            this.logger.log(
              `[Trace:update-round-multiplier ${activeRound?.id || 'no trace'}] Multiplicador atualizado para ${newMultiplier.toFixed(2)}x`,
            );
          }
          return;
        }

        if (Date.now() > new Date(activeRound.crashedAt).getTime()) {
          this.logger.log(`[Trace:round ${activeRound.id}] Fase de running sendo encerrada.`);
          const tracingId = activeRound.id;
          this.logger.log(`[Trace:${tracingId}] Fase de running encerrada.`);

          const newMultiplier = activeRound.crashPoint;

          activeRound.setMultiplier(newMultiplier);
          await this.gameEngineService.endRound(activeRound);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await this.gameEngineService.startNewRound();
          return;
        }
      }
    } catch (error) {
      console.error(`[round.multiple.updated]`, error);
    }
  }
}
