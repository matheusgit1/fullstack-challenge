import { Injectable } from "@nestjs/common";
import { CurrentRoundResponseDto } from "../dtos/response/current-round-response.dto";
import { PaginatedResponseDto } from "../dtos/index";
import { BetStatus, RoundStatus } from "../dtos/enums/enums";
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

@Injectable()
export class GamesService {
  public constructor() {}

  async cashout(dto: CashoutRequestDto): Promise<CashoutResponseDto> {
    return new CashoutResponseDto({
      bet: {
        id: "bet_123456789",
        userId: "user_123",
        username: "PlayerTest",
        amount: 100,
        multiplier: 2.5,
        status: BetStatus.CASHED_OUT,
        cashedOutAt: new Date(),
        createdAt: new Date(),
      },
      multiplier: 2.5,
      winAmount: 250,
      newBalance: 1250,
      roundStatus: RoundStatus.BETTING,
    });
  }

  async placeBet(dto: BetRequestDto): Promise<BetResponseDto> {
    return new BetResponseDto({
      bet: {
        id: "bet_123456789",
        userId: "user_123",
        username: "PlayerTest",
        amount: dto.amount,
        multiplier: null,
        status: BetStatus.PENDING,
        cashedOutAt: null,
        createdAt: new Date(),
      },
      newBalance: 1000 - dto.amount,
      roundId: "round_123456789",
    });
  }

  public async getCurrentRound(): Promise<CurrentRoundResponseDto> {
    return new CurrentRoundResponseDto({
      id: "round_123456789",
      status: RoundStatus.BETTING,
      multiplier: 1.0,
      myBet: null,
      bets: [],
      serverSeedHash: "a3f5c8d2e1b4...",
      crashPoint: null,
      bettingEndsAt: new Date("2024-01-01T12:00:00Z"),
      startedAt: null,
      crashedAt: null,
    });
  }

  async getRoundHistory(
    query: RoundHistoryQueryDto,
  ): Promise<PaginatedResponseDto<RoundHistoryItemDto>> {
    return new PaginatedResponseDto<RoundHistoryItemDto>({
      data: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });
  }

  async verifyRound(roundId: string): Promise<RoundVerifyResponseDto> {
    return new RoundVerifyResponseDto({
      roundId: roundId,
      crashPoint: 5.23,
      serverSeed: "server_seed_123",
      clientSeed: "client_seed_456",
      nonce: 0,
      serverSeedHash: "server_seed_hash_789",
      calculationFormula: "calculation_formula_012",
      rawResult: "raw_result_345",
      isValid: true,
    });
  }

  async getMyBets(
    query: BetsHistoryQueryDto,
  ): Promise<PaginatedResponseDto<BetHistoryItemDto>> {
    return new PaginatedResponseDto<BetHistoryItemDto>({
      data: [],
      page: query.page || 1,
      limit: query.limit || 10,
      total: 0,
      totalPages: 0,
    });
  }
}
