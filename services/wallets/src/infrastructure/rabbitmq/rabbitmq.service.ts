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
import { TracingService } from "../tracing/tracing.service";

@Injectable()
export class RabbitmqService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly tracingService: TracingService,
  ) {}

  private readonly logger = new Logger(RabbitmqService.name);

  async processReserve(message: CashReserveMessage, tracingId: string) {
    const tracePrefix = this.tracingService.formatTracingPrefix(tracingId);

    this.logger.log(
      `${tracePrefix} Processando BET_RESERVE para userId: ${message.userId}`,
      { amount: message.amount, externalId: message.externalId },
    );

    const exists = await this.transactionRepository.findByExternalIdAndSource(
      message.externalId,
      TransactionSource.BET_RESERVE,
    );

    if (exists) {
      this.logger.warn(
        `${tracePrefix} Reserva duplicada ignorada (externalId: ${message.externalId})`,
      );
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

    this.logger.log(
      `${tracePrefix} BET_RESERVE processada com sucesso - Saldo reservado: ${message.amount}`,
    );
  }

  async processCashin(message: CashinMessage, tracingId: string) {
    const tracePrefix = this.tracingService.formatTracingPrefix(tracingId);

    this.logger.log(
      `${tracePrefix} Processando BET_PLACED (CASHIN) para userId: ${message.userId}`,
      { multiplier: message.multiplier, externalId: message.externalId },
    );

    const exists = await this.transactionRepository.findByExternalIdAndSource(
      message.externalId,
      TransactionSource.BET_RESERVE,
    );

    if (!exists) {
      this.logger.warn(
        `${tracePrefix} Aposta sem reserva prévia (externalId: ${message.externalId})`,
      );
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

    this.logger.log(
      `${tracePrefix} BET_PLACED processada com sucesso - Ganhos creditados: ${winAmount}`,
    );
  }

  async processCashout(message: CashoutMessage, tracingId: string) {
    const tracePrefix = this.tracingService.formatTracingPrefix(tracingId);

    this.logger.log(
      `${tracePrefix} Processando BET_LOST (CASHOUT) para userId: ${message.userId}`,
      { externalId: message.externalId },
    );

    const exists = await this.transactionRepository.findByExternalIdAndSource(
      message.externalId,
      TransactionSource.BET_RESERVE,
    );

    if (!exists) {
      this.logger.warn(
        `${tracePrefix} Aposta sem reserva prévia (externalId: ${message.externalId})`,
      );
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

    this.logger.log(
      `${tracePrefix} BET_LOST processada com sucesso - Saldo debitado: ${exists.amountInCents}`,
    );
  }
}
