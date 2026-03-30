import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundRepository } from "../database/orm/repository/round.repository";
import { RoundStatus } from "@/presentation/dtos";
import { GameEngineService } from "@/application/services/game-engine/game-engine.service";

@Injectable()
export class TimerService {
  private readonly logger = new Logger(TimerService.name);
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly roundRepository: RoundRepository,
    private readonly gameEngineService: GameEngineService,
  ) {}

  @Interval("betting.phase", 1000 * 15)
  async handleBettingPhase() {
    const activeRound = await this.roundRepository.findCurrentRound();
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

  @Interval("betting.running", 1000 * 60)
  async handleNewBetting() {
    const activeRound = await this.roundRepository.findCurrentRound();
    if (activeRound && activeRound.isRunning()) {
      if (new Date() > activeRound.crashedAt) {
        activeRound.status = RoundStatus.CRASHED;
        await this.roundRepository.saveRound(activeRound);
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
