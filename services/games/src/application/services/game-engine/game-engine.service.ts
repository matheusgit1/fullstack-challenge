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

@Injectable()
export class GameEngineService {
  private readonly logger = new Logger(GameEngineService.name);
  private currentRound: Round | null = null;

  constructor(
    private readonly roundRepository: RoundRepository,
    private readonly provablyFairService: ProvablyFairService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  public async startNewRound(): Promise<void> {
    this.logger.log("Starting new betting round...");
    const { serverSeed, serverSeedHash, clientSeed, nonce } =
      await this.provablyFairService.getNextSeedForRound();

    const crashPoint = await this.provablyFairService.calculateCrashPoint(
      serverSeed,
      clientSeed,
      nonce,
      this.configService.get("HOUSE_EDGE_PERCENT", 1),
    );

    const bettingDurationSeconds = this.configService.get(
      "BETTING_DURATION_SECONDS",
      10,
    );
    const bettingEndsAt = new Date(Date.now() + bettingDurationSeconds * 1000);
    const startedAt = new Date(bettingEndsAt.getTime() + 500);
    const timeToCrashMs = this.calculateTimeToCrash(crashPoint, 0.001) * 1000;

    const crashedAt = new Date(startedAt.getTime() + timeToCrashMs);
    console.log(`round dados: `, {
      status: RoundStatus.BETTING,
      multiplier: 1.0, // Começa em 1.0
      crashPoint: crashPoint, // ✅ JÁ DEFINIDO (mas oculto!)
      bettingEndsAt: bettingEndsAt,
      startedAt: startedAt,
      crashedAt: crashedAt,
      serverSeed: serverSeed, // Seed completo (secreto)
      serverSeedHash: serverSeedHash, // Hash (público)
      clientSeed: clientSeed, // Client seed
      nonce: nonce, // Número sequencial
      bets: [], // Sem apostas ainda
    });

    // 4. Criar a entidade Round com TODOS os dados
    const round = new Round({
      status: RoundStatus.BETTING,
      multiplier: 1.0, // Começa em 1.0
      crashPoint: crashPoint, // ✅ JÁ DEFINIDO (mas oculto!)
      bettingStartedAt: new Date(),
      bettingEndsAt: bettingEndsAt,
      startedAt: startedAt,
      crashedAt: crashedAt,
      serverSeed: serverSeed, // Seed completo (secreto)
      serverSeedHash: serverSeedHash, // Hash (público)
      clientSeed: clientSeed, // Client seed
      nonce: nonce, // Número sequencial
      bets: [], // Sem apostas ainda
    });

    // 5. Salvar no banco
    this.currentRound = await this.roundRepository.createRound(round);

    this.logger.log(`Round created: ${this.currentRound.id}`);
    this.logger.log(`  - Crash point: ${crashPoint}x (secret)`);
    this.logger.log(
      `  - Server seed hash: ${serverSeedHash.substring(0, 16)}...`,
    );
    this.logger.log(`  - Betting ends at: ${bettingEndsAt.toISOString()}`);

    // 6. Emitir evento para WebSocket (SÓ O HASH, NÃO O CRASH POINT!)
    this.eventEmitter.emit("round.betting.started", {
      roundId: this.currentRound.id,
      bettingEndsAt: this.currentRound.bettingEndsAt,
      serverSeedHash: this.currentRound.serverSeedHash,
      // crashPoint NÃO é enviado!
    });

    // 7. Iniciar timer para terminar fase de apostas
    // this.startBettingTimer();
  }

  /**
   * Inicia fase de execução (multiplicador subindo)
   */
  private async startRunningPhase(): Promise<void> {
    if (!this.currentRound) return;

    this.logger.log(`Starting running phase for round ${this.currentRound.id}`);
    this.logger.log(
      `  - Crash point will be at: ${this.currentRound.crashPoint}x`,
    );

    // Atualizar status
    this.currentRound.status = RoundStatus.RUNNING;
    this.currentRound.startedAt = new Date();
    await this.roundRepository.saveRound(this.currentRound);

    // Emitir evento (ainda sem revelar crash point!)
    this.eventEmitter.emit("round.started", {
      roundId: this.currentRound.id,
      serverSeedHash: this.currentRound.serverSeedHash,
      // crashPoint NÃO é enviado ainda!
    });

    // Iniciar simulação do multiplicador subindo
    this.startMultiplierSimulation();
  }

  /**
   * Simula o multiplicador subindo até o crash point
   */
  private startMultiplierSimulation(): void {
    if (!this.currentRound?.crashPoint) return;

    const crashPoint = this.currentRound.crashPoint;
    const startTime = Date.now();
    const updateInterval = this.configService.get(
      "MULTIPLIER_UPDATE_INTERVAL_MS",
      100,
    );

    const interval = setInterval(async () => {
      if (
        !this.currentRound ||
        this.currentRound.status !== RoundStatus.RUNNING
      ) {
        clearInterval(interval);
        return;
      }

      // Calcular multiplicador baseado no tempo (curva exponencial)
      const elapsed = (Date.now() - startTime) / 1000;
      // Fórmula: 1 + (elapsed ^ 1.5) * 2
      let multiplier = 1 + Math.pow(elapsed, 1.5) * 2;

      // Limitar ao crash point
      multiplier = Math.min(multiplier, crashPoint);

      // Atualizar no banco
      this.currentRound.multiplier = multiplier;
      await this.roundRepository.saveRound(this.currentRound);

      // Emitir evento WebSocket
      this.eventEmitter.emit("round.multiplier.updated", {
        roundId: this.currentRound.id,
        multiplier,
      });

      // Verificar se crashou
      if (multiplier >= crashPoint) {
        clearInterval(interval);
        await this.crashRound();
      }
    }, updateInterval);
  }

  /**
   * Finaliza rodada com crash
   */
  private async crashRound(): Promise<void> {
    if (!this.currentRound) return;

    this.logger.log(
      `Round ${this.currentRound.id} CRASHED at ${this.currentRound.crashPoint}x`,
    );

    // Atualizar status
    this.currentRound.status = RoundStatus.CRASHED;
    this.currentRound.crashedAt = new Date();
    await this.roundRepository.saveRound(this.currentRound);

    // AGORA revelamos o serverSeed completo!
    this.eventEmitter.emit("round.crashed", {
      roundId: this.currentRound.id,
      crashPoint: this.currentRound.crashPoint,
      serverSeed: this.currentRound.serverSeed, // REVELADO AGORA!
      clientSeed: this.currentRound.clientSeed,
      nonce: this.currentRound.nonce,
      serverSeedHash: this.currentRound.serverSeedHash,
    });

    // Processar apostas perdidas...
    // Iniciar cooldown...
  }

  calculateTimeToCrash(crashPoint: number, k: number = 0.1): number {
    return Math.log(crashPoint) / k; // tempo em segundos
  }
}
