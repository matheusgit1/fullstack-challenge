import { createHash } from 'crypto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type IProvablyFairService, PROVABY_SERVICE } from '@/domain/core/provably-fair/provably-fair.service';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';
import { RoundAuditResponseDto } from '../dtos/response/round-audit-response.dto';
import { RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';

const HOUSE_EDGE_PERCENT = 1;
const GROWTH_K = 0.001;
const SCHEDULER_INTERVAL_MS = 10000;
const PROCESSING_MARGIN_MS = 500;
const MAX_ACCEPTABLE_DRIFT_MS = SCHEDULER_INTERVAL_MS + PROCESSING_MARGIN_MS;

function calculateCrashPoint(serverSeed: string, clientSeed: string, nonce: number, houseEdgePercent: number): number {
  const combined = `${serverSeed}:${clientSeed}:${nonce}`;
  const hash = createHash('sha256').update(combined).digest('hex');
  const hex = hash.substring(0, 13);
  const int = parseInt(hex, 16);
  const max = Math.pow(2, 52);
  const crashPoint = (max / (int + 1)) * (1 - houseEdgePercent / 100);
  return Math.floor(Math.max(1, crashPoint) * 100) / 100;
}

function calculateTimeToCrashMs(crashPoint: number): number {
  if (crashPoint <= 1) return 0;
  return (Math.log(crashPoint) / GROWTH_K) * 1000;
}

function interpolateMultiplier(startedAt: Date, crashedAt: Date, crashPoint: number, atTime: Date): number {
  const startTime = startedAt.getTime();
  const crashTime = crashedAt.getTime();
  const t = atTime.getTime();

  if (t <= startTime || t >= crashTime) return 1.0;

  const totalDuration = crashTime - startTime;
  const elapsed = t - startTime;
  const progress = elapsed / totalDuration;
  const interpolated = 1.0 + (crashPoint - 1.0) * progress;
  return Math.round(Math.min(interpolated, crashPoint) * 100) / 100;
}

function buildFormula(serverSeed: string, clientSeed: string, nonce: number, houseEdgePercent: number): string {
  const combined = `${serverSeed}:${clientSeed}:${nonce}`;
  const hash = createHash('sha256').update(combined).digest('hex');
  const hex = hash.substring(0, 13);
  const int = parseInt(hex, 16);
  const max = Math.pow(2, 52);
  const edge = 1 - houseEdgePercent / 100;

  return [
    `combined   = "${combined}"`,
    `sha256     = "${hash}"`,
    `hex13      = "${hex}"`,
    `H          = ${int}`,
    `max        = 2^52 = ${max}`,
    `edge       = 1 - ${houseEdgePercent}% = ${edge}`,
    `crashPoint = floor(max / (H + 1) * edge * 100) / 100`,
    `           = floor(${max} / ${int + 1} * ${edge} * 100) / 100`,
    `timeToCrash (s) = ln(crashPoint) / k = ln(?) / ${GROWTH_K}`,
  ].join('\n');
}

@Injectable()
export class AuditRoundUsecase {
  constructor(
    @Inject(PROVABY_SERVICE)
    private readonly provablyFairService: IProvablyFairService,
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
  ) {}

  async handler(roundId: string): Promise<RoundAuditResponseDto> {
    const [round, fair] = await Promise.all([
      this.roundRepository.findByRoundId(roundId),
      this.provablyFairService.getProvablyFairRound(roundId),
    ]);

    if (!round) throw new NotFoundException(`Round ${roundId} não encontrado`);
    if (!fair) throw new NotFoundException(`Provably fair não encontrado para o round ${roundId}`);

    const calculatedCrashPoint = calculateCrashPoint(fair.serverSeed, fair.clientSeed, fair.nonce, HOUSE_EDGE_PERCENT);
    const recalculated = calculateCrashPoint(fair.serverSeed, fair.clientSeed, fair.nonce, HOUSE_EDGE_PERCENT);
    const resultIsRepeatable = recalculated === calculatedCrashPoint;

    const realCrashPoint = round.crashPoint ?? null;
    const deviation = realCrashPoint != null ? Math.abs(calculatedCrashPoint - realCrashPoint) : 0;
    const isValid = realCrashPoint != null ? deviation < 0.01 : false;

    const serverSeedHash = createHash('sha256').update(fair.serverSeed).digest('hex');
    const verificationHash = createHash('sha256')
      .update(`${fair.serverSeed}:${fair.clientSeed}:${fair.nonce}:${calculatedCrashPoint}`)
      .digest('hex');

    const startedAt = new Date(round.bettingEndsAt);
    const crashedAt = new Date(round.crashedAt);
    const endedAt: Date | null = round.endedAt
      ? new Date(round.endedAt)
      : round.crashedAt
        ? new Date(round.crashedAt)
        : null;

    const estimatedCrashDurationMs = calculateTimeToCrashMs(calculatedCrashPoint);

    const roundDurationMs = endedAt ? endedAt.getTime() - startedAt.getTime() : null;

    const timingDriftMs = roundDurationMs !== null ? roundDurationMs - estimatedCrashDurationMs : null;

    const timeIsConsistenceByCrashDate = crashedAt.getTime() - startedAt.getTime();
    const timeIdConsistenceByEndedDate = endedAt ? endedAt.getTime() - startedAt.getTime() : 0;

    const timingIsConsistent =
      estimatedCrashDurationMs <= (roundDurationMs || 0) &&
      estimatedCrashDurationMs <= timeIsConsistenceByCrashDate &&
      estimatedCrashDurationMs <= timeIdConsistenceByEndedDate;

    const theoreticalMaxMultiplierAtCrash = endedAt
      ? interpolateMultiplier(startedAt, endedAt, calculatedCrashPoint, endedAt)
      : null;

    const maxMultiplierDeviation =
      round.multiplier != null && theoreticalMaxMultiplierAtCrash != null
        ? parseFloat(Math.abs(round.multiplier - theoreticalMaxMultiplierAtCrash).toFixed(4))
        : null;

    console.log('tempos estimado: ', estimatedCrashDurationMs, 'real: ', roundDurationMs, 'diferenca: ', timingDriftMs);
    console.log('time consistence: ', timingIsConsistent, MAX_ACCEPTABLE_DRIFT_MS);

    return new RoundAuditResponseDto({
      fairId: fair.id,
      serverSeed: this.getPropertyByRoundStatus(round.status, fair.serverSeed),
      serverSeedHash: this.getPropertyByRoundStatus(round.status, serverSeedHash),
      clientSeed: this.getPropertyByRoundStatus(round.status, fair.clientSeed),
      nonce: fair.nonce,
      isValid,
      calculatedCrashPoin: this.getPropertyByRoundStatus(round.status, calculatedCrashPoint),
      realCrashPoint: this.getPropertyByRoundStatus(round.status, realCrashPoint),
      maxMultiplierReached: round.multiplier ?? realCrashPoint,
      deviation: this.getPropertyByRoundStatus(round.status, parseFloat(deviation.toFixed(4))),
      houseEdgePercent: HOUSE_EDGE_PERCENT,
      formula: buildFormula(fair.serverSeed, fair.clientSeed, fair.nonce, HOUSE_EDGE_PERCENT),

      round: {
        roundId: round.id,
        status: round.status,
        crashPoint: this.getPropertyByRoundStatus(round.status, round.crashPoint),
        multiplier: round.multiplier ?? null,
        roundStartedAt: round.startedAt,
        roundCrashedAt: this.getPropertyByRoundStatus(round.status, round.crashedAt ?? null),
        serverSeedHash: this.getPropertyByRoundStatus(round.status, round.serverSeedHash ?? null),
        bettingEndsAt: round.bettingEndsAt ?? null,
        bettingStartedAt: round.bettingStartedAt ?? null,
        createdAt: round.createdAt,
        updatedAt: round.updatedAt,
        endedAt: this.getPropertyByRoundStatus(round.status, round.endedAt),
        bets: round.bets,
        totalAmount: round.bets.reduce((acc, bet) => acc + bet.amount, 0),
        totalBets: round.bets.length,
      },

      timing: {
        startedAt,
        endedAt: round.endedAt,
        crashedAt: round.crashedAt ? new Date(round.crashedAt) : null,
        roundDurationMs,
        roundDurationSeconds: roundDurationMs != null ? parseFloat((roundDurationMs / 1000).toFixed(2)) : null,
        estimatedCrashDurationMs: parseFloat(estimatedCrashDurationMs.toFixed(0)),
        estimatedCrashDurationSeconds: parseFloat((estimatedCrashDurationMs / 1000).toFixed(2)),
        timingDriftMs: timingDriftMs != null ? parseFloat(timingDriftMs.toFixed(0)) : null,
        timingIsConsistent,
        theoreticalMaxMultiplierAtCrash,
        maxMultiplierDeviation,
        earlyTermination: timingDriftMs != null && timingDriftMs < 0,
      },

      deterministicCheck: {
        seedIsUnused: !fair.isUsed,
        resultIsRepeatable,
        verificationHash,
      },
    });
  }
  getPropertyByRoundStatus(roundStatus: RoundStatus, property: any) {
    return [RoundStatus.RUNNING, RoundStatus.BETTING].includes(roundStatus) ? 'secret' : property;
  }
}
