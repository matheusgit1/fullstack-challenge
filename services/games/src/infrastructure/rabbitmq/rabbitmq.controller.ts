import { Controller, Logger } from "@nestjs/common";
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from "@nestjs/microservices";
import { RabbitmqService } from "./rabbitmq.service";
import {
  BetPlacedMessage,
  GameResultMessage,
} from "./rabbitmq.types";

@Controller()
export class RabbitmqController {
  private readonly logger = new Logger(RabbitmqController.name);

  constructor(private readonly rabbitmqService: RabbitmqService) {}

  @MessagePattern("game.bet.placed")
  async onBetPlaced(
    @Payload() message: any,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log("[RabbitMQ] Mensagem de aposta recebida:", message);

    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.rabbitmqService.processBetPlaced(message);
      channel.ack(originalMsg);
      this.logger.log("[RabbitMQ] Aposta processada com sucesso");
    } catch (err) {
      this.logger.error("[RabbitMQ] Erro ao processar aposta:", err as Error);
      channel.nack(originalMsg, false, false);
    }
  }

  @MessagePattern("game.result")
  async onGameResult(
    @Payload() message: any,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      "[RabbitMQ] Mensagem de resultado do jogo recebida:",
      message,
    );

    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.rabbitmqService.processGameResult(message);
      channel.ack(originalMsg);
      this.logger.log("[RabbitMQ] Resultado do jogo processado com sucesso");
    } catch (err) {
      this.logger.error(
        "[RabbitMQ] Erro ao processar resultado do jogo:",
        err as Error,
      );
      channel.nack(originalMsg, false, false);
    }
  }

  // @MessagePattern("wallet.withdraw")
  // async onWithdraw(@Payload() message: any, @Ctx() context: RmqContext) {
  //   this.logger.log("[RabbitMQ] Mensagem de saque recebida:", message);

  //   const channel = context.getChannelRef();
  //   const originalMsg = context.getMessage();

  //   try {
  //     await this.rabbitmqService.processWithdraw(message);
  //     channel.ack(originalMsg);
  //     this.logger.log("[RabbitMQ] Saque processado com sucesso");
  //   } catch (err) {
  //     this.logger.error("[RabbitMQ] Erro ao processar saque:", err as Error);
  //     channel.nack(originalMsg, false, false);
  //   }
  // }

  @MessagePattern("wallet.deposit")
  async onDeposit(@Payload() message: any, @Ctx() context: RmqContext) {
    this.logger.log("[RabbitMQ] Mensagem de depósito recebida:", message);

    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.rabbitmqService.processDeposit(message);
      channel.ack(originalMsg);
      this.logger.log("[RabbitMQ] Depósito processado com sucesso");
    } catch (err) {
      this.logger.error("[RabbitMQ] Erro ao processar depósito:", err as Error);
      channel.nack(originalMsg, false, false);
    }
  }
}
