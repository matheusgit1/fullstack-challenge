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
import { PaginatedResponseDto } from "../dtos/index";
import { GamesService } from "../services/games.service";
import {
  RoundHistoryItemDto,
  RoundHistoryQueryDto,
} from "../dtos/response/round-history-response.dto";
import { HealthCheckResponseDto } from "../dtos/response/health-check-response.dto";
import { Auth, AuthGuardType } from "@/infrastructure/auth/auth.decorator";
import { BaseSuccessResponseDto } from "../dtos/response/__base__.dto";

@ApiTags("games")
@ApiBearerAuth("access-token")
@Controller("/")
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

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
    return this.gamesService.getCurrentRound();
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
    return this.gamesService.getRoundHistory(query);
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
    return this.gamesService.verifyRound(roundId);
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
    return this.gamesService.getMyBets(query);
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
    return this.gamesService.placeBet(dto);
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
    return this.gamesService.cashout(dto);
  }
}
