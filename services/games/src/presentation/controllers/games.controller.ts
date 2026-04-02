import { CurrentRoundUseCase } from "./../usecases/current-round.usecase";
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { BetRequestDto, BetResponseDto } from "../dtos/request/bet-request.dto";
import {
  CashoutRequestDto,
  CashoutResponseDto,
} from "../dtos/request/cashout-request.dto";
import { CurrentRoundResponseDto } from "../dtos/response/current-round-response.dto";
import { RoundVerifyResponseDto } from "../dtos/response/round-verify-response.dto";
import {
  BetsHistoryQueryDto,
  BetHistoryItemDto,
} from "../dtos/response/bets-history-response.dto";
import {
  RoundHistoryItemDto,
  RoundHistoryQueryDto,
} from "../dtos/response/round-history-response.dto";
import { HealthCheckResponseDto } from "../dtos/response/health-check-response.dto";
import { Auth, AuthGuardType } from "@/infrastructure/auth/auth.decorator";
import { BaseSuccessResponseDto } from "../dtos/response/__base__.dto";
import { HistoryRoundUsecase } from "../usecases/history-round.usecase";
import { VerifyRoundUsecase } from "../usecases/verify-round.usecase";
import { PaginatedResponseDto } from "../dtos/response/round.dto";
import { GetMyBetsUseCase } from "../usecases/my-bets.usecase";
import { BetUseCase } from "../usecases/bet.usecase";
import { CashOutUsecase } from "../usecases/cashout.usecase";

@ApiTags("games")
@ApiBearerAuth("access-token")
@Controller("/")
export class GamesController {
  constructor(
    private readonly currentRoundUseCase: CurrentRoundUseCase,
    private readonly historyRoundUseCase: HistoryRoundUsecase,
    private readonly verifyRoundUseCase: VerifyRoundUsecase,
    private readonly getMyBetsUseCase: GetMyBetsUseCase,
    private readonly betUseCase: BetUseCase,
    private readonly cashoutUseCase: CashOutUsecase,
  ) {}

  @Get("health")
  @Auth(AuthGuardType.NONE)
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }

  @Get("rounds/current")
  @Auth(AuthGuardType.NONE)
  @ApiOperation({ summary: "Obter estado da rodada atual com apostas" })
  @ApiResponse({
    status: 200,
    type: BaseSuccessResponseDto(CurrentRoundResponseDto),
  })
  async getCurrentRound(): Promise<CurrentRoundResponseDto> {
    return this.currentRoundUseCase.handler();
  }

  @Get("rounds/history")
  @Auth(AuthGuardType.NONE)
  @ApiOperation({ summary: "Histórico paginado de rodadas" })
  @ApiResponse({
    status: 200,
    type: BaseSuccessResponseDto(PaginatedResponseDto<RoundHistoryItemDto>),
  })
  async getRoundHistory(
    @Query() query: RoundHistoryQueryDto,
  ): Promise<PaginatedResponseDto<RoundHistoryItemDto>> {
    return this.historyRoundUseCase.handler(query);
  }

  @Get("rounds/:roundId/verify")
  @Auth(AuthGuardType.NONE)
  @ApiOperation({ summary: "Dados de verificação provably fair" })
  @ApiResponse({
    status: 200,
    type: BaseSuccessResponseDto(RoundVerifyResponseDto),
  })
  async verifyRound(
    @Param("roundId") roundId: string,
  ): Promise<RoundVerifyResponseDto> {
    return await this.verifyRoundUseCase.handler(roundId);
  }

  @Get("bets/me")
  @Auth(AuthGuardType.GUARD)
  @ApiOperation({ summary: "Histórico de apostas do jogador" })
  @ApiResponse({
    status: 200,
    type: BaseSuccessResponseDto(PaginatedResponseDto<BetHistoryItemDto>),
  })
  async getMyBets(
    @Query() query: BetsHistoryQueryDto,
  ): Promise<PaginatedResponseDto<BetHistoryItemDto>> {
    return this.getMyBetsUseCase.handler(query);
  }

  @Post("bet")
  @Auth(AuthGuardType.GUARD)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Fazer aposta na rodada atual" })
  @ApiResponse({ status: 201, type: BaseSuccessResponseDto(BetResponseDto) })
  @ApiResponse({
    status: 400,
    description:
      "Saldo insuficiente / Fora da fase de apostas / Aposta duplicada",
  })
  async placeBet(@Body() dto: BetRequestDto): Promise<BetResponseDto> {
    return this.betUseCase.handler(dto);
  }

  @Post("bet/cashout")
  @Auth(AuthGuardType.GUARD)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Sacar no multiplicador atual" })
  @ApiResponse({
    status: 200,
    type: BaseSuccessResponseDto(CashoutResponseDto),
  })
  @ApiResponse({
    status: 400,
    description: "Nenhuma aposta pendente / Rodada não está ativa",
  })
  async cashout(@Body() dto: CashoutRequestDto): Promise<CashoutResponseDto> {
    return await this.cashoutUseCase.handler(dto);
  }
}
