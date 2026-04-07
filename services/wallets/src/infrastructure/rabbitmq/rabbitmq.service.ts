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
    this.logger.debug(`[${tracingId}] processReserve - BET_RESERVE message recebida para userId: ${message.userId}`);
    const exists = await this.transactionRepository.findByExternalIdAndSource(
      message.externalId,
      TransactionSource.BET_RESERVE,
    );

    this.logger.debug(`[${tracingId}] exists: ${exists}`);

    if (exists) {
      return;
    }

    this.logger.log(`[${tracingId}] BET_RESERVE message enviada para userId: ${message.userId}`);

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
