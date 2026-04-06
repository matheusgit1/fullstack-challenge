import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  CashinMessage,
  CashoutMessage,
  CashReserveMessage,
} from "./rabbitmq.controller";
import {
  TransactionSource,
  TransactionType,
} from "../database/orm/entites/transaction.entity";
import { IRabbitmqService } from "@/domain/rabbitmq/rabbitmq.service";
import {
  type ITransactionRepository,
  TRANSACTION_REPOSITORY,
} from "@/domain/orm/repositories/transaction.repository";

@Injectable()
export class RabbitmqService implements IRabbitmqService {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  private readonly logger = new Logger(RabbitmqService.name);

  async processReserve(message: CashReserveMessage, tracingId: string) {
    const exists = await this.transactionRepository.findByExternalIdAndSource(
      message.externalId,
      TransactionSource.BET_RESERVE,
    );

    if (exists) {
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

  async processCashin(message: CashinMessage, tracingId: string) {
    const exists = await this.transactionRepository.findByExternalIdAndSource(
      message.externalId,
      TransactionSource.BET_RESERVE,
    );

    if (!exists) {
      return;
    }

    const winAmount = exists.amountInCents * message.multiplier;
    await this.transactionRepository.processTransaction(
      message.userId,
      winAmount,
      TransactionType.CREDIT,
      TransactionSource.BET_PLACED,
      message.externalId,
      { timestamp: message.timestamp },
    );
  }

  async processCashout(message: CashoutMessage, tracingId: string) {
    const exists = await this.transactionRepository.findByExternalIdAndSource(
      message.externalId,
      TransactionSource.BET_RESERVE,
    );

    if (!exists) {
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
