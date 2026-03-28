import { Controller, Post, Get, Body, UseGuards, Req } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { CreateWalletDto } from "../dtos/create-wallet.dto";
import { WalletResponseDto } from "../dtos/wallet-response.dto";
import { ErrorResponseDto } from "../dtos/error-response.dto";
import { WalletsService } from "../services/wallets.service";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";

@ApiTags("wallets")
@Controller("wallets")
export class WalletsController {
  constructor(private readonly walletService: WalletsService) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }

  @Post("/")
  @ApiOperation({ summary: "Cria carteira para o jogador autenticado" })
  @ApiResponse({ status: 201, type: WalletResponseDto })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: "Carteira já existe",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  async createWallet() // @Body() dto: CreateWalletDto,
  : Promise<WalletResponseDto> {
    // TODO: Pegar userId do token JWT
    const userId = "mock-user-id";
    return this.walletService.createWallet(userId);
  }

  @Get("me")
  @ApiOperation({ summary: "Retorna carteira e saldo do jogador" })
  @ApiResponse({ status: 200, type: WalletResponseDto })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
    description: "Carteira não encontrada",
  })
  async getMyWallet() // @Req() req: Request, // TODO: extrair userId do JWT
  : Promise<WalletResponseDto> {
    // TODO: Pegar userId do token JWT
    const userId = "mock-user-id";
    return this.walletService.getWallet(userId);
  }
}
