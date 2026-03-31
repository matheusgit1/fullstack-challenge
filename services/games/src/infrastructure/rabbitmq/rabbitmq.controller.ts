import { Controller, Logger } from "@nestjs/common";
import { RabbitmqService } from "./rabbitmq.service";

@Controller()
export class RabbitmqController {
  private readonly logger = new Logger(RabbitmqController.name);

  constructor(private readonly rabbitmqService: RabbitmqService) {}
}
