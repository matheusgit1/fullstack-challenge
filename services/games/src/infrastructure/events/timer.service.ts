import { Injectable, Logger } from "@nestjs/common";
import { Cron, Interval, Timeout } from "@nestjs/schedule";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ConfigService } from "@nestjs/config";
import { RoundRepository } from "../database/orm/repository/round.repository";
import { RoundStatus } from "@/presentation/dtos";
import { GameEngineService } from "@/application/services/game-engine/game-engine.service";

//TODO migrar para cron e configuração customizaveis (não esticas) para os timers, validar se há timers concorrentes, etc
@Injectable()
export class TimerService {
  private readonly logger = new Logger(TimerService.name);
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly roundRepository: RoundRepository,
    private readonly gameEngineService: GameEngineService,
  ) {}

  @Interval("betting.phase", 1000 * 10)
  async handleBettingPhase() {
    //validar se há rounds criados/ativos, se houver pular o evento
    const activeRound = await this.roundRepository.findActiveRound();
    if (activeRound && activeRound.isBettingPhase()) {
      //validar intervalo para a fase de betting, se o tempo de betting tiver expirado, emitir evento para fase de running
      if (activeRound.bettingEndsAt < new Date(Date.now())) {
        //setar para fase de running
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

  @Interval("betting.running", 1000 * 10)
  async handleNewBetting() {
    //valida se há rounds em fase de running, comaprar com timer pré computado para encerrar a fase de running e crashar o game
    const activeRound = await this.roundRepository.findActiveRound();
    if (activeRound && activeRound.isRunning()) {
      //validar se o tempo de execução da fase de running já passou, se tiver passado, emitir evento para fase de crashed
      if (new Date() > activeRound.crashedAt) {
        //setar para fase de crashed
        activeRound.status = RoundStatus.CRASHED;
        // activeRound.crashedAt = new Date();
        await this.roundRepository.saveRound(activeRound);
        this.logger.log(
          "Fase de running encerrada, emitindo evento de fase de crashed.",
        );

        this.eventEmitter.emit("betting.crashed", {
          roundId: activeRound.id,
          round: activeRound,
        });

        // await this.gameEngineService.startNewRound();
      }
    }
  }
}
