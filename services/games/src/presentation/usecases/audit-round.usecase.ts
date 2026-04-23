import { ProvablyFairUtil } from './../../application/game/provably-fair/provably-fair.util';
import { createHash } from 'crypto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type IProvablyFairService, PROVABY_SERVICE } from '@/domain/core/provably-fair/provably-fair.service';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';
import { RoundAuditResponseDto } from '../dtos/response/round-audit-response.dto';
import { RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';
import { provablyFairConfig } from '@/configs/provably-fair.config';

const { HOUSE_EDGE_PERCENT, MAX_ACCEPTABLE_DRIFT_MS } = provablyFairConfig;

@Injectable()
export class AuditRoundUsecase {
  constructor(
    @Inject(PROVABY_SERVICE)
    private readonly provablyFairService: IProvablyFairService,
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
    private readonly provablyFairUtil: ProvablyFairUtil,
  ) {}

  async handler(roundId: string): Promise<RoundAuditResponseDto> {
    const [round, fair] = await Promise.all([
      this.roundRepository.findByRoundId(roundId),
      this.provablyFairService.getProvablyFairRound(roundId),
    ]);

    if (!round) throw new NotFoundException(`Round ${roundId} não encontrado`);
    if (!fair) throw new NotFoundException(`Provably fair não encontrado para o round ${roundId}`);

    const calculatedCrashPoint = this.provablyFairUtil.calculateCrashPoint(
      fair.serverSeed,
      fair.clientSeed,
      fair.nonce,
      HOUSE_EDGE_PERCENT,
    );
    const recalculated = this.provablyFairUtil.calculateCrashPoint(
      fair.serverSeed,
      fair.clientSeed,
      fair.nonce,
      HOUSE_EDGE_PERCENT,
    );
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

    const estimatedCrashDurationMs = this.provablyFairUtil.calculateTimeToCrashMs(calculatedCrashPoint);

    const roundDurationMs = endedAt ? endedAt.getTime() - startedAt.getTime() : null;

    const timingDriftMs = roundDurationMs !== null ? roundDurationMs - estimatedCrashDurationMs : null;

    const timeIsConsistenceByCrashDate = crashedAt.getTime() - startedAt.getTime();
    const timeIdConsistenceByEndedDate = endedAt ? endedAt.getTime() - startedAt.getTime() : 0;

    const timingIsConsistent =
      estimatedCrashDurationMs <= (roundDurationMs || 0) &&
      estimatedCrashDurationMs <= timeIsConsistenceByCrashDate &&
      estimatedCrashDurationMs <= timeIdConsistenceByEndedDate;

    const theoreticalMaxMultiplierAtCrash = endedAt
      ? this.provablyFairUtil.interpolateMultiplier(startedAt, endedAt, calculatedCrashPoint, endedAt)
      : null;

    const maxMultiplierDeviation =
      round.multiplier != null && theoreticalMaxMultiplierAtCrash != null
        ? parseFloat(Math.abs(round.multiplier - theoreticalMaxMultiplierAtCrash).toFixed(4))
        : null;

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
      formula: this.provablyFairUtil.buildFormula(fair.serverSeed, fair.clientSeed, fair.nonce, HOUSE_EDGE_PERCENT),

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
