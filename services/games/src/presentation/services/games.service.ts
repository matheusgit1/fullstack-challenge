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
import { RoundStatus } from "@/infrastructure/database/orm/entites/round.entity";
import { BetStatus } from "@/infrastructure/database/orm/entites/bet.entity";
import { TransactionSource } from "@/infrastructure/rabbitmq/rabbitmq.types";

@Injectable()
export class GamesService {
  public constructor(
    private readonly roundRepository: RoundRepository,
    private readonly provablyFairService: ProvablyFairService,
    private readonly betRepository: BetRepository,
    private readonly proxyService: ProxyService,
    private readonly rabbitmqProducer: RabbitmqProducerService,
  ) {}

  async cashout(
    userId: string,
    userToken: string,
    dto: CashoutRequestDto,
  ): Promise<CashoutResponseDto> {
    const [bet] = await Promise.all([
      this.betRepository.findByFilters({
        where: { id: dto.betId, userId: userId },
        relations: ["round"],
      }),
    ]);

    if (!bet || !bet.round) {
      throw new Error("Nenhuma rodada ou aposta encontrada");
    }

    const { round } = bet;

    if (!round) {
      throw new Error("Nenhuma rodada ativa");
    }

    if (bet?.roundId !== dto.roundId) {
      throw new Error("Aposta não pertence à rodada informada");
    }

    if (dto.targetMultiplier > round.crashPoint) {
      throw new Error(
        "Multiplicador alvo não deve ser maior que o multiplicador atual",
      );
    }

    const userBalance = await this.proxyService.getUserBalance(userToken);
    const isAvailableBet = userBalance.balanceInCents > bet.amount;
    if (!isAvailableBet) {
      throw new Error("Saldo insuficiente para realizar saque");
    }

    const amountToProcess = bet.amount * dto.targetMultiplier;
    const externalId = bet.id;

    if (round.isCrashed()) {
      await this.rabbitmqProducer.publishCash({
        cashType: TransactionSource.BET_LOST,
        userId: userId,
        amount: bet.amount,
        timestamp: new Date().toISOString(),
        externalId: externalId,
      });

      bet.lose();
      await this.betRepository.save(bet);

      return new CashoutResponseDto({
        bet: {
          id: bet.id,
          userId: userId,
          amount: bet.amount,
          multiplier: dto.targetMultiplier,
          status: bet.status,
          cashedOutAt: new Date(),
          createdAt: bet.createdAt,
        },
        multiplier: dto.targetMultiplier,
        winAmount: bet.amount,
        roundStatus: round.status,
      });
    }

    if (round.isRunning()) {
      await this.rabbitmqProducer.publishCash({
        cashType: TransactionSource.BET_PLACED,
        userId: userId,
        amount: amountToProcess,
        timestamp: new Date().toISOString(),
        externalId: externalId,
      });

      bet.cashout(dto.targetMultiplier);

      await this.betRepository.save(bet);

      return new CashoutResponseDto({
        bet: {
          id: bet.id,
          userId: userId,
          amount: bet.amount,
          multiplier: dto.targetMultiplier,
          status: bet.status,
          cashedOutAt: new Date(),
          createdAt: bet.createdAt,
        },
        multiplier: dto.targetMultiplier,
        winAmount: bet.amount * dto.targetMultiplier - bet.amount,
        roundStatus: round.status,
      });
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
      myBet: null, //adicionar no futuro caso haja autenticação e aposta do usuário
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
            crashPoint: round.crashPoint || 0,
            serverSeedHash: round.serverSeedHash,
            endedAt: round.bettingEndsAt,
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
}
