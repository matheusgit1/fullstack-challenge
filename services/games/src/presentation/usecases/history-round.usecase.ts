import { Inject, Injectable } from '@nestjs/common';
import { RoundHistoryItemDto } from '../dtos/response/round-history-response.dto';
import { PaginatedResponseDto } from '../dtos/response/paginated-reponse.dto';
import { HandlerUsecase } from '../interfaces/usecase.interface';
import { ROUND_REPOSITORY, type IRoundRepository } from '@/domain/orm/repositories/round.repository';
import { RoundHistoryQueryDto } from '../dtos/request/round-history-query.dto';

@Injectable()
export class HistoryRoundUsecase implements HandlerUsecase {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
  ) {}
  async handler(query: RoundHistoryQueryDto): Promise<PaginatedResponseDto<RoundHistoryItemDto>> {
    const page = query.page <= 0 ? 1 : query.page;
    const limit = query.limit <= 0 ? 20 : query.limit;

    const [rounds, total] = await this.roundRepository.findRoundsHistory(page, limit);

    return new PaginatedResponseDto<RoundHistoryItemDto>({
      data: rounds.map(
        (round) =>
          new RoundHistoryItemDto({
            roundId: round.id,
            crashPoint: round.isRunning() ? 'secret' : round.crashPoint,
            serverSeedHash: round.serverSeedHash,
            endedAt: round.bettingEndsAt,
            status: round.status,
          }),
      ),
      page,
      limit,
      total: total,
      totalPages: Math.ceil(total / limit),
    });
  }
}
