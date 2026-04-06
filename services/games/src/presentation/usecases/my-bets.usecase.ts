import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { type Request } from 'express';
import { BetHistoryItemDto } from '../dtos/response/bets-history-response.dto';
import { PaginatedResponseDto } from '../dtos/response/paginated-reponse.dto';
import { HandlerUsecase } from '../interfaces/usecase.interface';
import { BET_REPOSITORY, type IBetRepository } from '@/domain/orm/repositories/bet.repository';
import { BetsHistoryQueryDto } from '../dtos/request/bet-history-query.dto';

@Injectable()
export class GetMyBetsUseCase implements HandlerUsecase {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    @Inject(BET_REPOSITORY) private readonly betRepository: IBetRepository,
  ) {}

  async handler(query: BetsHistoryQueryDto): Promise<PaginatedResponseDto<BetHistoryItemDto>> {
    const { user, hash, token } = this.request;

    const page = query.page && query.page <= 0 ? 1 : query.page || 1;
    const limit = query.limit && query.limit <= 0 ? 20 : query.limit || 20;

    const [bets, total] = await this.betRepository.findUserBetsHistory(
      user?.sub || 'anonymous',
      page,
      limit,
      query.status,
    );

    return new PaginatedResponseDto<BetHistoryItemDto>({
      data: bets.map(
        (bet) =>
          new BetHistoryItemDto({
            roundCrashPoint: bet.round.crashPoint || 0,
            roundId: bet.round.id,
            id: bet.id,
            userId: user?.sub || 'anonymous',
            amount: bet.amount,
            multiplier: bet.multiplier,
            status: bet.status,
            cashedOutAt: bet.cashedOutAt,
            createdAt: bet.createdAt,
          }),
      ),
      page: page,
      limit: limit,
      total: total,
      totalPages: Math.ceil(total / limit),
    });
  }
}
