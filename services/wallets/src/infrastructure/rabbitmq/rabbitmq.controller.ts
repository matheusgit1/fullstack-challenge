import { Controller, Logger } from "@nestjs/common";
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from "@nestjs/microservices";
import { RabbitmqService } from "./rabbitmq.service";
import { TransactionSource } from "../database/orm/entites/transaction.entity";
import { TracingService } from "../tracing/tracing.service";

export interface BaseMessage {
  tracingId: string;
}

export interface CashReserveMessage extends BaseMessage {
  cashType: TransactionSource;
  userId: string;
  amount: number;
  timestamp: string;
  externalId: string;
}
export type CashinMessage = {
  cashType: TransactionSource;
  userId: string;
  multiplier: number; // multiplicador da aposta
  timestamp: string;
  externalId: string;
} & BaseMessage;

export type CashoutMessage = {
  cashType: TransactionSource;
  userId: string;
  timestamp: string;
  externalId: string;
} & BaseMessage;

@Controller()
export class RabbitmqController {
  private readonly logger = new Logger(RabbitmqController.name);

  constructor(
    private readonly rabbitmqService: RabbitmqService,
    private readonly tracingService: TracingService,
  ) {}

  @MessagePattern("cash")
  async onCash(
    @Payload() message: CashReserveMessage | CashinMessage | CashoutMessage,
    @Ctx() context: RmqContext,
  ) {
    const tracePrefix = this.tracingService.formatTracingPrefix(
      message.tracingId,
    );

    this.logger.log(
      `${tracePrefix} [RabbitMQ] cash message received from userId: ${message.userId}`,
      { type: message.cashType, externalId: message.externalId },
    );

    const type = message.cashType;

    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      switch (type) {
        case TransactionSource.BET_PLACED:
          await this.rabbitmqService.processCashin(
            message as CashinMessage,
            message.tracingId,
          );
          break;
        case TransactionSource.BET_LOST:
          await this.rabbitmqService.processCashout(
            message as CashoutMessage,
            message.tracingId,
          );
          break;
        case TransactionSource.BET_RESERVE:
          await this.rabbitmqService.processReserve(
            message as CashReserveMessage,
            message.tracingId,
          );
          break;
        default:
          this.logger.warn(
            `${tracePrefix} Tipo de transação não suportado: ${type}`,
          );
          break;
      }
      channel.ack(originalMsg);
      this.logger.log(
        `${tracePrefix} Mensagem processada e acked com sucesso`,
      );
    } catch (err) {
      this.logger.error(
        `${tracePrefix} Erro ao processar mensagem de cash`,
        err as Error,
      );
      channel.nack(originalMsg, false, false);
    }
  }
}
