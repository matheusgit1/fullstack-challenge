import { Controller, Logger } from "@nestjs/common";
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from "@nestjs/microservices";
import { RabbitmqService } from "./rabbitmq.service";
import { TransactionSource } from "../database/orm/entites/transaction.entity";

export interface CashReserveMessage {
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
};

export type CashoutMessage = {
  cashType: TransactionSource;
  userId: string;
  timestamp: string;
  externalId: string;
};

@Controller()
export class RabbitmqController {
  private readonly logger = new Logger(RabbitmqController.name);

  constructor(private readonly rabbitmqService: RabbitmqService) {}

  @MessagePattern("cash")
  async onCash(
    @Payload() message: CashReserveMessage | CashinMessage | CashoutMessage,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log("[RabbitMQ] cash message received:", message);

    const type = message.cashType;

    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      switch (type) {
        case TransactionSource.BET_PLACED:
          await this.rabbitmqService.processCashin(message as CashinMessage);
          break;
        case TransactionSource.BET_LOST:
          await this.rabbitmqService.processCashout(message as CashoutMessage);
          break;
        case TransactionSource.BET_RESERVE:
          await this.rabbitmqService.processReserve(
            message as CashReserveMessage,
          );
          break;
        default:
          break;
      }
      channel.ack(originalMsg);
      this.logger.log("[RabbitMQ] cashin message acked successfully");
    } catch (err) {
      this.logger.error("[RabbitMQ] erro ao processar cashin", err as Error);
      channel.nack(originalMsg, false, false);
    }
  }
}
