// import { OutboxRepository } from "./../../../../games/src/infrastructure/database/orm/repository/outbox.repository";
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { WalletResponseDto } from "../../presentation/dtos/wallet-response.dto";
import { WalletRepository } from "@/infrastructure/database/orm/repository/wallet.repository";
import { TransactionSource, TransactionType } from "@/infrastructure/database/orm/entites/transaction.entity";

@Injectable()
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    // private readonly outboxRepository: OutboxRepository,
  ) {}

  /**
   * Cria carteira para um usuário
   */
  async createWallet(userId: string): Promise<WalletResponseDto> {
    const wallet = await this.walletRepository.createWallet(userId);

    // Criar evento outbox para notificar outros serviços
    // await this.outboxRepository.createMessage("wallet.created", {
    //   userId: wallet.userId,
    //   walletId: wallet.id,
    //   balance: wallet.getBalance(),
    // });

    return this.toResponseDto(wallet);
  }

  /**
   * Busca carteira do usuário autenticado
   */
  async getWallet(userId: string): Promise<WalletResponseDto> {
    const wallet = await this.walletRepository.findByUserId(userId);

    if (!wallet) {
      throw new NotFoundException("Carteira não encontrada");
    }

    return this.toResponseDto(wallet);
  }

  /**
   * Busca ou cria carteira
   */
  async getOrCreateWallet(userId: string): Promise<WalletResponseDto> {
    const wallet = await this.walletRepository.findOrCreate(userId);
    return this.toResponseDto(wallet);
  }

  /**
   * Processa débito (usado internamente por mensageria)
   */
  async processDebit(
    userId: string,
    amount: number,
    source: TransactionSource,
    externalId: string,
    metadata?: Record<string, any>,
  ): Promise<{ wallet: WalletResponseDto; transaction: any }> {
    const amountInCents = Math.round(amount * 100);

    // Buscar wallet
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException("Carteira não encontrada");
    }

    // Processar transação
    const result = await this.walletRepository.processTransaction(
      wallet.id,
      userId,
      amountInCents,
      TransactionType.DEBIT,
      source,
      externalId,
      metadata,
    );

    // Criar evento outbox para notificar
    // await this.outboxRepository.createMessage("wallet.updated", {
    //   userId,
    //   walletId: result.wallet.id,
    //   balance: result.wallet.getBalance(),
    //   transaction: {
    //     id: result.transaction.id,
    //     type: "debit",
    //     amount,
    //     source,
    //     externalId,
    //   },
    // });

    return {
      wallet: this.toResponseDto(result.wallet),
      transaction: result.transaction,
    };
  }

  /**
   * Processa crédito (usado internamente por mensageria)
   */
  async processCredit(
    userId: string,
    amount: number,
    source: TransactionSource,
    externalId: string,
    metadata?: Record<string, any>,
  ): Promise<{ wallet: WalletResponseDto; transaction: any }> {
    const amountInCents = Math.round(amount * 100);

    // Buscar wallet
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException("Carteira não encontrada");
    }

    // Processar transação
    const result = await this.walletRepository.processTransaction(
      wallet.id,
      userId,
      amountInCents,
      TransactionType.CREDIT,
      source,
      externalId,
      metadata,
    );

    // Criar evento outbox para notificar
    // await this.outboxRepository.createMessage("wallet.updated", {
    //   userId,
    //   walletId: result.wallet.id,
    //   balance: result.wallet.getBalance(),
    //   transaction: {
    //     id: result.transaction.id,
    //     type: "credit",
    //     amount,
    //     source,
    //     externalId,
    //   },
    // });

    return {
      wallet: this.toResponseDto(result.wallet),
      transaction: result.transaction,
    };
  }

  /**
   * Verifica saldo do usuário
   */
  async checkBalance(userId: string, amount: number): Promise<boolean> {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) return false;

    const amountInCents = Math.round(amount * 100);
    return wallet.canDebit(amountInCents);
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
