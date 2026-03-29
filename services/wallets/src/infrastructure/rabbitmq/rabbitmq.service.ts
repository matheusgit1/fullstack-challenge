import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class RabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name);

  async processCashin(message: any) {
    this.logger.log("[RabbitMQ] cashin business process:", message);
    // TODO: adicionar lógica real de cashin aqui
  }

  async processBetPlaced(message: any) {
    this.logger.log("[RabbitMQ] bet_placed business process:", message);
    // TODO: adicionar lógica real de bet placed aqui
  }
}
