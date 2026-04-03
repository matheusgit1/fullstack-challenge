import { Inject, Injectable } from "@nestjs/common";
import {
  BetHistoryItemDto,
  BetsHistoryQueryDto,
} from "../dtos/response/bets-history-response.dto";
import { PaginatedResponseDto } from "../dtos/response/round.dto";
import { REQUEST } from "@nestjs/core";
import { type Request } from "express";
import {
  BET_REPOSITORY,
  type IBetRepository,
} from "@/domain/orm/repositories/bet.repository";
import { HandlerUsecase } from "../interfaces/usecase.interface";

@Injectable()
export class GetMyBetsUseCase implements HandlerUsecase {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    @Inject(BET_REPOSITORY) private readonly betRepository: IBetRepository,
  ) {}

  async handler(
    query: BetsHistoryQueryDto,
  ): Promise<PaginatedResponseDto<BetHistoryItemDto>> {
    const { user, hash, token } = this.request;
    query.page = query.page || 1;
    query.limit = query.limit || 20;

    const [bets, total] = await this.betRepository.findUserBetsHistory(
      user?.sub || "anonymous",
      query.page,
      query.limit,
      query.status,
    );

    return new PaginatedResponseDto<BetHistoryItemDto>({
      data: bets.map(
        (bet) =>
          new BetHistoryItemDto({
            roundCrashPoint: bet.round.crashPoint || 0,
            roundId: bet.round.id,
            id: bet.id,
            userId: user?.sub || "anonymous",
            amount: bet.amount,
            multiplier: bet.multiplier,
            status: bet.status,
            cashedOutAt: bet.cashedOutAt,
            createdAt: bet.createdAt,
          }),
      ),
      page: query.page || 1,
      limit: query.limit || 10,
      total: total,
      totalPages: Math.ceil(total / query.limit),
    });
  }
}
