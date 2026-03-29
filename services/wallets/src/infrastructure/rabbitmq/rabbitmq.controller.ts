import { Controller, Logger } from "@nestjs/common";
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from "@nestjs/microservices";
import { RabbitmqService } from "./rabbitmq.service";

@Controller()
export class RabbitmqController {
  private readonly logger = new Logger(RabbitmqController.name);

  constructor(private readonly rabbitmqService: RabbitmqService) {}

  @MessagePattern("cashin")
  async onCashin(@Payload() message: any, @Ctx() context: RmqContext) {
    this.logger.log("[RabbitMQ] cashin message received:", message);

    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.rabbitmqService.processCashin(message);
      channel.ack(originalMsg);
      this.logger.log("[RabbitMQ] cashin message acked successfully");
    } catch (err) {
      this.logger.error("[RabbitMQ] erro ao processar cashin", err as Error);
      channel.nack(originalMsg, false, false);
    }
  }

  @MessagePattern("bet_placed")
  async onBetPlaced(@Payload() message: any, @Ctx() context: RmqContext) {
    this.logger.log("[RabbitMQ] bet_placed message received:", message);

    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.rabbitmqService.processBetPlaced(message);
      channel.ack(originalMsg);
      this.logger.log("[RabbitMQ] bet_placed message acked successfully");
    } catch (err) {
      this.logger.error(
        "[RabbitMQ] erro ao processar bet_placed",
        err as Error,
      );
      channel.nack(originalMsg, false, false);
    }
  }
}
