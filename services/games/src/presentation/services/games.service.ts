import { ProxyService } from "./../../infrastructure/proxy/proxy.service";
import { BetRepository } from "./../../infrastructure/database/orm/repository/bet.repository";
import { Injectable } from "@nestjs/common";
import { CurrentRoundResponseDto } from "../dtos/response/current-round-response.dto";
import { PaginatedResponseDto } from "../dtos/index";
import {
  RoundHistoryItemDto,
  RoundHistoryQueryDto,
} from "../dtos/response/round-history-response.dto";
import { RoundVerifyResponseDto } from "../dtos/response/round-verify-response.dto";
import {
  BetHistoryItemDto,
  BetsHistoryQueryDto,
} from "../dtos/response/bets-history-response.dto";
import { BetRequestDto, BetResponseDto } from "../dtos/request/bet-request.dto";
import {
  CashoutRequestDto,
  CashoutResponseDto,
} from "../dtos/request/cashout-request.dto";
import { RoundRepository } from "@/infrastructure/database/orm/repository/round.repository";
import { RabbitmqProducerService } from "@/infrastructure/rabbitmq/rabbitmq.producer";
import { ProvablyFairService } from "@/application/services/provably-fair/provably-fair.service";
import { BetStatus } from "@/infrastructure/database/orm/entites/bet.entity";
import { TransactionSource } from "@/infrastructure/rabbitmq/rabbitmq.types";
import { GamesManager } from "./games.manager";

@Injectable()
export class GamesService {
  public constructor(
    private readonly roundRepository: RoundRepository,
    private readonly provablyFairService: ProvablyFairService,
    private readonly betRepository: BetRepository,
    private readonly proxyService: ProxyService,
    private readonly rabbitmqProducer: RabbitmqProducerService,
    private readonly gamesManager: GamesManager,
  ) {}

  async cashout(
    userId: string,
    userToken: string,
    dto: CashoutRequestDto,
  ): Promise<CashoutResponseDto> {
    const bet = await this.betRepository.findByFilters({
      where: { id: dto.betId, userId: userId },
      relations: ["round"],
    });

    if (!bet || !bet.round) {
      throw new Error("Nenhuma rodada ou aposta encontrada");
    }
    this.getErrorByStatus(bet.status);
    const { round } = bet;

    const userBalance = await this.proxyService.getUserBalance(userToken);
    const isBetAvailable = userBalance.balanceInCents > bet.amount;
    if (!isBetAvailable) {
      throw new Error("Saldo insuficiente para realizar saque");
    }

    const externalId = bet.id;

    if (round.isCrashed()) {
      const cashout = await this.gamesManager.processCashout(
        bet,
        round,
        userId,
        externalId,
      );
      return cashout;
    }

    if (round.isRunning()) {
      const cashin = await this.gamesManager.processCashin(
        bet,
        round,
        userId,
        externalId,
      );

      return cashin;
    }

    throw new Error("Rodada já finalizada, saque indisponível");
  }

  async placeBet(
    userToken: string,
    userId: string,
    dto: BetRequestDto,
  ): Promise<BetResponseDto> {
    const userBalance = await this.proxyService.getUserBalance(userToken);

    const isAvailableBet = userBalance.balanceInCents > dto.amount;
    if (!isAvailableBet) {
      throw new Error("Saldo insuficiente");
    }

    const round = await this.roundRepository.findByRoundId(dto.roundId);

    if (!round) {
      throw new Error("Nenhuma rodada ativa");
    }

    if (!round.isBettingPhase) {
      throw new Error("Aposta indisponível");
    }

    const bet = await this.betRepository.createBet({
      userId: userId,
      roundId: dto.roundId,
      amount: dto.amount,
      status: BetStatus.PENDING,
    });

    await this.rabbitmqProducer.publishReserve({
      cashType: TransactionSource.BET_RESERVE,
      userId: userId,
      amount: dto.amount,
      timestamp: new Date().toISOString(),
      externalId: bet.id,
    });

    return new BetResponseDto({
      bet: {
        id: bet.id,
        userId: userId,
        amount: dto.amount,
        multiplier: 1,
        status: BetStatus.PENDING,
        cashedOutAt: null,
        createdAt: new Date(),
      },
      newBalance: userBalance.balanceInCents - dto.amount,
      roundId: round.id,
    });
  }

  public async getCurrentRound(): Promise<CurrentRoundResponseDto> {
    const currentRound = await this.roundRepository.findCurrentBettingRound();
    if (!currentRound) {
      throw new Error("Nenhuma rodada ativa");
    }

    return new CurrentRoundResponseDto({
      id: currentRound.id,
      status: currentRound.status,
      multiplier: currentRound.multiplier,
      myBet: null,
      bets: currentRound.bets,
      serverSeedHash: currentRound.serverSeedHash,
      crashPoint: currentRound.crashPoint,
      bettingEndsAt: currentRound.bettingEndsAt,
      startedAt: currentRound.startedAt,
      crashedAt: currentRound.crashedAt,
    });
  }

  async getRoundHistory(
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

  async verifyRound(roundId: string): Promise<RoundVerifyResponseDto> {
    const fair =
      await this.provablyFairService.getProvablyFairDataForRound(roundId);

    return new RoundVerifyResponseDto({
      fairId: fair.id,
      serverSeed: fair.serverSeed,
      clientSeed: fair.clientSeed,
      nonce: fair.nonce,
      serverSeedHash: fair.serverSeedHash,
    });
  }

  async getMyBets(
    userId: string,
    query: BetsHistoryQueryDto,
  ): Promise<PaginatedResponseDto<BetHistoryItemDto>> {
    query.page = query.page || 1;
    query.limit = query.limit || 20;

    const [bets, total] = await this.betRepository.findUserBetsHistory(
      userId,
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
            userId: userId,
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

  private getErrorByStatus(status: BetStatus) {
    const dictionary = {
      [BetStatus.PENDING]: () => {},
      [BetStatus.LOST]: () => {
        throw new Error("Aposta perdida");
      },
      [BetStatus.CASHED_OUT]: () => {
        throw new Error("Aposta sacada");
      },
    };

    return dictionary[status]();
  }
}
