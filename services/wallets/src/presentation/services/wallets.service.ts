import { Injectable, NotFoundException } from "@nestjs/common";
import { WalletResponseDto } from "../../presentation/dtos/wallet-response.dto";
import { WalletRepository } from "@/infrastructure/database/orm/repository/wallet.repository";

@Injectable()
export class WalletsService {
  constructor(private readonly walletRepository: WalletRepository) {}

  async createWallet(userId: string): Promise<WalletResponseDto> {
    const wallet = await this.walletRepository.createWallet(userId);
    return this.toResponseDto(wallet);
  }

  async getWallet(userId: string): Promise<WalletResponseDto> {
    const wallet = await this.walletRepository.findByUserId(userId);

    if (!wallet) {
      throw new NotFoundException("Carteira não encontrada");
    }

    return this.toResponseDto(wallet);
  }
  private toResponseDto(wallet: any): WalletResponseDto {
    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.getBalance(),
      balanceInCents: wallet.balanceInCents,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }
}
