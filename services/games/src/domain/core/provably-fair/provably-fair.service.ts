import { ProvablyFairSeed } from '@/infrastructure/database/orm/entites/provably-fair.entity';

export interface IProvablyFairData {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  seedId: string;
}

export interface IVerificationResult {
  isValid: boolean;
  calculatedCrashPoint: number;
  serverSeedHash: string;
  expectedHash: string;
}

export interface IProvablyFairService {
  generateNewSeed(clientSeed?: string): Promise<ProvablyFairSeed>;
  getActiveSeed(): Promise<ProvablyFairSeed>;
  getNextSeedForRound(): Promise<IProvablyFairData>;
  incrementNonce(seedId: string): Promise<void>;
  calculateCrashPoint(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    houseEdgePercent?: number,
  ): Promise<number>;
  verifyRound(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    expectedCrashPoint: number,
    houseEdgePercent?: number,
  ): Promise<IVerificationResult>;
  setSeedAsUsed(clientSeed: string): Promise<void>;
  rotateSeed(newClientSeed?: string): Promise<ProvablyFairSeed>;
  getUserSeedsHistory(page?: number, limit?: number): Promise<[ProvablyFairSeed[], number]>;
  getProvablyFairRound(roundId: string): Promise<ProvablyFairSeed | null>;
}

export const PROVABY_SERVICE = Symbol('IProvablyFairService');
