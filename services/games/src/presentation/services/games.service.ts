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
import { ProvablyFairService } from "@/application/services/provably-fair/provably-fair.service";
import { RoundStatus } from "@/infrastructure/database/orm/entites/round.entity";
import { BetStatus } from "@/infrastructure/database/orm/entites/bet.entity";

@Injectable()
export class GamesService {
  public constructor(
    private readonly roundRepository: RoundRepository,
    private readonly provablyFairService: ProvablyFairService,
    private readonly betRepository: BetRepository,
    private readonly proxyService: ProxyService,
  ) {}

  async cashout(
    userId: string,
    userToken: string,
    dto: CashoutRequestDto,
  ): Promise<CashoutResponseDto> {
    const [round, bet] = await Promise.all([
      this.roundRepository.findOne({
        where: { id: dto.roundId },
      }),
      this.betRepository.findOne({
        where: { id: dto.betId, userId: userId },
        relations: ["round"],
      }),
    ]);

    if (!round) {
      throw new Error("Nenhuma rodada ativa");
    }

    if (round.status !== RoundStatus.RUNNING) {
      throw new Error("Saque não pode ser feito");
    }

    if (!bet) {
      throw new Error("Nenhuma aposta encontrada");
    }

    if (bet?.roundId !== dto.roundId) {
      throw new Error("Aposta não pertence à rodada informada");
    }
    console.log(
      "multiplicador alvo",
      dto.targetMultiplier,
      "multiplicador atual",
      round.crashPoint,
    );
    if (dto.targetMultiplier > round.crashPoint) {
      throw new Error(
        "Multiplicador alvo não deve ser maior que o multiplicador atual",
      );
    }

    // TODO enviar mensagem para processar cashout via RabbitMQ e retornar resposta real no wallet

    return new CashoutResponseDto({
      bet: {
        id: bet.id,
        userId: userId,
        amount: bet.amount,
        multiplier: dto.targetMultiplier,
        status: BetStatus.CASHED_OUT,
        cashedOutAt: new Date(),
        createdAt: bet.createdAt,
      },
      multiplier: dto.targetMultiplier,
      winAmount: bet.amount * dto.targetMultiplier - bet.amount,
      roundStatus: round.status,
    });
  }

  async placeBet(
    userToken: string,
    userId: string,
    dto: BetRequestDto,
  ): Promise<BetResponseDto> {
    const userBalance = await this.proxyService.getUserBalance(userToken);

    const isAvailableBet = userBalance.balanceInCents / 100 > dto.amount / 100;
    if (!isAvailableBet) {
      throw new Error("Saldo insuficiente");
    }

    const round = await this.roundRepository.findOne({
      where: { id: dto.roundId },
    });

    if (!round) {
      throw new Error("Nenhuma rodada ativa");
    }

    if (round.status !== RoundStatus.BETTING) {
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
    const currentRound = await this.roundRepository.findCurrentRound();
    if (!currentRound) {
      throw new Error("No active round found");
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
