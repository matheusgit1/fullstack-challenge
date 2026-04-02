import { WalletProxy } from "../../infrastructure/proxy/services/wallets.service";
import { BetRepository } from "./../../infrastructure/database/orm/repository/bet.repository";
import { Inject, Injectable } from "@nestjs/common";
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
import { REQUEST } from "@nestjs/core";
import type { Request } from "express";

@Injectable()
export class GamesService {
  public constructor(
    private readonly roundRepository: RoundRepository,
    private readonly provablyFairService: ProvablyFairService,
    private readonly betRepository: BetRepository,
    private readonly proxyService: WalletProxy,
    private readonly rabbitmqProducer: RabbitmqProducerService,
    private readonly gamesManager: GamesManager,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  async cashout(dto: CashoutRequestDto): Promise<CashoutResponseDto> {
    const { user, hash, token } = this.request;
    const bet = await this.betRepository.findByFilters({
      where: { id: dto.betId, userId: user?.sub || "anonymous" },
      relations: ["round"],
    });

    if (!bet || !bet.round) {
      throw new Error("Nenhuma rodada ou aposta encontrada");
    }
    this.getErrorByStatus(bet.status);
    const { round } = bet;

    const userBalance = await this.proxyService.getUserBalance(token!);
    const isBetAvailable = userBalance.balanceInCents > bet.amount;
    if (!isBetAvailable) {
      throw new Error("Saldo insuficiente para realizar saque");
    }

    const externalId = bet.id;

    if (round.isCrashed()) {
      const cashout = await this.gamesManager.processCashout(
        bet,
        round,
        user?.sub || "anonymous",
        externalId,
        hash,
      );
      return cashout;
    }

    if (round.isRunning()) {
      const cashin = await this.gamesManager.processCashin(
        bet,
        round,
        user?.sub || "anonymous",
        externalId,
        hash,
      );

      return cashin;
    }

    throw new Error("Rodada já finalizada, saque indisponível");
  }

  async placeBet(dto: BetRequestDto): Promise<BetResponseDto> {
    const { user, hash, token } = this.request;
    const userBalance = await this.proxyService.getUserBalance(token!);

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
      userId: user?.sub || "Anonymous",
      roundId: dto.roundId,
      amount: dto.amount,
      status: BetStatus.PENDING,
    });

    await this.rabbitmqProducer.publishReserve({
      cashType: TransactionSource.BET_RESERVE,
      userId: user?.sub || "Anonymous",
      amount: dto.amount,
      timestamp: new Date().toISOString(),
      externalId: bet.id,
      tracingId: hash,
    });

    return new BetResponseDto({
      bet: {
        id: bet.id,
        userId: user?.sub || "Anonymous",
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
      bets: currentRound.bets,
      serverSeedHash: currentRound.serverSeedHash,
      bettingEndsAt: currentRound.bettingEndsAt,
      startedAt: currentRound.startedAt,
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
