import { Controller, Post, Get, Request } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { WalletResponseDto } from "../dtos/wallet-response.dto";
import { ErrorResponseDto } from "../dtos/error-response.dto";
import { WalletsService } from "../services/wallets.service";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import type { Request as ExpressRequest } from "express";
import { Auth, AuthGuardType } from "@/application/auth/auth.decorator";

@ApiTags("wallets")
@ApiBearerAuth("access-token")
@Controller("/")
export class WalletsController {
  constructor(private readonly walletService: WalletsService) {}

  @Get("health")
  @Auth(AuthGuardType.NONE)
  check(): HealthCheckResponseDto {
    return new HealthCheckResponseDto({ status: "ok", service: "wallets" });
  }

  @Post("")
  @Auth(AuthGuardType.GUARD)
  @ApiOperation({ summary: "Cria carteira para o jogador autenticado" })
  @ApiResponse({ status: 201, type: WalletResponseDto })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: "Carteira já existe",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  async createWallet(): Promise<WalletResponseDto> {
    return this.walletService.createWallet();
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
  async getMyWallet(): Promise<WalletResponseDto> {
    return this.walletService.getWallet();
  }
}
