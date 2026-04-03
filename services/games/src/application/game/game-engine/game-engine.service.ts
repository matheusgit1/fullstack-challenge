import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  Round,
  RoundStatus,
} from "@/infrastructure/database/orm/entites/round.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { appConfig } from "@/configs/app.config";
import { type IGameEngineService } from "@/domain/game/game.engine";
import {
  type IRoundRepository,
  ROUND_REPOSITORY,
} from "@/domain/orm/repositories/round.repository";
import {
  type IProvablyFairService,
  PROVABY_SERVICE,
} from "@/domain/core/provably-fair/provably-fair.service";
import {
  BET_REPOSITORY,
  type IBetRepository,
} from "@/domain/orm/repositories/bet.repository";

@Injectable()
export class GameEngineService implements IGameEngineService {
  private readonly logger = new Logger(GameEngineService.name);

  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
    @Inject(PROVABY_SERVICE)
    private readonly provablyFairService: IProvablyFairService,
    @Inject(BET_REPOSITORY)
    private readonly betRepository: IBetRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  public async startNewRound(): Promise<void> {
    this.logger.log("Starting new betting round...");
    const { houseEdgePercent, bettingDurationSeconds } = appConfig;
    const { serverSeed, serverSeedHash, clientSeed, nonce } =
      await this.provablyFairService.getNextSeedForRound();

    const crashPoint = await this.provablyFairService.calculateCrashPoint(
      serverSeed,
      clientSeed,
      nonce,
      houseEdgePercent,
    );

    const bettingEndsAt = new Date(Date.now() + bettingDurationSeconds * 1000);
    const startedAt = new Date(bettingEndsAt.getTime() + 500);
    const timeToCrashMs = this.calculateTimeToCrash(crashPoint, 0.001) * 1000;

    const crashedAt = new Date(startedAt.getTime() + timeToCrashMs);

    const round = new Round({
      status: RoundStatus.BETTING,
      multiplier: 1.0,
      crashPoint: crashPoint,
      bettingStartedAt: new Date(),
      bettingEndsAt: bettingEndsAt,
      startedAt: startedAt,
      crashedAt: crashedAt,
      serverSeed: serverSeed,
      serverSeedHash: serverSeedHash,
      clientSeed: clientSeed,
      nonce: nonce,
      bets: [],
    });

    const currentRound = await this.roundRepository.createRound(round);

    this.logger.log(`Round created: ${currentRound.id}`);
    this.logger.log(`- Crash point: ${crashPoint}x (secret)`);
    this.logger.log(
      `- Server seed hash: ${serverSeedHash.substring(0, 16)}...`,
    );
    this.logger.log(`- Betting ends at: ${bettingEndsAt.toISOString()}`);

    this.eventEmitter.emit("round.betting.started", {
      roundId: currentRound.id,
      bettingEndsAt: currentRound.bettingEndsAt,
      serverSeedHash: currentRound.serverSeedHash,
    });
  }

  public async endRound(round?: Round): Promise<void> {
    const currentRound =
      round ?? (await this.roundRepository.findCurrentRunningRound());
    if (!currentRound) return;
    currentRound.setStatus(RoundStatus.CRASHED);
    await Promise.all([
      this.roundRepository.saveRound(currentRound),
      this.provablyFairService.setSeedAsUsed(currentRound.clientSeed),
      this.betRepository.setPendingBetsToLost(currentRound.id),
    ]);
    this.logger.log(
      "Fase de running encerrada, emitindo evento de fase de crashed.",
    );
  }

  public async runningRound(round?: Round): Promise<void> {
    const currentRound =
      round ?? (await this.roundRepository.findCurrentRunningRound());
    if (!currentRound) return;
    currentRound.setStatus(RoundStatus.RUNNING);
    await this.roundRepository.saveRound(currentRound);
  }

  private calculateTimeToCrash(crashPoint: number, k: number = 0.1): number {
    return Math.log(crashPoint) / k;
  }
}
