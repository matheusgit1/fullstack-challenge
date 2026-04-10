import { createHash, randomBytes } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type IProvablyFairService } from '@/domain/core/provably-fair/provably-fair.service';
import { ProvablyFairSeed } from '@/infrastructure/database/orm/entites/provably-fair.entity';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';

@Injectable()
export class ProvablyFairService implements IProvablyFairService {
  constructor(
    @InjectRepository(ProvablyFairSeed)
    private readonly seedRepository: Repository<ProvablyFairSeed>,
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
  ) {}

  async generateNewSeed(clientSeed?: string): Promise<ProvablyFairSeed> {
    const serverSeed = randomBytes(32).toString('hex');
    const serverSeedHash = createHash('sha256').update(serverSeed).digest('hex');

    const finalClientSeed = clientSeed || `jungle_${Date.now()}`;

    const seed = this.seedRepository.create({
      clientSeed: finalClientSeed,
      serverSeed,
      serverSeedHash,
      nonce: 0,
      isUsed: false,
    });

    return this.seedRepository.save(seed);
  }

  async getActiveSeed(): Promise<ProvablyFairSeed> {
    let activeSeed = await this.seedRepository.findOne({
      where: { isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (!activeSeed) {
      activeSeed = await this.generateNewSeed();
    }

    return activeSeed;
  }

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

  async incrementNonce(seedId: string): Promise<void> {
    await this.seedRepository.increment({ id: seedId }, 'nonce', 1);
  }

  async calculateCrashPoint(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    houseEdgePercent: number = 1,
  ): Promise<number> {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;
    const hash = createHash('sha256').update(combined).digest('hex');
    const hex = hash.substring(0, 13);
    const int = parseInt(hex, 16);
    const max = Math.pow(2, 52);

    let crashPoint = (max / (int + 1)) * (1 - houseEdgePercent / 100);

    crashPoint = Math.max(1, crashPoint);

    return Math.floor(crashPoint * 100) / 100;
  }

  async verifyRound(
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
    const expectedHash = createHash('sha256').update(serverSeed).digest('hex');

    const calculatedCrashPoint = await this.calculateCrashPoint(serverSeed, clientSeed, nonce, houseEdgePercent);

    const isValid = Math.abs(calculatedCrashPoint - expectedCrashPoint) < 0.01;

    return {
      isValid,
      calculatedCrashPoint,
      serverSeedHash: expectedHash,
      expectedHash,
    };
  }

  async setSeedAsUsed(clientSeedId: string): Promise<void> {
    await this.seedRepository.update(
      { clientSeed: clientSeedId },
      {
        isUsed: true,
        usedAt: new Date(),
      },
    );
  }

  async rotateSeed(newClientSeed?: string): Promise<ProvablyFairSeed> {
    // Marcar seed atual como usado
    const currentSeed = await this.getActiveSeed();
    if (currentSeed) {
      await this.setSeedAsUsed(currentSeed.clientSeed);
    }

    return this.generateNewSeed(newClientSeed);
  }

  async getUserSeedsHistory(page: number = 1, limit: number = 20): Promise<[ProvablyFairSeed[], number]> {
    const skip = (page - 1) * limit;

    return this.seedRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
  }

  async getProvablyFairRound(roundId: string): Promise<ProvablyFairSeed | null> {
    const round = await this.roundRepository.findByRoundId(roundId);

    if (!round) {
      return null;
    }

    const fair = await this.seedRepository.findOne({
      where: { clientSeed: round.clientSeed || '' },
    });

    if (!fair) {
      return null;
    }

    return fair;
  }
}
