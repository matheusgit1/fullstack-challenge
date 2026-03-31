import { Injectable, Logger } from "@nestjs/common";
import { BetPlacedMessage, GameResultMessage } from "./rabbitmq.types";

@Injectable()
export class RabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name);

  async processBetPlaced(message: BetPlacedMessage) {
    this.logger.log("🎮 Aposta recebida do RabbitMQ:", message);
    // Aqui você pode adicionar lógica adicional se necessário
    // Por exemplo: atualizar banco de dados, enviar notificações, etc
  }

  async processGameResult(message: GameResultMessage) {
    this.logger.log("🎮 Resultado do jogo recebido do RabbitMQ:", message);
    // Aqui você pode adicionar lógica para processar resultados
    // Por exemplo: atualizar estatísticas, processar pagamentos, etc
  }

  async processWithdraw(message: any) {
    this.logger.log("💸 Saque recebido do RabbitMQ:", message);
    // Lógica para processar saques
  }

  async processDeposit(message: any) {
    this.logger.log("💰 Depósito recebido do RabbitMQ:", message);
    // Lógica para processar depósitos
  }
}
