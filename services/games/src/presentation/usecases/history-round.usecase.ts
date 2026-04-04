import { Inject, Injectable } from "@nestjs/common";
import {
  RoundHistoryItemDto,
} from "../dtos/response/round-history-response.dto";
import { PaginatedResponseDto } from "../dtos/response/round.dto";
import { HandlerUsecase } from "../interfaces/usecase.interface";
import {
  ROUND_REPOSITORY,
  type IRoundRepository,
} from "@/domain/orm/repositories/round.repository";
import { RoundHistoryQueryDto } from "../dtos/request/round-history-query.dto";

@Injectable()
export class HistoryRoundUsecase implements HandlerUsecase {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
  ) {}
  async handler(
    query: RoundHistoryQueryDto,
  ): Promise<PaginatedResponseDto<RoundHistoryItemDto>> {
    query.page = query.page || 1;
    query.limit = query.limit || 20;

    const [rounds, total] = await this.roundRepository.findRoundsHistory(
      query.page,
      query.limit,
    );

    return new PaginatedResponseDto<RoundHistoryItemDto>({
      data: rounds.map(
        (round) =>
          new RoundHistoryItemDto({
            roundId: round.id,
            crashPoint: round.isRunning() ? "secret" : round.crashPoint,
            serverSeedHash: round.serverSeedHash,
            endedAt: round.bettingEndsAt,
            status: round.status,
          }),
      ),
      page: query.page,
      limit: query.limit,
      total: total,
      totalPages: Math.ceil(total / query.limit),
    });
  }
}
