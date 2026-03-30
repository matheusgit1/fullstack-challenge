
import { Injectable, Logger } from "@nestjs/common";
import { WalletRepository } from "../database/orm/repository/wallet.repository";
import { CashinMessage, CashoutMessage } from "./rabbitmq.controller";
import {
  TransactionSource,
  TransactionType,
} from "../database/orm/entites/transaction.entity";

@Injectable()
export class RabbitmqService {
  constructor(private readonly walletRepository: WalletRepository) {}

  private readonly logger = new Logger(RabbitmqService.name);

  async processCashin(message: CashinMessage) {
    this.logger.log("Cashin recebido", message);

    const exists = await this.walletRepository.getTransactionByExternalId(
      message.externalId,
      message.cashType,
    );

    if (exists) {
      this.logger.warn("Cashin duplicado ignorado" );
      return;
    }

    const wallet = await this.walletRepository.findOrCreate(message.userId);

    console.log("processando cashin para carteira", wallet.id, "com valor", message.amount, {
      walletId: wallet.id,
      userId: message.userId,
      amount: message.amount,
      type: TransactionType.CREDIT,
      source: TransactionSource.BET_PLACED,
      externalId: message.externalId,
      metadata: { timestamp: message.timestamp },
    });

    await this.walletRepository.processTransaction(
      wallet.id,
      message.userId,
      message.amount,
      TransactionType.CREDIT,
      TransactionSource.BET_PLACED,
      message.externalId,
      { timestamp: message.timestamp },
    );
  }

  async processCashout(message: CashoutMessage) {
    this.logger.log("Cashout recebido", message);

    const exists = await this.walletRepository.getTransactionByExternalId(
      message.externalId,
      message.cashType,
    );

    if (exists) {
      this.logger.warn("Cashout duplicado ignorado");
      return;
    }

    const wallet = await this.walletRepository.findOrCreate(message.userId);

    await this.walletRepository.processTransaction(
      wallet.id,
      message.userId,
      message.amount,
      TransactionType.DEBIT,
      TransactionSource.BET_LOST,
      message.externalId,
      { timestamp: message.timestamp },
    );
  }
}
