import { Controller, Post, Get, Request } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { WalletResponseDto } from "../dtos/wallet-response.dto";
import { ErrorResponseDto } from "../dtos/error-response.dto";
import { WalletsService } from "../services/wallets.service";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { Auth, AuthGuardType } from "@/infrastructure/auth/auth.decorator";
import type { Request as ExpressRequest } from "express";

@ApiTags("wallets")
@Controller("wallets")
export class WalletsController {
  constructor(private readonly walletService: WalletsService) {}

  @Get("health")
  @Auth(AuthGuardType.GUARD)
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };
  }

  @Post("/")
  @Auth(AuthGuardType.GUARD)
  @ApiOperation({ summary: "Cria carteira para o jogador autenticado" })
  @ApiResponse({ status: 201, type: WalletResponseDto })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: "Carteira já existe",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  async createWallet(
    @Request() req: ExpressRequest,
  ): Promise<WalletResponseDto> {
    const userId = (req.user as any).sub;
    return this.walletService.createWallet(userId);
  }

  @Get("me")
  @Auth(AuthGuardType.GUARD)
  @ApiOperation({ summary: "Retorna carteira e saldo do jogador" })
  @ApiResponse({ status: 200, type: WalletResponseDto })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
    description: "Carteira não encontrada",
  })
  async getMyWallet(
    @Request() req: ExpressRequest,
  ): Promise<WalletResponseDto> {
    const userId = (req.user as any).sub;
    return this.walletService.getWallet(userId);
  }
}
