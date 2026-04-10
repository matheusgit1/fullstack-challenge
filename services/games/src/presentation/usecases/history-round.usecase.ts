import { Inject, Injectable } from '@nestjs/common';
import { RoundHistoryItemDto } from '../dtos/response/round-history-response.dto';
import { PaginatedResponseDto } from '../dtos/response/paginated-reponse.dto';
import { HandlerUsecase } from '../interfaces/usecase.interface';
import { ROUND_REPOSITORY, type IRoundRepository } from '@/domain/orm/repositories/round.repository';
import { RoundHistoryQueryDto } from '../dtos/request/round-history-query.dto';
import { BetDto } from '../dtos/response/bet.dto';

@Injectable()
export class HistoryRoundUsecase implements HandlerUsecase {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
  ) {}
  async handler(query: RoundHistoryQueryDto): Promise<PaginatedResponseDto<RoundHistoryItemDto>> {
    const page = query.page && query.page <= 0 ? 1 : query.page || 1;
    const limit = query.limit && query.limit <= 0 ? 20 : query.limit || 20;

    const [rounds, total] = await this.roundRepository.findRoundsHistory(Number(page), Number(limit));

    return new PaginatedResponseDto<RoundHistoryItemDto>({
      data: rounds.map(
        (round) =>
          new RoundHistoryItemDto({
            roundId: round.id,
            crashPoint: round.isRunning() ? 'secret' : round.crashPoint,
            serverSeedHash: round.serverSeedHash,
            endedAt: round.bettingEndsAt,
            status: round.status,
            multiplier: round.multiplier,
            bettingStartedAt: round.bettingStartedAt,
            bettingEndsAt: round.bettingEndsAt,
            roundStartedAt: round.startedAt,
            roundCrashedAt: round.crashedAt,
            serverSeed: round.serverSeed,
            clientSeed: round.clientSeed,
            nonce: round.nonce,
            createdAt: round.createdAt,
            updatedAt: round.updatedAt,
            bets: round.bets.map((bet) => new BetDto({ ...bet, amount: bet.amount })),
          }),
      ),
      page: Number(page),
      limit: Number(limit),
      total: total,
      totalPages: Math.ceil(total / limit),
    });
  }
}
