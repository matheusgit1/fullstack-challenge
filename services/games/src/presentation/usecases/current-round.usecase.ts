import { RoundRepository } from "@/infrastructure/database/orm/repository/round.repository";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CurrentRoundResponseDto } from "../dtos/response/current-round-response.dto";
import { HandlerUsecase } from "../interfaces/usecase.interface";
import {
  ROUND_REPOSITORY,
  type IRoundRepository,
} from "@/domain/orm/repositories/round.repository";

@Injectable()
export class CurrentRoundUseCase implements HandlerUsecase {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
  ) {}

  async handler(): Promise<CurrentRoundResponseDto> {
    const currentRound = await this.roundRepository.findCurrentBettingRound();
    if (!currentRound) {
      throw new NotFoundException("Nenhuma rodada ativa");
    }

    return new CurrentRoundResponseDto({
      id: currentRound.id,
      status: currentRound.status,
      multiplier: currentRound.multiplier,
      bets: currentRound.bets,
      serverSeedHash: currentRound.serverSeedHash,
      bettingEndsAt: currentRound.bettingEndsAt,
      startedAt: currentRound.startedAt,
    });
  }
}
