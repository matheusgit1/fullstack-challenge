// services/games/src/application/services/game-engine.service.ts

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ProvablyFairService } from "../provably-fair/provably-fair.service";
import {
  Round,
  RoundStatus,
} from "@/infrastructure/database/orm/entites/round.entity";
import { RoundRepository } from "@/infrastructure/database/orm/repository/round.repository";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { appConfig } from "@/configs/app.config";

@Injectable()
export class GameEngineService {
  private readonly logger = new Logger(GameEngineService.name);
  private currentRound: Round | null = null;

  constructor(
    private readonly roundRepository: RoundRepository,
    private readonly provablyFairService: ProvablyFairService,
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

    this.currentRound = await this.roundRepository.createRound(round);

    this.logger.log(`Round created: ${this.currentRound.id}`);
    this.logger.log(`  - Crash point: ${crashPoint}x (secret)`);
    this.logger.log(
      `  - Server seed hash: ${serverSeedHash.substring(0, 16)}...`,
    );
    this.logger.log(`  - Betting ends at: ${bettingEndsAt.toISOString()}`);

    this.eventEmitter.emit("round.betting.started", {
      roundId: this.currentRound.id,
      bettingEndsAt: this.currentRound.bettingEndsAt,
      serverSeedHash: this.currentRound.serverSeedHash,
    });
  }

  calculateTimeToCrash(crashPoint: number, k: number = 0.1): number {
    return Math.log(crashPoint) / k;
  }
}
