import { Injectable, Logger } from "@nestjs/common";
import {
  CashinMessage,
  CashoutMessage,
  CashReserveMessage,
} from "./rabbitmq.controller";
import {
  TransactionSource,
  TransactionType,
} from "../database/orm/entites/transaction.entity";
import { TransactionRepository } from "../database/orm/repository/transaction.repository";

@Injectable()
export class RabbitmqService {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  private readonly logger = new Logger(RabbitmqService.name);

  async processReserve(message: CashReserveMessage) {
    const exists = await this.transactionRepository.findByExternalIdAndSource(
      message.externalId,
      TransactionSource.BET_RESERVE,
    );

    if (exists) {
      this.logger.warn("Reserva duplicada ignorada ignorado", exists);
      return;
    }

    await this.transactionRepository.processTransaction(
      message.userId,
      message.amount,
      TransactionType.DEBIT,
      TransactionSource.BET_RESERVE,
      message.externalId,
      { timestamp: message.timestamp },
    );
  }

  async processCashin(message: CashinMessage) {
    this.logger.log("Cashin recebido", message);

    const exists = await this.transactionRepository.findByExternalIdAndSource(
      message.externalId,
      TransactionSource.BET_RESERVE,
    );

    if (!exists) {
      this.logger.warn("Bet sem reserva");
      return;
    }

    await this.transactionRepository.processTransaction(
      message.userId,
      exists.amountInCents * message.multiplier,
      TransactionType.CREDIT,
      TransactionSource.BET_PLACED,
      message.externalId,
      { timestamp: message.timestamp },
    );
  }

  async processCashout(message: CashoutMessage) {
    this.logger.log("Cashout recebido", message);

    const exists = await this.transactionRepository.findByExternalIdAndSource(
      message.externalId,
      TransactionSource.BET_RESERVE,
    );

    if (!exists) {
      this.logger.warn("Bet sem reserva");
      return;
    }

    await this.transactionRepository.processTransaction(
      message.userId,
      exists.amountInCents,
      TransactionType.DEBIT,
      TransactionSource.BET_LOST,
      message.externalId,
      { timestamp: message.timestamp },
    );
  }
}
