import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundRepository } from "../database/orm/repository/round.repository";
import { GameEngineService } from "@/application/services/game-engine/game-engine.service";
import { appConfig } from "@/configs/app.config";
import { ProvablyFairService } from "@/application/services/provably-fair/provably-fair.service";
import { BetRepository } from "../database/orm/repository/bet.repository";
import { RoundStatus } from "../database/orm/entites/round.entity";

@Injectable()
export class TimerService {
  private readonly logger = new Logger(TimerService.name);
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly roundRepository: RoundRepository,
    private readonly gameEngineService: GameEngineService,
    private readonly provablyFairService: ProvablyFairService,
    private readonly betRepository: BetRepository,
  ) {}

  @Interval("betting.phase", appConfig.bettingDurationSeconds * 1000)
  async handleBettingPhase() {
    const activeRound = await this.roundRepository.findCurrentBettingRound();
    if (activeRound && activeRound.isBettingPhase()) {
      if (activeRound.bettingEndsAt < new Date(Date.now())) {
        activeRound.setStatus(RoundStatus.RUNNING);
        await this.roundRepository.saveRound(activeRound);

        this.logger.log(
          "Fase de betting encerrada, emitindo evento de fase de running.",
        );

        this.eventEmitter.emit("betting.running", {
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

  @Interval("multiple.updated", 5 * 1000)
  async handleNewCrashed() {
    const activeRound = await this.roundRepository.findCurrentRunningRound();

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

          this.logger.log(
            `Multiplicador atualizado para ${newMultiplier.toFixed(2)}x`,
          );

          this.eventEmitter.emit("multiplier.updated", {
            roundId: activeRound.id,
            multiplier: newMultiplier,
            crashPoint: activeRound.crashPoint,
          });
        }
      }
    }
  }

  @Interval(
    "betting.running",
    appConfig.bettingRunningCheckIntervalSeconds * 1000,
  )
  async handleNewBetting() {
    const activeRound = await this.roundRepository.findCurrentRunningRound();
    if (activeRound && activeRound.isRunning()) {
      if (Date.now() > new Date(activeRound.crashedAt).getTime()) {
        const tracingId = activeRound.id;
        this.logger.log(`[Trace:${tracingId}] Fase de running encerrada.`);
        activeRound.setStatus(RoundStatus.CRASHED);
        await Promise.all([
          this.roundRepository.saveRound(activeRound),
          this.provablyFairService.setSeedAsUsed(activeRound.clientSeed),
          this.betRepository.setPendingBetsToLost(activeRound.id),
        ]);
        this.logger.log(
          "Fase de running encerrada, emitindo evento de fase de crashed.",
        );

        this.eventEmitter.emit("betting.loose", {
          roundId: activeRound.id,
          tracingId: tracingId,
        });

        this.eventEmitter.emit("betting.crashed", {
          roundId: activeRound.id,
          round: activeRound,
          tracingId: tracingId,
        });
      }
    }
  }

  private calculateMultiplierInterpolation(
    startedAt: Date,
    crashedAt: Date,
    crashPoint: number,
  ): number {
    const now = Date.now();
    const startTime = startedAt.getTime();
    const crashTime = crashedAt.getTime();

    if (!startedAt || !crashedAt || !crashPoint || crashPoint <= 1.0) {
      this.logger.warn(
        "Parâmetros inválidos para interpolação de multiplicador",
      );
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
