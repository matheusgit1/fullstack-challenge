// services/games/src/application/services/provably-fair.service.ts

import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { createHash, randomBytes } from "crypto";
import { ProvablyFairSeed } from "@/infrastructure/database/orm/entites/provably-fair.entity";
import { RoundRepository } from "@/infrastructure/database/orm/repository/round.repository";

@Injectable()
export class ProvablyFairService {
  constructor(
    @InjectRepository(ProvablyFairSeed)
    private readonly seedRepository: Repository<ProvablyFairSeed>,
    private readonly roundRepository: RoundRepository,
  ) {}

  /**
   * Gera um novo seed para um jogador
   * @param userId - ID do jogador
   * @param clientSeed - Seed opcional do jogador (se não fornecer, gera um)
   */
  async generateNewSeed(clientSeed?: string): Promise<ProvablyFairSeed> {
    // Gerar server seed aleatório (32 bytes em hex = 64 caracteres)
    const serverSeed = randomBytes(32).toString("hex");

    // Calcular hash SHA-256 do server seed
    const serverSeedHash = createHash("sha256")
      .update(serverSeed)
      .digest("hex");

    // Usar clientSeed fornecido ou gerar um padrão
    const finalClientSeed = clientSeed || `jungle_${Date.now()}`;

    // Criar novo seed
    const seed = this.seedRepository.create({
      clientSeed: finalClientSeed,
      serverSeed,
      serverSeedHash,
      nonce: 0,
      isUsed: false,
    });

    return this.seedRepository.save(seed);
  }

  /**
   * Obtém o próximo seed ativo para um jogador
   * Se não houver seed ativo, gera um novo
   */
  async getActiveSeed(): Promise<ProvablyFairSeed> {
    // Buscar seed não usado mais recente
    let activeSeed = await this.seedRepository.findOne({
      where: { isUsed: false },
      order: { createdAt: "DESC" },
    });

    // Se não tiver seed ativo, gerar um novo
    if (!activeSeed) {
      activeSeed = await this.generateNewSeed();
    }

    return activeSeed;
  }

  /**
   * Obtém o próximo seed para uma nova rodada (usando o nonce atual)
   */
  async getNextSeedForRound(): Promise<{
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
    seedId: string;
  }> {
    const activeSeed = await this.getActiveSeed();

    return {
      serverSeed: activeSeed.serverSeed,
      serverSeedHash: activeSeed.serverSeedHash,
      clientSeed: activeSeed.clientSeed,
      nonce: activeSeed.nonce,
      seedId: activeSeed.id,
    };
  }

  /**
   * Incrementa o nonce após usar o seed em uma rodada
   */
  async incrementNonce(seedId: string): Promise<void> {
    await this.seedRepository.increment({ id: seedId }, "nonce", 1);
  }

  async calculateCrashPoint(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    houseEdgePercent: number = 1,
  ): Promise<number> {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;

    const hash = createHash("sha256").update(combined).digest("hex");

    const hex = hash.substring(0, 13);
    const int = parseInt(hex, 16);

    const max = Math.pow(2, 52);

    // fórmula padrão (usada em crash games)
    let crashPoint = (max / (int + 1)) * (1 - houseEdgePercent / 100);

    // mínimo 1.00x
    crashPoint = Math.max(1, crashPoint);

    return Math.floor(crashPoint * 100) / 100;
  }
  /**
   * Verifica se uma rodada é válida (provably fair)
   */
  async verifyRound(
    roundId: string,
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    expectedCrashPoint: number,
    houseEdgePercent: number = 1,
  ): Promise<{
    isValid: boolean;
    calculatedCrashPoint: number;
    serverSeedHash: string;
    expectedHash: string;
  }> {
    // Calcular hash esperado
    const expectedHash = createHash("sha256").update(serverSeed).digest("hex");

    // Recalcular crash point
    const calculatedCrashPoint = await this.calculateCrashPoint(
      serverSeed,
      clientSeed,
      nonce,
      houseEdgePercent,
    );

    const isValid = Math.abs(calculatedCrashPoint - expectedCrashPoint) < 0.01;

    return {
      isValid,
      calculatedCrashPoint,
      serverSeedHash: expectedHash,
      expectedHash,
    };
  }

  /**
   * Marca um seed como usado (quando jogador troca de seed)
   */
  async markSeedAsUsed(seedId: string): Promise<void> {
    await this.seedRepository.update(seedId, {
      isUsed: true,
      usedAt: new Date(),
    });
  }

  /**
   * Troca para um novo seed (jogador pode solicitar)
   */
  async rotateSeed(newClientSeed?: string): Promise<ProvablyFairSeed> {
    // Marcar seed atual como usado
    const currentSeed = await this.getActiveSeed();
    if (currentSeed) {
      await this.markSeedAsUsed(currentSeed.id);
    }

    // Gerar novo seed
    return this.generateNewSeed(newClientSeed);
  }

  /**
   * Obtém histórico de seeds de um jogador
   */
  async getUserSeedsHistory(
    page: number = 1,
    limit: number = 20,
  ): Promise<[ProvablyFairSeed[], number]> {
    const skip = (page - 1) * limit;

    return this.seedRepository.findAndCount({
      order: { createdAt: "DESC" },
      skip,
      take: limit,
    });
  }

  async getProvablyFairDataForRound(
    roundId: string,
  ): Promise<ProvablyFairSeed> {
    // Buscar round com a relação do provably fair seed
    const round = await this.roundRepository.findOne({
      where: { id: roundId },
    });

    console.log("Round encontrado:", round);

    if (!round) {
      throw new BadRequestException("Round não encontrado");
    }

    const fair = await this.seedRepository.findOne({
      where: { clientSeed: round.clientSeed || "" },
    });

    console.log("Seed encontrada para o round:", fair);

    if (!fair) {
      throw new BadRequestException("Seed não encontrada para o round");
    }

    return fair;

    // Se o round não tem um seed específico, buscar o último seed ativo
  }
}
