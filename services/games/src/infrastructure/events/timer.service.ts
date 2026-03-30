import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundRepository } from "../database/orm/repository/round.repository";
import { RoundStatus } from "@/presentation/dtos";
import { GameEngineService } from "@/application/services/game-engine/game-engine.service";
import { appConfig } from "configs/app.config";
import { ProvablyFairService } from "@/application/services/provably-fair/provably-fair.service";

@Injectable()
export class TimerService {
  private readonly logger = new Logger(TimerService.name);
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly roundRepository: RoundRepository,
    private readonly gameEngineService: GameEngineService,
    private readonly provablyFairService: ProvablyFairService,
  ) {}

  @Interval("betting.phase", appConfig.bettingDurationSeconds * 1000)
  async handleBettingPhase() {
    const activeRound = await this.roundRepository.findCurrentBettingRound();
    if (activeRound && activeRound.isBettingPhase()) {
      if (activeRound.bettingEndsAt < new Date(Date.now())) {
        activeRound.status = RoundStatus.RUNNING;
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

  @Interval(
    "betting.running",
    appConfig.bettingRunningCheckIntervalSeconds * 1000,
  )
  async handleNewBetting() {
    const activeRound = await this.roundRepository.findCurrentRunningRound();
    if (activeRound && activeRound.isRunning()) {
      if (Date.now() > new Date(activeRound.crashedAt).getTime()) {
        activeRound.status = RoundStatus.CRASHED;
        await this.roundRepository.saveRound(activeRound);
        await this.provablyFairService.markSeedAsUsed(activeRound.clientSeed);
        this.logger.log(
          "Fase de running encerrada, emitindo evento de fase de crashed.",
        );

        this.eventEmitter.emit("betting.crashed", {
          roundId: activeRound.id,
          round: activeRound,
        });
      }
    }
  }
}
