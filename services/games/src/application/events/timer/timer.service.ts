import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Interval } from '@nestjs/schedule';
import { appConfig } from '@/configs/app.config';
import { type IProvablyFairService, PROVABY_SERVICE } from '@/domain/core/provably-fair/provably-fair.service';
import { GAME_ENGINE_SERVICE, type IGameEngineService } from '@/domain/game/game.engine';
import { BET_REPOSITORY, type IBetRepository } from '@/domain/orm/repositories/bet.repository';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';

@Injectable()
export class TimerService {
  private readonly logger = new Logger(TimerService.name);
  constructor(
    private readonly eventEmitter: EventEmitter2,
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
    @Inject(GAME_ENGINE_SERVICE)
    private readonly gameEngineService: IGameEngineService,
    @Inject(PROVABY_SERVICE)
    private readonly provablyFairService: IProvablyFairService,
    @Inject(BET_REPOSITORY)
    private readonly betRepository: IBetRepository,
  ) {}

  @Interval('betting.phase', appConfig.bettingDurationSeconds * 1000)
  async handleBettingPhase() {
    const activeRound = await this.roundRepository.findCurrentBettingRound();
    this.logger.log(`[Trace:NO-TRACING] Fase de betting iniciada.`);
    if (activeRound && activeRound.isBettingPhase()) {
      if (activeRound.bettingEndsAt < new Date(Date.now())) {
        await this.gameEngineService.runningRound(activeRound);

        this.logger.log('Fase de betting encerrada, emitindo evento de fase de running.');

        this.eventEmitter.emit('betting.running', {
          roundId: activeRound.id,
          round: activeRound,
        });
      }

      return;
    }

    if (activeRound && activeRound.isRunning()) {
      await this.handleNewBetting();
      return;
    }
    await this.gameEngineService.startNewRound();
  }

  @Interval('multiple.updated', 5 * 1000)
  async handleNewCrashed() {
    const activeRound = await this.roundRepository.findCurrentRunningRound();
    this.logger.log(`[Trace:NO-TRACING] Fase de running iniciada.`);
    if (activeRound && activeRound.isRunning()) {
      if (Date.now() < new Date(activeRound.crashedAt).getTime()) {
        const newMultiplier = this.calculateMultiplierInterpolation(
          activeRound.startedAt,
          activeRound.crashedAt,
          activeRound.crashPoint,
        );

        if (newMultiplier > activeRound.multiplier) {
          activeRound.setMultiplier(newMultiplier);
          await this.roundRepository.saveRound(activeRound);

          this.logger.log(`Multiplicador atualizado para ${newMultiplier.toFixed(2)}x`);

          this.eventEmitter.emit('multiplier.updated', {
            roundId: activeRound.id,
            multiplier: newMultiplier,
            crashPoint: activeRound.crashPoint,
          });
        }
      }
    }
  }

  @Interval('betting.running', appConfig.bettingRunningCheckIntervalSeconds * 1000)
  async handleNewBetting() {
    const activeRound = await this.roundRepository.findCurrentRunningRound();
    this.logger.log(`[Trace:NO-TRACING] Fase de running em analise.`);
    if (activeRound && activeRound.isRunning()) {
      if (Date.now() > new Date(activeRound.crashedAt).getTime()) {
        this.logger.log(`[Trace:NO-TRACING] Fase de running sendo encerrada.`);
        const tracingId = activeRound.id;
        this.logger.log(`[Trace:${tracingId}] Fase de running encerrada.`);
        this.gameEngineService.endRound(activeRound);

        this.eventEmitter.emit('betting.loose', {
          roundId: activeRound.id,
          tracingId: tracingId,
        });

        this.eventEmitter.emit('betting.crashed', {
          roundId: activeRound.id,
          round: activeRound,
          tracingId: tracingId,
        });
      }
    }
  }

  private calculateMultiplierInterpolation(startedAt: Date, crashedAt: Date, crashPoint: number): number {
    const now = Date.now();
    const startTime = startedAt.getTime();
    const crashTime = crashedAt.getTime();

    if (!startedAt || !crashedAt || !crashPoint || crashPoint <= 1.0) {
      this.logger.warn('Parâmetros inválidos para interpolação de multiplicador');
      return 1.0;
    }

    if (now <= startTime || now >= crashTime) {
      return 1.0;
    }

    const totalDuration = crashTime - startTime;
    const elapsedTime = now - startTime;
    const timeProgress = elapsedTime / totalDuration;
    const interpolatedMultiplier = 1.0 + (crashPoint - 1.0) * timeProgress;
    const finalMultiplier = Math.min(interpolatedMultiplier, crashPoint);
    return Math.round(finalMultiplier * 100) / 100;
  }
}
