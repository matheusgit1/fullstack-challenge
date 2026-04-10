import { Inject, Injectable, Logger } from '@nestjs/common';
import { CashinMessage, CashoutMessage, CashReserveMessage } from './rabbitmq.controller';
import { TransactionSource, TransactionType } from '../database/orm/entites/transaction.entity';
import { IRabbitmqService } from '@/domain/rabbitmq/rabbitmq.service';
import { type ITransactionRepository, TRANSACTION_REPOSITORY } from '@/domain/orm/repositories/transaction.repository';

@Injectable()
export class RabbitmqService implements IRabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name);
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async processReserve(message: CashReserveMessage, tracingId: string) {
    this.logger.debug(`[${tracingId}] process reserve - BET_RESERVE message aquired for userId: ${message.userId}`);
    const exists = await this.transactionRepository.findByExternalIdAndSource(
      message.externalId,
      TransactionSource.BET_RESERVE,
    );

    this.logger.debug(`[${tracingId}] existing BET_RESERVE: ${!!exists}`);

    if (exists) {
      return;
    }

    const processing = {
      userId: message.userId,
      amount: message.amount,
      transactionType: TransactionType.DEBIT,
      transactionSource: TransactionSource.BET_RESERVE,
      externalId: message.externalId,
      metadata: { timestamp: message.timestamp, tracingId },
    };

    this.logger.debug(
      `[${tracingId}] BET_RESERVE data: ${JSON.stringify({
        ...processing,
      })}`,
    );

    await this.transactionRepository.processTransaction(
      message.userId,
      message.amount,
      TransactionType.DEBIT,
      TransactionSource.BET_RESERVE,
      message.externalId,
      { timestamp: message.timestamp, tracingId },
    );

    this.logger.log(`[${tracingId}] BET_RESERVE processed for userId: ${message.userId}`);
  }

  async processCashin(message: CashinMessage, tracingId: string) {
    this.logger.debug(`[${tracingId}] process cashin - BET_PLACED message aquired for userId: ${message.userId}`);
    const exists = await this.transactionRepository.findByExternalIdAndSource(
      message.externalId,
      TransactionSource.BET_RESERVE,
    );

    this.logger.debug(`[${tracingId}] existing BET_RESERVE: ${!!exists}`);

    if (!exists) {
      return;
    }

    const winAmount = exists.amountInCents * message.multiplier;

    const process = {
      userId: message.userId,
      amount: winAmount,
      transactionType: TransactionType.CREDIT,
      transactionSource: TransactionSource.BET_PLACED,
      externalId: message.externalId,
      metadata: { timestamp: message.timestamp, tracingId },
    };

    this.logger.debug(
      `[${tracingId}] BET_PLACED data: ${JSON.stringify({
        ...process,
      })}`,
    );

    await this.transactionRepository.processTransaction(
      message.userId,
      winAmount,
      TransactionType.CREDIT,
      TransactionSource.BET_PLACED,
      message.externalId,
      { timestamp: message.timestamp, tracingId },
    );

    this.logger.log(`[${tracingId}] BET_PLACED processed for userId: ${message.userId}`);
  }

  async processCashout(message: CashoutMessage, tracingId: string) {
    this.logger.debug(`[${tracingId}] process cashout - BET_LOST message aquired for userId: ${message.userId}`);
    const exists = await this.transactionRepository.findByExternalIdAndSource(
      message.externalId,
      TransactionSource.BET_RESERVE,
    );

    this.logger.debug(`[${tracingId}] existing BET_RESERVE: ${!!exists}`);

    if (!exists) {
      return;
    }

    this.logger.debug(
      `[${tracingId}] BET_LOST data: ${JSON.stringify({
        userId: message.userId,
        amount: exists.amountInCents,
        transactionType: TransactionType.DEBIT,
        transactionSource: TransactionSource.BET_LOST,
        externalId: message.externalId,
        metadata: { timestamp: message.timestamp, tracingId },
      })}`,
    );

    await this.transactionRepository.processTransaction(
      message.userId,
      exists.amountInCents,
      TransactionType.DEBIT,
      TransactionSource.BET_LOST,
      message.externalId,
      { timestamp: message.timestamp, tracingId },
    );
  }
}
