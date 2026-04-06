import { Controller, Inject, Logger } from "@nestjs/common";
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from "@nestjs/microservices";
import { TransactionSource } from "../database/orm/entites/transaction.entity";
import {
  type IRabbitmqService,
  RABBITMQ_SERVICE,
} from "@/domain/rabbitmq/rabbitmq.service";

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
    @Inject(RABBITMQ_SERVICE)
    private readonly rabbitmqService: IRabbitmqService,
  ) {}

  @MessagePattern("cash")
  async onCash(
    @Payload() message: CashReserveMessage | CashinMessage | CashoutMessage,
    @Ctx() context: RmqContext,
  ) {
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
          break;
      }
      channel.ack(originalMsg);
    } catch (err) {
      channel.nack(originalMsg, false, false);
    }
  }
}
