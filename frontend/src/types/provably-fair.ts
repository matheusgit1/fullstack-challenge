export interface ProvablyFairAuditResponse {
  success: boolean;
  data: ProvablyFairData;
  tracingId: string;
  timestamp: string;
}

export interface ProvablyFairData {
  fairId: string;
  serverSeed: string | "secret";
  serverSeedHash: string | "secret";
  clientSeed: string | "secret";
  nonce: number;
  isValid: boolean | null;
  realCrashPoint: number | "secret" | null;
  maxMultiplierReached: number;
  deviation: number | "secret" | null;
  houseEdgePercent: number;
  formula: string;
  round: RoundAuditInfo;
  timing: TimingAuditInfo;
  deterministicCheck: DeterministicCheck;
}

export interface RoundAuditInfo {
  roundId: string;
  status: string;
  crashPoint: number | "secret" | null;
  multiplier: number | null;
  roundStartedAt: string;
  roundCrashedAt: string | null | "secret";
  serverSeedHash: string | null | "secret";
  bettingEndsAt: string | null;
  bettingStartedAt: string | null;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null | "secret";
  // bets: any[]; //não preciso das bets aqui
  totalAmount: number;
  totalBets: number;
}

export interface TimingAuditInfo {
  startedAt: string | null;
  crashedAt: string | null;
  roundDurationMs: number | null;
  roundDurationSeconds: number | null;
  estimatedCrashDurationMs: number | null;
  estimatedCrashDurationSeconds: number | null;
  timingDriftMs: number | null;
  timingIsConsistent: boolean;
  theoreticalMaxMultiplierAtCrash: number | null;
  maxMultiplierDeviation: number | null;
  earlyTermination: boolean;
}

export interface DeterministicCheck {
  seedIsUnused: boolean;
  resultIsRepeatable: boolean;
  verificationHash: string;
}
