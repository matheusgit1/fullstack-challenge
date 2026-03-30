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

  @Interval("multiple.updated", 5 * 1000)
  async handleNewCrashed() {
    const activeRound = await this.roundRepository.findCurrentRunningRound();
    console.log("multiple.updated: ", activeRound);
    console.log(activeRound && activeRound.isRunning());
    if (activeRound && activeRound.isRunning()) {
      if (Date.now() < new Date(activeRound.crashedAt).getTime()) {
        const newMultiplier = this.calculateMultiplierInterpolation(
          activeRound.startedAt,
          activeRound.crashedAt,
          activeRound.crashPoint,
        );


        if (newMultiplier > activeRound.multiplier) {
          activeRound.multiplier = newMultiplier;
          await this.roundRepository.saveRound(activeRound);

          this.logger.log(
            `Multiplicador atualizado para ${newMultiplier.toFixed(2)}x`,
          );

          // Emitir evento de atualização do multiplicador
          this.eventEmitter.emit("multiplier.updated", {
            roundId: activeRound.id,
            multiplier: newMultiplier,
            crashPoint: activeRound.crashPoint
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

  /**
   * Calcula o multiplicador interpolado baseado no tempo decorrido
   *
   * Lógica de interpolação:
   * - Começa em 1.0x quando a rodada inicia
   * - Aumenta linearmente até o crashPoint conforme o tempo passa
   * - Nunca excede o crashPoint (mesmo que haja atrasos)
   *
   * Exemplo:
   * - crashPoint = 5.0x
   * - Tempo total = 60 segundos
   * - Após 30 segundos: multiplicador ≈ 3.0x
   * - Após 45 segundos: multiplicador ≈ 4.0x
   * - Após 60 segundos: multiplicador = 5.0x (crash)
   *
   * @param startedAt - Data/hora que a rodada começou
   * @param crashedAt - Data/hora prevista para o crash
   * @param crashPoint - Multiplicador máximo (ponto de crash)
   * @returns Multiplicador interpolado (mínimo 1.0, máximo crashPoint)
   */
  private calculateMultiplierInterpolation(
    startedAt: Date,
    crashedAt: Date,
    crashPoint: number,
  ): number {
    const now = Date.now();
    const startTime = startedAt.getTime();
    const crashTime = crashedAt.getTime();

    // Validações de segurança
    if (!startedAt || !crashedAt || !crashPoint || crashPoint <= 1.0) {
      this.logger.warn(
        "Parâmetros inválidos para interpolação de multiplicador",
      );
      return 1.0;
    }

    // Se ainda não começou ou já passou do tempo de crash
    if (now <= startTime || now >= crashTime) {
      return 1.0;
    }

    // Tempo total da rodada (em ms)
    const totalDuration = crashTime - startTime;

    // Tempo decorrido desde o início (em ms)
    const elapsedTime = now - startTime;

    // Progresso temporal (0.0 a 1.0)
    const timeProgress = elapsedTime / totalDuration;

    // Interpolação linear: de 1.0 até crashPoint
    // Fórmula: 1.0 + (crashPoint - 1.0) * progress
    const interpolatedMultiplier = 1.0 + (crashPoint - 1.0) * timeProgress;

    // Garantir que não exceda o crashPoint (segurança extra)
    const finalMultiplier = Math.min(interpolatedMultiplier, crashPoint);

    // Arredondar para 2 casas decimais (evita valores estranhos como 1.23456...)
    return Math.round(finalMultiplier * 100) / 100;
  }
}
