import { Controller, Logger } from "@nestjs/common";
import { RabbitmqService } from "./rabbitmq.service";
import { MessagePattern } from "@nestjs/microservices";

@Controller()
export class RabbitmqController {
  private readonly logger = new Logger(RabbitmqController.name);

  constructor(private readonly rabbitmqService: RabbitmqService) {}

  @MessagePattern("cash")
  onCash(message: any) {
    this.logger.log("[RabbitMQ] cash message received:", message);
  }
}
