import { Inject, Injectable } from '@nestjs/common';
import { WalletResponseDto } from '../../presentation/dtos/wallet-response.dto';
import { type IWalletRepository, WALLET_REPOSITORY } from '@/domain/orm/repositories/wallet.repository';
import { REQUEST } from '@nestjs/core';
import { type Request } from 'express';
import { Wallet } from '@/infrastructure/database/orm/entites/wallet.entity';

@Injectable()
export class WalletsService {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  async createWallet(): Promise<WalletResponseDto> {
    const userId = this.request.user?.sub || 'anonymous';
    const wallet = await this.walletRepository.createWallet(userId);
    return this.toResponseDto(wallet);
  }

  async getWallet(): Promise<WalletResponseDto> {
    const userId = this.request.user?.sub || 'anonymous';
    const wallet = await this.walletRepository.findOrCreate(userId);
    return this.toResponseDto(wallet);
  }
  private toResponseDto(wallet: Wallet): WalletResponseDto {
    return new WalletResponseDto({
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.getBalance(),
      balanceInCents: wallet.balanceInCents,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    });
  }
}
