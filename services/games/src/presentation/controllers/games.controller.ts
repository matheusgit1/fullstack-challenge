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
import type { Request } from "express";
import { HealthCheckResponseDto } from "../dtos/response/health-check-response.dto";
import { Auth, AuthGuardType } from "@/infrastructure/auth/auth.decorator";

@ApiTags("games")
@Controller("games")
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }

  @Get("rounds/current")
  @ApiOperation({ summary: "Obter estado da rodada atual com apostas" })
  @ApiResponse({ status: 200, type: CurrentRoundResponseDto })
  async getCurrentRound(): Promise<CurrentRoundResponseDto> {
    return this.gamesService.getCurrentRound();
  }

  @Get("rounds/history")
  @ApiOperation({ summary: "Histórico paginado de rodadas" })
  @ApiResponse({ status: 200, type: PaginatedResponseDto<RoundHistoryItemDto> })
  async getRoundHistory(
    @Query() query: RoundHistoryQueryDto,
  ): Promise<PaginatedResponseDto<RoundHistoryItemDto>> {
    return this.gamesService.getRoundHistory(query);
  }

  @Get("rounds/:roundId/verify")
  @ApiOperation({ summary: "Dados de verificação provably fair" })
  @ApiResponse({ status: 200, type: RoundVerifyResponseDto })
  async verifyRound(
    @Param("roundId") roundId: string,
  ): Promise<RoundVerifyResponseDto> {
    return this.gamesService.verifyRound(roundId);
  }

  @Get("bets/me")
  @Auth(AuthGuardType.GUARD)
  @ApiOperation({ summary: "Histórico de apostas do jogador" })
  @ApiResponse({ status: 200, type: PaginatedResponseDto<BetHistoryItemDto> })
  async getMyBets(
    @Req() req: Request,
    @Query() query: BetsHistoryQueryDto,
  ): Promise<PaginatedResponseDto<BetHistoryItemDto>> {
    const userId = req.user?.sub || "anonymous";
    return this.gamesService.getMyBets(userId, query);
  }

  @Post("bet")
  @Auth(AuthGuardType.GUARD)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Fazer aposta na rodada atual" })
  @ApiResponse({ status: 201, type: BetResponseDto })
  @ApiResponse({
    status: 400,
    description:
      "Saldo insuficiente / Fora da fase de apostas / Aposta duplicada",
  })
  async placeBet(
    @Body() dto: BetRequestDto,
    @Req() req: Request,
  ): Promise<BetResponseDto> {
    const userId = req.user?.sub || "anonymous";
    const userToken = req.headers.authorization?.split(" ")[1] || "";
    return this.gamesService.placeBet(userToken, userId, dto);
  }

  @Post("bet/cashout")
  @Auth(AuthGuardType.GUARD)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Sacar no multiplicador atual" })
  @ApiResponse({ status: 200, type: CashoutResponseDto })
  @ApiResponse({
    status: 400,
    description: "Nenhuma aposta pendente / Rodada não está ativa",
  })
  async cashout(
    @Req() req: Request,
    @Body() dto: CashoutRequestDto,
  ): Promise<CashoutResponseDto> {
    const userToken = req.headers.authorization?.split(" ")[1] || "";
    const userId = req.user?.sub || "anonymous";
    return this.gamesService.cashout(userId, userToken, dto);
  }
}
