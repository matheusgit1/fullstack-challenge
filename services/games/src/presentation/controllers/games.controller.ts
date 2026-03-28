// services/games/src/presentation/controllers/games.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
// import { GamesService } from '../../application/services/games.service';
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
import { AuthGuard } from "@nestjs/passport";

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
  @ApiBearerAuth()
  @ApiOperation({ summary: "Histórico de apostas do jogador" })
  @ApiResponse({ status: 200, type: PaginatedResponseDto<BetHistoryItemDto> })
  async getMyBets(
    @Query() query: BetsHistoryQueryDto,
  ): Promise<PaginatedResponseDto<BetHistoryItemDto>> {
    return this.gamesService.getMyBets(query);
  }

  @Post("bet")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Fazer aposta na rodada atual" })
  @ApiResponse({ status: 201, type: BetResponseDto })
  @ApiResponse({
    status: 400,
    description:
      "Saldo insuficiente / Fora da fase de apostas / Aposta duplicada",
  })
  async placeBet(@Body() dto: BetRequestDto): Promise<BetResponseDto> {
    return this.gamesService.placeBet(dto);
  }

  @Post("bet/cashout")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Sacar no multiplicador atual" })
  @ApiResponse({ status: 200, type: CashoutResponseDto })
  @ApiResponse({
    status: 400,
    description: "Nenhuma aposta pendente / Rodada não está ativa",
  })
  async cashout(@Body() dto: CashoutRequestDto): Promise<CashoutResponseDto> {
    return this.gamesService.cashout(dto);
  }
}
